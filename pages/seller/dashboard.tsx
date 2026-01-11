import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { Briefcase, Plus, Search, MessageSquare, Star } from 'lucide-react';
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

export default function SellerDashboard() {
  const { isAuthenticated, activeMode } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (activeMode !== 'SELLER') {
      router.push('/');
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastSellerPath', '/seller/dashboard');
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

  if (!isAuthenticated || activeMode !== 'SELLER') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Панель Заказчика</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-seller-border bg-seller-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-seller-primary" />
              Активные заказы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? '—' : stats?.seller.activeTasks || 0}</p>
            <p className="text-sm text-muted-foreground">Задач в работе</p>
          </CardContent>
        </Card>

        <Card className="border-seller-border bg-seller-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-seller-primary" />
              Отклики
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? '—' : stats?.seller.totalResponses || 0}</p>
            <p className="text-sm text-muted-foreground">Всего откликов</p>
          </CardContent>
        </Card>

        <Card className="border-seller-border bg-seller-accent/30">
          <CardHeader>
            <CardTitle>Бюджет</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? '—' : `${stats?.seller.totalSpent || 0} ₽`}</p>
            <p className="text-sm text-muted-foreground">Потрачено</p>
          </CardContent>
        </Card>

        <Card className="border-seller-border bg-seller-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-seller-primary" />
              Рейтинг
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {loading ? '—' : stats?.seller.rating ? `${stats.seller.rating.toFixed(1)} ⭐` : '—'}
            </p>
            <p className="text-sm text-muted-foreground">Как заказчика</p>
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
              className="w-full bg-seller-primary hover:bg-seller-primary/90 text-seller-primary-foreground" 
              size="lg"
            >
              <Link href="/tasks/create">
                <Plus className="h-4 w-4 mr-2" />
                Создать задачу
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              className="w-full border-seller-border hover:bg-seller-accent" 
              size="lg"
            >
              <Link href="/">
                <Search className="h-4 w-4 mr-2" />
                Найти исполнителя
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Мои задачи</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/seller/tasks" className="text-seller-primary hover:underline font-medium">
              Перейти к задачам →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
