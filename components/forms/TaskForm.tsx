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

type TaskFormData = {
  marketplace: 'WB' | 'OZON';
  categoryId: string;
  title: string;
  description: string;
  budget?: number;
  budgetType: 'FIXED' | 'NEGOTIABLE';
  tagIds?: string[];
};

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  taskId?: string;
}

export default function TaskForm({ initialData, taskId }: TaskFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const router = useRouter();
  const { activeMode } = useAuthStore();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      budgetType: 'FIXED',
      tagIds: [],
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

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (taskId) {
        await api.patch(`/api/tasks/${taskId}`, data);
        toast.success('Задача обновлена');
      } else {
        // Передаем activeMode при создании
        await api.post('/api/tasks', {
          ...data,
          createdInMode: activeMode || 'SELLER',
        });
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                value={field.value}
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
                <Input placeholder="Введите название задачи" {...field} />
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="budgetType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип бюджета</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    {...field}
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
