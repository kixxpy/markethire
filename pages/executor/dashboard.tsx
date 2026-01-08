import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { User, Plus, Search, TrendingUp, Star, Eye } from 'lucide-react';
import { api } from '../../src/api/client';

interface UserStats {
  seller: {
    activeTasks: number;
    totalTasks: number;
    totalResponses: number;
    totalSpent: number;
    rating: number | null;
  };
  executor: {
    activeProjects: number;
    totalResponses: number;
    totalEarned: number;
    rating: number | null;
    profileViews: number;
  };
}

export default function ExecutorDashboard() {
  const { isAuthenticated, activeMode } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
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
      localStorage.setItem('lastPerformerPath', '/executor/dashboard');
    }
    loadStats();
  }, [isAuthenticated, activeMode, router]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.get<UserStats>('/api/users/me/stats');
      setStats(data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
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
        <h1 className="text-3xl font-bold">Панель Исполнителя</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-executor-border bg-executor-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-executor-primary" />
              Заработано
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? '—' : `${stats?.executor.totalEarned || 0} ₽`}</p>
            <p className="text-sm text-muted-foreground">Всего заработано</p>
          </CardContent>
        </Card>

        <Card className="border-executor-border bg-executor-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-executor-primary" />
              Активные проекты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? '—' : stats?.executor.activeProjects || 0}</p>
            <p className="text-sm text-muted-foreground">Проектов в работе</p>
          </CardContent>
        </Card>

        <Card className="border-executor-border bg-executor-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-executor-primary" />
              Рейтинг
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {loading ? '—' : stats?.executor.rating ? `${stats.executor.rating.toFixed(1)} ⭐` : '—'}
            </p>
            <p className="text-sm text-muted-foreground">Как исполнителя</p>
          </CardContent>
        </Card>

        <Card className="border-executor-border bg-executor-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-executor-primary" />
              Просмотры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? '—' : stats?.executor.profileViews || 0}</p>
            <p className="text-sm text-muted-foreground">Просмотров профиля</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              asChild 
              className="w-full bg-executor-primary hover:bg-executor-primary/90 text-executor-primary-foreground" 
              size="lg"
            >
              <Link href="/executor/services">
                <Plus className="h-4 w-4 mr-2" />
                Создать услугу
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              className="w-full border-executor-border hover:bg-executor-accent" 
              size="lg"
            >
              <Link href="/">
                <Search className="h-4 w-4 mr-2" />
                Найти задачи
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Мои отклики</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/executor/responses" className="text-executor-primary hover:underline font-medium">
              Перейти к откликам →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
