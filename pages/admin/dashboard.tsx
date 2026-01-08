import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/api/client';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { CheckCircle2, XCircle, Clock, Users, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  budgetType: string;
  user: {
    id: string;
    username: string;
    name: string | null;
    email: string;
    telegram?: string | null;
    whatsapp?: string | null;
    emailContact?: string | null;
  };
  category: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Stats {
  users: { total: number };
  tasks: { total: number; pending: number; approved: number; rejected: number };
  responses: { total: number };
  categories: { total: number };
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [revisionComments, setRevisionComments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    loadData();
  }, [isAuthenticated, user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, statsRes] = await Promise.all([
        api.get('/api/admin/tasks/pending?page=1&limit=10'),
        api.get('/api/admin/stats'),
      ]);
      setPendingTasks(tasksRes.tasks || []);
      setStats(statsRes);
    } catch (error: any) {
      toast.error('Ошибка загрузки данных');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (taskId: string, action: 'APPROVE' | 'REJECT' | 'REVISION', comment?: string) => {
    try {
      await api.post(`/api/admin/tasks/moderate?taskId=${taskId}`, {
        action,
        comment,
      });
      toast.success(
        action === 'APPROVE' 
          ? 'Задача одобрена' 
          : action === 'REJECT'
          ? 'Задача отклонена'
          : 'Задача отправлена на доработку'
      );
      setRevisionComments(prev => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка модерации');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Панель администратора</h1>

        {/* Статистика */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">На модерации</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tasks.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Одобрено</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tasks.approved}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего задач</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tasks.total}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Задачи на модерации */}
        <Card>
          <CardHeader>
            <CardTitle>Задачи на модерации</CardTitle>
            <CardDescription>
              Проверьте и одобрите или отклоните задачи перед публикацией
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Нет задач на модерации
              </p>
            ) : (
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    {/* Название задачи */}
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
                    </div>

                    {/* Описание задачи */}
                    <div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {task.description}
                      </p>
                    </div>

                    {/* Стоимость задачи */}
                    {task.budget && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Стоимость: {task.budget.toLocaleString('ru-RU')} ₽
                          {task.budgetType === 'NEGOTIABLE' && ' (договорная)'}
                        </span>
                      </div>
                    )}

                    {/* Информация об авторе */}
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="font-medium">Автор:</div>
                      <div className="text-muted-foreground space-y-1">
                        {task.user.name && (
                          <div>Имя: {task.user.name}</div>
                        )}
                        {task.user.username && (
                          <div>Никнейм: {task.user.username}</div>
                        )}
                        {(task.user.telegram || task.user.whatsapp || task.user.emailContact) && (
                          <div className="mt-1">
                            <div className="font-medium mb-1">Контакты:</div>
                            {task.user.telegram && (
                              <div>Telegram: {task.user.telegram}</div>
                            )}
                            {task.user.whatsapp && (
                              <div>WhatsApp: {task.user.whatsapp}</div>
                            )}
                            {task.user.emailContact && (
                              <div>Email: {task.user.emailContact}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Категория и дата */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{task.category.name}</Badge>
                      <span>
                        {new Date(task.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>

                    {/* Поле для комментария при отправке на доработку */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Введите комментарий для доработки (обязательно при отправке на доработку)"
                        value={revisionComments[task.id] || ''}
                        onChange={(e) => setRevisionComments(prev => ({
                          ...prev,
                          [task.id]: e.target.value
                        }))}
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => handleModerate(task.id, 'APPROVE')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Одобрить
                      </Button>
                      <Button
                        onClick={() => {
                          const comment = prompt('Причина отклонения (необязательно):');
                          if (comment !== null) {
                            handleModerate(task.id, 'REJECT', comment || undefined);
                          }
                        }}
                        size="sm"
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Отклонить
                      </Button>
                      <Button
                        onClick={() => {
                          const comment = revisionComments[task.id];
                          if (!comment || comment.trim() === '') {
                            toast.error('Необходимо указать комментарий для доработки');
                            return;
                          }
                          handleModerate(task.id, 'REVISION', comment);
                        }}
                        size="sm"
                        variant="outline"
                        className="border-orange-500 text-orange-600 hover:bg-orange-50"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Отдать на доработку
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
