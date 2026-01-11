import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/api/client';
import TaskCard from '../../components/task/TaskCard';
import TaskCardSkeleton from '../../components/task/TaskCardSkeleton';
import Link from 'next/link';
import { Task, Category } from '@prisma/client';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

interface TaskWithRelations extends Task {
  category: Category;
  user: {
    username?: string | null;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
}

interface PaginatedTasks {
  tasks: TaskWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function MyTasksPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadTasks();
  }, [isAuthenticated, router]);

  const loadTasks = async () => {
    try {
      const data = await api.get<PaginatedTasks>('/api/tasks/my');
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Мои задачи</h1>
        <Button asChild>
          <Link href="/tasks/create">Создать задачу</Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <p className="text-muted-foreground">У вас пока нет задач</p>
            <Button asChild>
              <Link href="/tasks/create">Создать первую задачу</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} showModerationStatus={true} />
          ))}
        </div>
      )}
    </div>
  );
}
