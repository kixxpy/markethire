import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function ExecutorServicesPage() {
  const { isAuthenticated, activeMode } = useAuthStore();
  const router = useRouter();

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
  }, [isAuthenticated, activeMode, router]);

  if (!isAuthenticated || activeMode !== 'PERFORMER') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Мои услуги</h1>
        <Button>Создать услугу</Button>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Здесь будут ваши услуги</p>
          <Button>Создать первую услугу</Button>
        </CardContent>
      </Card>
    </div>
  );
}
