import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import TaskCardSkeleton from '../../components/task/TaskCardSkeleton';
import styles from './services.module.css';

export default function ExecutorServicesPage() {
  const { isAuthenticated, activeMode } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (activeMode !== 'PERFORMER') {
      router.push('/');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastPerformerPath', '/executor/services');
    }
    // Симуляция загрузки для демонстрации скелетона
    // В будущем здесь будет реальная загрузка данных
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, activeMode, router]);

  if (!isAuthenticated || activeMode !== 'PERFORMER') {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Мои услуги</h1>
        <Button className={styles.createButton}>Создать услугу</Button>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {[...Array(3)].map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <Card className={styles.card}>
          <CardContent className={styles.cardContent}>
            <p className={styles.emptyText}>Здесь будут ваши услуги</p>
            <Button className={styles.emptyButton}>Создать первую услугу</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
