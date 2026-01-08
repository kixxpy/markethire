import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function SellerTasksPage() {
  const { isAuthenticated, activeMode } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (activeMode !== 'SELLER') {
      router.push('/');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastSellerPath', '/seller/tasks');
    }
  }, [isAuthenticated, activeMode, router]);

  if (!isAuthenticated || activeMode !== 'SELLER') {
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

      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Здесь будут ваши задачи</p>
          <Button asChild>
            <Link href="/tasks/create">Создать первую задачу</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
