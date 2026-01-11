import { useState, useEffect, useRef } from 'react';
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
  marketplace: ('WB' | 'OZON' | 'YANDEX_MARKET' | 'LAMODA')[];
  categoryId: string;
  title: string;
  description: string;
  budget?: number;
  budgetType: 'FIXED' | 'NEGOTIABLE';
  images?: string[];
  tagIds?: string[];
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
  const previousCategoryIdRef = useRef<string | undefined>(initialData?.categoryId);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      budgetType: 'FIXED',
      images: [],
      marketplace: initialData?.marketplace || [],
      tagIds: initialData?.tagIds || [],
      ...initialData,
    },
  });

  const selectedCategoryId = form.watch('categoryId');
  const selectedMarketplaces = form.watch('marketplace') || [];
  const selectedTagIds = form.watch('tagIds') || [];
  const budgetType = form.watch('budgetType');

  const marketplaceOptions = [
    { value: 'WB' as const, label: 'Wildberries' },
    { value: 'OZON' as const, label: 'OZON' },
    { value: 'YANDEX_MARKET' as const, label: 'ЯндексМаркет' },
    { value: 'LAMODA' as const, label: 'Lamoda' },
  ];

  const toggleMarketplace = (value: 'WB' | 'OZON' | 'YANDEX_MARKET' | 'LAMODA') => {
    const current = selectedMarketplaces;
    const newMarketplaces = current.includes(value)
      ? current.filter(m => m !== value)
      : [...current, value];
    form.setValue('marketplace', newMarketplaces);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Загрузка тегов при выборе категории
  useEffect(() => {
    if (selectedCategoryId) {
      const categoryChanged = previousCategoryIdRef.current !== selectedCategoryId;
      loadTags(selectedCategoryId, categoryChanged);
      previousCategoryIdRef.current = selectedCategoryId;
    } else {
      setTags([]);
      form.setValue('tagIds', []);
      previousCategoryIdRef.current = undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  // Синхронизация images с формой
  useEffect(() => {
    form.setValue('images', images);
  }, [images, form]);

  const loadCategories = async () => {
    try {
      const data = await api.get<Category[]>('/api/categories');
      // Сортируем так, чтобы "Другое" всегда было в конце
      const sorted = [...data].sort((a, b) => {
        if (a.name === "Другое") return 1;
        if (b.name === "Другое") return -1;
        return a.name.localeCompare(b.name, "ru");
      });
      setCategories(sorted);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const loadTags = async (categoryId: string, clearSelectedTags: boolean = false) => {
    try {
      const data = await api.get<Tag[]>(`/api/tags?categoryId=${categoryId}`);
      setTags(data);
      // Очищаем выбранные теги только при смене категории
      if (clearSelectedTags) {
        form.setValue('tagIds', []);
      }
    } catch (error) {
      console.error('Ошибка загрузки тегов:', error);
      setTags([]);
    }
  };

  const toggleTag = (tagId: string) => {
    const current = selectedTagIds;
    const newTagIds = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId];
    form.setValue('tagIds', newTagIds);
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
        // Сначала обновляем задачу с текущим состоянием images
        // Это удалит изображения из БД, если они были удалены локально
        await api.patch(`/api/tasks/${taskId}`, {
          ...data,
          images: images, // Используем текущее состояние, которое уже содержит правильный список
        });
        
        // После обновления задачи разделяем изображения на загруженные и новые
        const newImages = images.filter(img => img.startsWith('data:'));

        // Загружаем новые изображения, если они есть
        if (newImages.length > 0) {
          // Проверяем, что после обновления задачи у нас есть место для новых изображений
          const existingImages = images.filter(img => !img.startsWith('data:'));
          const availableSlots = 3 - existingImages.length;
          
          if (availableSlots <= 0) {
            toast.warning('Максимум 3 изображения на задачу. Удалите существующие изображения, чтобы добавить новые.');
          } else {
            const imagesToUpload = newImages.slice(0, availableSlots);
            const formData = new FormData();
            
            for (let i = 0; i < imagesToUpload.length; i++) {
              const imageUrl = imagesToUpload[i];
              const blob = dataURItoBlob(imageUrl);
              const file = new File([blob], `image-${i}.jpg`, { type: blob.type });
              formData.append('images', file);
            }

            try {
              const uploadResponse = await api.post<{ images: string[] }>(`/api/tasks/${taskId}/images`, formData);
              // Обновляем состояние images с ответом сервера
              if (uploadResponse.images) {
                setImages(uploadResponse.images);
              }
            } catch (error: any) {
              console.error('Ошибка загрузки изображений:', error);
              toast.error(error.message || 'Ошибка загрузки новых изображений');
            }
          }
        }
        
        toast.success('Задача обновлена');
      } else {
        // При создании: создаем задачу, затем загружаем изображения
        // Исключаем images из data, чтобы избежать попадания data URLs в БД
        const { images: _, ...dataWithoutImages } = data;
        const taskData: any = {
          ...dataWithoutImages,
          createdInMode: activeMode || 'SELLER',
        };
        // Не отправляем data URLs при создании задачи
        // Они будут загружены отдельно через API загрузки изображений
        // Отправляем только уже загруженные URL (если есть)
        const uploadedImages = images.filter(img => !img.startsWith('data:'));
        if (uploadedImages.length > 0) {
          taskData.images = uploadedImages;
        }
        const response = await api.post<{ task: { id: string } }>('/api/tasks', taskData);

        const newTaskId = response.task.id;

        // Загружаем только новые изображения (data URLs), если они есть
        const newImages = images.filter(img => img.startsWith('data:'));
        if (newImages.length > 0) {
          const formData = new FormData();
          
          // Конвертируем data URL в файлы для загрузки
          for (let i = 0; i < newImages.length; i++) {
            const imageUrl = newImages[i];
            const blob = dataURItoBlob(imageUrl);
            const file = new File([blob], `image-${i}.jpg`, { type: blob.type });
            formData.append('images', file);
          }

          try {
            await api.post(`/api/tasks/${newTaskId}/images`, formData);
          } catch (error) {
            console.error('Ошибка загрузки изображений:', error);
            toast.warning('Задача создана, но не все изображения загружены');
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
              <FormLabel>Маркетплейсы *</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {marketplaceOptions.map((option) => {
                    const isSelected = selectedMarketplaces.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleMarketplace(option.value)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </FormControl>
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

        {selectedCategoryId && tags.length > 0 && (
          <FormField
            control={form.control}
            name="tagIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Теги (опционально)</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
                          }`}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
                <FormLabel>Тип цены</FormLabel>
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
                <FormLabel>Цена</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    {budgetType === 'NEGOTIABLE' && (
                      <span className="text-sm text-muted-foreground whitespace-nowrap">от</span>
                    )}
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      className={budgetType === 'NEGOTIABLE' ? 'flex-1' : ''}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">₽</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
