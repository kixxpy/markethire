import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema } from '../../src/lib/validation';
import { api } from '../../src/api/client';
import { Category, Tag } from '@prisma/client';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import TaskImageUpload from './TaskImageUpload';

type TaskFormData = {
  marketplace: 'WB' | 'OZON';
  categoryId: string;
  title: string;
  description: string;
  budget?: number;
  budgetType: 'FIXED' | 'NEGOTIABLE';
  tagIds?: string[];
  images?: string[];
};

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  taskId?: string;
}

export default function TaskForm({ initialData, taskId }: TaskFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const router = useRouter();
  const { activeMode } = useAuthStore();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      budgetType: 'FIXED',
      tagIds: [],
      images: [],
      ...initialData,
    },
  });

  const selectedCategoryId = form.watch('categoryId');
  const selectedTags = form.watch('tagIds') || [];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadTags(selectedCategoryId);
    } else {
      setTags([]);
      form.setValue('tagIds', []);
    }
  }, [selectedCategoryId, form]);

  // Синхронизация images с формой
  useEffect(() => {
    form.setValue('images', images);
  }, [images, form]);

  const loadCategories = async () => {
    try {
      const data = await api.get<Category[]>('/api/categories');
      setCategories(data);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const loadTags = async (categoryId: string) => {
    try {
      const data = await api.get<Tag[]>(`/api/tags?categoryId=${categoryId}`);
      setTags(data);
    } catch (error) {
      console.error('Ошибка загрузки тегов:', error);
    }
  };

  const toggleTag = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    form.setValue('tagIds', newTags);
  };

  // Конвертация data URI в Blob без использования fetch (для соответствия CSP)
  const dataURItoBlob = (dataURI: string): Blob => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (taskId) {
        // При обновлении: разделяем изображения на загруженные и новые
        const uploadedImages = images.filter(img => img.startsWith('/uploads/tasks/'));
        const newImages = images.filter(img => img.startsWith('data:'));

        // Загружаем новые изображения, если они есть
        if (newImages.length > 0) {
          const formData = new FormData();
          
          for (let i = 0; i < newImages.length; i++) {
            const imageUrl = newImages[i];
            const blob = dataURItoBlob(imageUrl);
            const file = new File([blob], `image-${i}.jpg`, { type: blob.type });
            formData.append('images', file);
          }

          try {
            const uploadResponse = await api.post<{ images: string[] }>(`/api/tasks/${taskId}/images`, formData);
            // Используем полный список изображений из ответа API
            const allImages = uploadResponse.images;
            
            // Обновляем задачу с полным списком изображений
            await api.patch(`/api/tasks/${taskId}`, {
              ...data,
              images: allImages,
            });
          } catch (error) {
            console.error('Ошибка загрузки изображений:', error);
            // Обновляем задачу без новых изображений
            await api.patch(`/api/tasks/${taskId}`, {
              ...data,
              images: uploadedImages,
            });
            toast.warning('Задача обновлена, но не все изображения загружены');
            return;
          }
        } else {
          // Если новых изображений нет, просто обновляем задачу со всеми изображениями
          await api.patch(`/api/tasks/${taskId}`, {
            ...data,
            images: images, // Используем все изображения (могут быть удалены некоторые)
          });
        }
        
        toast.success('Задача обновлена');
      } else {
        // При создании: создаем задачу, затем загружаем изображения
        const response = await api.post<{ task: { id: string } }>('/api/tasks', {
          ...data,
          createdInMode: activeMode || 'SELLER',
          images: [], // Сначала создаем без изображений
        });

        const newTaskId = response.task.id;

        // Загружаем изображения, если они есть
        if (images.length > 0) {
          const formData = new FormData();
          
          // Конвертируем data URL в файлы для загрузки
          for (let i = 0; i < images.length; i++) {
            const imageUrl = images[i];
            if (imageUrl.startsWith('data:')) {
              // Это локальное превью, нужно загрузить
              const blob = dataURItoBlob(imageUrl);
              const file = new File([blob], `image-${i}.jpg`, { type: blob.type });
              formData.append('images', file);
            }
          }

          if (formData.has('images')) {
            try {
              await api.post(`/api/tasks/${newTaskId}/images`, formData);
            } catch (error) {
              console.error('Ошибка загрузки изображений:', error);
              toast.warning('Задача создана, но не все изображения загружены');
            }
          }
        }

        toast.success('Задача успешно создана и отправлена на модерацию. Вы получите уведомление после проверки администратором.');
      }
      
      // Редирект в зависимости от режима
      if (activeMode === 'PERFORMER') {
        router.push('/executor/tasks');
      } else {
        router.push('/seller/tasks');
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка сохранения задачи');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="marketplace"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Маркетплейс *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите маркетплейс" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="WB">Wildberries</SelectItem>
                  <SelectItem value="OZON">OZON</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Категория *</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value) {
                    loadTags(value);
                  } else {
                    setTags([]);
                    form.setValue('tagIds', []);
                  }
                }}
                value={field.value || ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Заголовок *</FormLabel>
              <FormControl>
                <Input placeholder="Введите название задачи" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Опишите задачу подробно"
                  rows={6}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Компонент загрузки изображений */}
        <TaskImageUpload
          images={images}
          onImagesChange={setImages}
          taskId={taskId}
          disabled={form.formState.isSubmitting}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="budgetType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип бюджета</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'FIXED'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FIXED">Фиксированный</SelectItem>
                    <SelectItem value="NEGOTIABLE">Договорная</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Бюджет (₽)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {selectedCategoryId && tags.length > 0 && (
          <FormField
            control={form.control}
            name="tagIds"
            render={() => (
              <FormItem>
                <FormLabel>Теги</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className={`px-2.5 py-0.5 rounded text-sm cursor-pointer transition-colors ${
                        selectedTags.includes(tag.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Сохранение...' : taskId ? 'Обновить' : 'Создать'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
