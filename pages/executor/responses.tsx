import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { getDisplayName } from '../../src/lib/utils';
import styles from './responses.module.css';

interface Response {
  id: string;
  message: string;
  price: number | null;
  deadline: string | null;
  createdAt: Date;
  task: {
    id: string;
    title: string;
    status: string;
    budget: number | null;
    budgetType: string;
    category: {
      id: string;
      name: string;
    };
    user: {
      id: string;
      username: string | null;
      name: string | null;
      email: string;
    };
  };
}

interface PaginatedResponses {
  responses: Response[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ExecutorResponsesPage() {
  const { isAuthenticated, activeMode, user } = useAuthStore();
  const router = useRouter();
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      localStorage.setItem('lastPerformerPath', '/executor/responses');
    }
    loadResponses();
  }, [isAuthenticated, activeMode, router, page]);

  const loadResponses = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      setLoading(true);
      const data = await api.get<PaginatedResponses>(`/api/responses/my?page=${page}&limit=20`);
      setResponses(data.responses);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      console.error('Ошибка загрузки откликов:', error);
      toast.error('Не удалось загрузить отклики');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (responseId: string) => {
    try {
      setDeletingId(responseId);
      await api.delete(`/api/responses/${responseId}`);
      toast.success('Отклик удален');
      loadResponses();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления отклика');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthenticated || activeMode !== 'PERFORMER') {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Мои отклики</h1>
      
      {loading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ) : responses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">У вас пока нет откликов</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {responses.map((response) => (
              <Card key={response.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        <Link 
                          href={`/tasks/${response.task.id}`}
                          className="hover:underline"
                        >
                          {response.task.title}
                        </Link>
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span>{response.task.category.name}</span>
                        <span>•</span>
                        <span>{getDisplayName(response.task.user.username, response.task.user.email)}</span>
                        <span>•</span>
                        <span>
                          {new Date(response.createdAt).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === response.id}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить отклик?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Вы уверены, что хотите удалить свой отклик на задачу "{response.task.title}"? 
                            Это действие нельзя отменить.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(response.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">{response.message}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {response.price && (
                        <span className="font-semibold">
                          Цена: {response.price.toLocaleString('ru-RU')} ₽
                        </span>
                      )}
                      {response.deadline && (
                        <span className="text-muted-foreground">
                          Срок: {response.deadline}
                        </span>
                      )}
                      <span className={response.task.status === 'OPEN' ? 'text-green-600' : 'text-muted-foreground'}>
                        {response.task.status === 'OPEN' ? 'Задача открыта' : 'Задача закрыта'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Назад
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Страница {page} из {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Вперед
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
