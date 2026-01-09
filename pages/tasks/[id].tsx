import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '../../src/api/client';
import { Task, Category, Marketplace, TaskStatus, TaskModerationStatus } from '@prisma/client';
import ResponseForm from '../../components/forms/ResponseForm';
import { useAuthStore } from '../../src/store/authStore';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { Skeleton } from '../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../components/ui/alert';
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
import { getDisplayName } from '../../src/lib/utils';

interface TaskWithRelations extends Task {
  category: Category;
  moderationStatus?: TaskModerationStatus;
  moderationComment?: string | null;
  user: {
    id: string;
    username: string | null;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  responses: Array<{
    id: string;
    message: string;
    price: number | null;
    deadline: string | null;
    createdAt: Date;
    user: {
      id: string;
      username: string | null;
      name: string | null;
      email: string;
    };
  }>;
}

const marketplaceLabels: Record<Marketplace, string> = {
  WB: 'Wildberries',
  OZON: 'OZON',
};

const statusLabels: Record<TaskStatus, string> = {
  OPEN: 'Открыта',
  CLOSED: 'Закрыта',
};


export default function TaskDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuthStore();
  const [task, setTask] = useState<TaskWithRelations | null>(null);
  const [responses, setResponses] = useState<TaskWithRelations['responses']>([]);
  const [loading, setLoading] = useState(true);
  const [showResponseForm, setShowResponseForm] = useState(false);

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  useEffect(() => {
    if (task && user && task.userId === user.id) {
      loadResponses();
    }
  }, [task, user]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const data = await api.get<TaskWithRelations>(`/api/tasks/${id}`);
      setTask(data);
    } catch (error: any) {
      console.error('Ошибка загрузки задачи:', error);
      const errorMessage = error?.message || 'Ошибка загрузки задачи';
      
      if (errorMessage.includes('не найдена') || errorMessage.includes('404')) {
        toast.error('Задача не найдена или была удалена');
      } else {
        toast.error('Не удалось загрузить задачу');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadResponses = async () => {
    if (!isAuthenticated || !user || !task || task.userId !== user.id) {
      return;
    }
    try {
      const data = await api.get<TaskWithRelations['responses']>(`/api/tasks/${id}/responses`);
      setResponses(data);
    } catch (error) {
      console.error('Ошибка загрузки откликов:', error);
    }
  };

  const handleDeleteTask = async () => {
    try {
      await api.delete(`/api/tasks/${id}`);
      toast.success('Задача удалена');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления задачи');
    }
  };

  const isOwner = task && user && task.userId === user.id;
  const isAdmin = user?.role === 'ADMIN';
  const canRespond = isAuthenticated && task && !isOwner && task.status === 'OPEN';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!task) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Задача не найдена</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <CardTitle className="text-2xl">{task.title}</CardTitle>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{marketplaceLabels[task.marketplace]}</span>
                <span>{task.category.name}</span>
                {task.tags.map((taskTag, idx) => (
                  <span key={taskTag.id || idx}>
                    {taskTag.name}
                  </span>
                ))}
                <span>
                  {statusLabels[task.status]}
                </span>
              </div>
            </div>
            {(isOwner || isAdmin) && (
              <div className="flex gap-2">
                {isOwner && task.status === 'OPEN' && (
                  <Button variant="outline" asChild>
                    <Link href={`/tasks/${task.id}/edit`}>Редактировать</Link>
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      {isAdmin ? 'Удалить (админ)' : 'Удалить'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {isAdmin ? 'Удалить задачу (администратор)?' : 'Удалить задачу?'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {isAdmin 
                          ? 'Вы уверены, что хотите удалить эту задачу как администратор? Владелец задачи получит уведомление. Это действие нельзя отменить.'
                          : 'Вы уверены, что хотите удалить задачу? Это действие нельзя отменить.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteTask}>
                        Удалить задачу
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Описание</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {task.budget && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Бюджет:</span>
                <p className="text-lg font-semibold">
                  {task.budget.toLocaleString('ru-RU')} ₽
                  {task.budgetType === 'NEGOTIABLE' && ' (договорная)'}
                </p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-muted-foreground">Автор:</span>
              <p className="text-lg">{getDisplayName(task.user.username, task.user.email)}</p>
            </div>
          </div>

          <Separator />

          {isOwner && task.moderationStatus === 'REJECTED' && task.moderationComment && (
            <>
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Задача отклонена:</strong> {task.moderationComment}
                </AlertDescription>
              </Alert>
              <Separator />
            </>
          )}

          {isOwner && task.moderationStatus === 'PENDING' && (
            <>
              <Alert>
                <AlertDescription>
                  Ваша задача находится на модерации. Она будет опубликована после одобрения администратором.
                </AlertDescription>
              </Alert>
              <Separator />
            </>
          )}

          <p className="text-sm text-muted-foreground">
            Создано: {new Date(task.createdAt).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </CardContent>
      </Card>

      {canRespond && (
        <Card>
          <CardContent className="p-6">
            {!showResponseForm ? (
              <Button
                onClick={() => setShowResponseForm(true)}
                className="w-full"
              >
                Откликнуться на задачу
              </Button>
            ) : (
              <div className="space-y-4">
                <CardTitle>Откликнуться на задачу</CardTitle>
                <ResponseForm
                  taskId={task.id}
                  onSuccess={() => {
                    setShowResponseForm(false);
                    loadResponses();
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Отклики ({responses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Пока нет откликов</p>
            ) : (
              <div className="space-y-4">
                {responses.map((response) => (
                  <Card key={response.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{getDisplayName(response.user.username, response.user.email)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(response.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        {response.price && (
                          <span className="text-lg font-semibold">
                            {response.price.toLocaleString('ru-RU')} ₽
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{response.message}</p>
                      {response.deadline && (
                        <p className="text-xs text-muted-foreground">Срок: {response.deadline}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
