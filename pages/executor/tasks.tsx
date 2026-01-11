import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/api/client';
import TaskCard from '../../components/task/TaskCard';
import TaskCardSkeleton from '../../components/task/TaskCardSkeleton';
import { TaskPagesSwitcher } from '../../components/task/TaskPagesSwitcher';
import Link from 'next/link';
import { Task, Category } from '@prisma/client';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import styles from './tasks.module.css';

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
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Мои услуги (как исполнитель)</h1>
          <TaskPagesSwitcher />
        </div>
        <Button asChild className={styles.createButton}>
          <Link href="/tasks/create">Создать услугу</Link>
        </Button>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {[...Array(3)].map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card className={styles.card}>
          <CardContent className={styles.emptyCardContent}>
            <p className={styles.emptyText}>Здесь будут ваши услуги, созданные в режиме исполнителя</p>
            <Button asChild className={styles.emptyButton}>
              <Link href="/tasks/create">Создать первую услугу</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={styles.grid}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} showModerationStatus={true} />
          ))}
        </div>
      )}
    </div>
  );
}
