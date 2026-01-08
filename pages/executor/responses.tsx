import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { Card, CardContent } from '../../components/ui/card';

export default function ExecutorResponsesPage() {
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
      localStorage.setItem('lastPerformerPath', '/executor/responses');
    }
  }, [isAuthenticated, activeMode, router]);

  if (!isAuthenticated || activeMode !== 'PERFORMER') {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Мои отклики</h1>
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Здесь будут ваши отклики на задачи</p>
        </CardContent>
      </Card>
    </div>
  );
}
