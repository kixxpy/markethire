import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import TaskForm from '../../components/forms/TaskForm';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function CreateTaskPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Создать задачу</h1>
      <Card>
        <CardHeader>
          <CardTitle>Новая задача</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm />
        </CardContent>
      </Card>
    </div>
  );
}
