import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/api/client';
import TaskCard from '../../components/task/TaskCard';
import { TaskPagesSwitcher } from '../../components/task/TaskPagesSwitcher';
import Link from 'next/link';
import { Task, Category } from '@prisma/client';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';

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

export default function ExecutorTasksPage() {
  const { isAuthenticated, activeMode } = useAuthStore();
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (activeMode !== 'PERFORMER') {
      router.push('/');
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastPerformerPath', '/executor/tasks');
    }
    loadTasks();
  }, [isAuthenticated, activeMode, router]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await api.get<PaginatedTasks>('/api/tasks/my?createdInMode=PERFORMER');
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || activeMode !== 'PERFORMER') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Мои услуги (как исполнитель)</h1>
          <TaskPagesSwitcher />
        </div>
        <Button asChild>
          <Link href="/tasks/create">Создать услугу</Link>
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Skeleton className="h-4 w-32 mx-auto" />
          </CardContent>
        </Card>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <p className="text-muted-foreground">Здесь будут ваши услуги, созданные в режиме исполнителя</p>
            <Button asChild>
              <Link href="/tasks/create">Создать первую услугу</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
