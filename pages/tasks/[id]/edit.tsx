import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../../src/store/authStore';
import { api } from '../../../src/api/client';
import TaskForm from '../../../components/forms/TaskForm';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';

export default function EditTaskPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuthStore();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && isAuthenticated) {
      loadTask();
    } else if (!isAuthenticated) {
      router.push('/login');
    }
  }, [id, isAuthenticated, router]);

  const loadTask = async () => {
    try {
      const data = await api.get(`/api/tasks/${id}`);
      if (data.userId !== user?.id) {
        router.push('/');
        return;
      }
      setTask({
        marketplace: data.marketplace,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        budget: data.budget,
        budgetType: data.budgetType,
        tagIds: data.tags?.map((t: any) => t.tag.id) || [],
      });
    } catch (error) {
      console.error('Ошибка загрузки задачи:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Редактировать задачу</h1>
      <Card>
        <CardHeader>
          <CardTitle>Редактирование задачи</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm initialData={task} taskId={id as string} />
        </CardContent>
      </Card>
    </div>
  );
}
