import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/api/client';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { CheckCircle2, XCircle, Clock, Users, FileText, RefreshCw, Trash2, BarChart3, FolderTree, Image as ImageIcon, Plus, Edit, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../src/lib/utils';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import styles from './dashboard.module.css';

interface Task {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  budgetType: string;
  images?: string[];
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

type TabType = 'moderation' | 'users' | 'categories' | 'analytics' | 'ads';

interface Ad {
  id: string;
  imageUrl: string;
  link: string | null;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [revisionComments, setRevisionComments] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<TabType>('moderation');
  const [ads, setAds] = useState<Ad[]>([]);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [isAdFormOpen, setIsAdFormOpen] = useState(false);
  const [adFormData, setAdFormData] = useState({
    imageUrl: '',
    link: '',
    position: 0,
    isActive: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const adImageInputRef = useRef<HTMLInputElement>(null);
  const [taskHistory, setTaskHistory] = useState<Record<string, any[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<Record<string, boolean>>({});
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    loadData();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (activeTab === 'ads') {
      loadAds();
    }
  }, [activeTab]);

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

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/api/tasks/${taskId}`);
      toast.success('Задача удалена');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления задачи');
    }
  };

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const loadTaskHistory = async (taskId: string) => {
    if (taskHistory[taskId]) {
      // История уже загружена, скрываем её
      setTaskHistory(prev => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });
      return;
    }

    try {
      setLoadingHistory(prev => ({ ...prev, [taskId]: true }));
      const history = await api.get(`/api/admin/tasks/${taskId}/history`);
      setTaskHistory(prev => ({ ...prev, [taskId]: history }));
    } catch (error: any) {
      console.error('Ошибка загрузки истории:', error);
      toast.error('Ошибка загрузки истории изменений');
    } finally {
      setLoadingHistory(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const formatFieldValue = (field: string, value: any): string => {
    if (value === null || value === undefined) {
      return '(не указано)';
    }

    if (field === 'marketplace') {
      if (Array.isArray(value)) {
        const marketplaceLabels: Record<string, string> = {
          WB: 'Wildberries',
          OZON: 'OZON',
          YANDEX_MARKET: 'ЯндексМаркет',
          LAMODA: 'Lamoda',
        };
        return value.map(mp => marketplaceLabels[mp] || mp).join(', ') || '(не указано)';
      }
      return String(value);
    }

    if (field === 'tagIds') {
      if (Array.isArray(value)) {
        return value.length > 0 ? `${value.length} тег(ов)` : '(нет тегов)';
      }
      return String(value);
    }

    if (field === 'images') {
      if (Array.isArray(value)) {
        return value.length > 0 ? `${value.length} изображение(й)` : '(нет изображений)';
      }
      return String(value);
    }

    if (field === 'budget') {
      return value ? `${value.toLocaleString('ru-RU')} ₽` : '(не указано)';
    }

    if (field === 'budgetType') {
      return value === 'FIXED' ? 'Фиксированная' : value === 'NEGOTIABLE' ? 'Договорная' : String(value);
    }

    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }

    return String(value);
  };

  const loadAds = async () => {
    try {
      const data = await api.get<{ ads: Ad[] }>('/api/ads');
      setAds(data.ads);
    } catch (error: any) {
      toast.error('Ошибка загрузки рекламы');
      console.error(error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка наличия токена
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      toast.error('Необходима авторизация. Пожалуйста, войдите в систему.');
      router.push('/login');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post<{ imageUrl: string }>('/api/admin/ads/upload', formData);
      
      // Убеждаемся, что response содержит imageUrl
      if (response && response.imageUrl) {
        setAdFormData(prev => ({ ...prev, imageUrl: response.imageUrl }));
        toast.success('Изображение загружено');
      } else {
        throw new Error('Неожиданный формат ответа от сервера');
      }
    } catch (error: any) {
      console.error('Ошибка загрузки изображения:', error);
      
      // Извлекаем сообщение об ошибке
      let errorMessage = error.message || 'Ошибка загрузки изображения';
      
      // Если есть детали ошибки, добавляем их в консоль
      if (error.message && error.message.includes('Детали:')) {
        console.error('Детали ошибки:', error.message);
      }
      
      if (error.message?.includes('401') || error.message?.includes('авторизац')) {
        toast.error('Ошибка авторизации. Пожалуйста, войдите в систему заново.');
        router.push('/login');
      } else {
        // Показываем только основное сообщение об ошибке (без деталей для пользователя)
        const userFriendlyMessage = errorMessage.split('\n\nДетали:')[0];
        toast.error(userFriendlyMessage || 'Ошибка загрузки изображения');
      }
    } finally {
      setUploadingImage(false);
      // Сбрасываем значение input, чтобы можно было загрузить тот же файл снова
      if (adImageInputRef.current) {
        adImageInputRef.current.value = '';
      }
    }
  };

  const handleImageButtonClick = () => {
    adImageInputRef.current?.click();
  };

  const handleCreateAd = async () => {
    try {
      if (!adFormData.imageUrl) {
        toast.error('Необходимо загрузить изображение');
        return;
      }

      if (!adFormData.link || adFormData.link.trim() === '') {
        toast.error('Необходимо указать ссылку');
        return;
      }

      // Валидация URL
      try {
        new URL(adFormData.link);
      } catch {
        toast.error('Некорректный формат URL');
        return;
      }

      // Проверка наличия токена
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        toast.error('Необходима авторизация. Пожалуйста, войдите в систему.');
        router.push('/login');
        return;
      }

      await api.post('/api/ads', {
        ...adFormData,
        link: adFormData.link.trim(),
      });

      toast.success('Рекламный блок создан');
      setIsAdFormOpen(false);
      setAdFormData({ imageUrl: '', link: '', position: 0, isActive: true });
      loadAds();
    } catch (error: any) {
      console.error('Ошибка создания рекламы:', error);
      if (error.message?.includes('401') || error.message?.includes('авторизац')) {
        toast.error('Ошибка авторизации. Пожалуйста, войдите в систему заново.');
        router.push('/login');
      } else {
        toast.error(error.message || 'Ошибка создания рекламного блока');
      }
    }
  };

  const handleUpdateAd = async () => {
    if (!editingAd) return;

    try {
      if (!adFormData.link || adFormData.link.trim() === '') {
        toast.error('Необходимо указать ссылку');
        return;
      }

      // Валидация URL
      try {
        new URL(adFormData.link);
      } catch {
        toast.error('Некорректный формат URL');
        return;
      }

      // Подготавливаем данные для отправки
      const updateData: {
        link: string;
        position: number;
        isActive: boolean;
        imageUrl?: string;
      } = {
        link: adFormData.link.trim(),
        position: adFormData.position,
        isActive: adFormData.isActive,
      };

      // Включаем imageUrl только если он был изменен
      if (adFormData.imageUrl && adFormData.imageUrl !== editingAd.imageUrl) {
        updateData.imageUrl = adFormData.imageUrl;
      }

      await api.patch(`/api/ads/${editingAd.id}`, updateData);

      toast.success('Рекламный блок обновлен');
      setEditingAd(null);
      setIsAdFormOpen(false);
      setAdFormData({ imageUrl: '', link: '', position: 0, isActive: true });
      loadAds();
    } catch (error: any) {
      console.error('Ошибка обновления рекламы:', error);
      if (error.message?.includes('Ошибка валидации')) {
        toast.error('Ошибка валидации данных. Проверьте введенные данные.');
      } else {
        toast.error(error.message || 'Ошибка обновления рекламного блока');
      }
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Удалить рекламный блок?')) return;

    try {
      await api.delete(`/api/ads/${id}`);
      toast.success('Рекламный блок удален');
      loadAds();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления рекламного блока');
    }
  };

  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad);
    setAdFormData({
      imageUrl: ad.imageUrl,
      link: ad.link || '',
      position: ad.position,
      isActive: ad.isActive,
    });
    setIsAdFormOpen(true);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
        <h1 className={styles.title}>Панель администратора</h1>

        {/* Табы */}
        <div className={styles.tabsContainer}>
          <button
            onClick={() => setActiveTab('moderation')}
            className={cn(styles.tabButton, activeTab === 'moderation' && styles.tabButtonActive)}
          >
            <Clock className={styles.tabIcon} />
            Модерация
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={cn(styles.tabButton, activeTab === 'users' && styles.tabButtonActive)}
          >
            <Users className={styles.tabIcon} />
            Пользователи
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={cn(styles.tabButton, activeTab === 'categories' && styles.tabButtonActive)}
          >
            <FolderTree className={styles.tabIcon} />
            Категории
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(styles.tabButton, activeTab === 'analytics' && styles.tabButtonActive)}
          >
            <BarChart3 className={styles.tabIcon} />
            Аналитика
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className={cn(styles.tabButton, activeTab === 'ads' && styles.tabButtonActive)}
          >
            <ImageIcon className={styles.tabIcon} />
            Реклама
          </button>
        </div>

        {/* Статистика - показываем на всех табах */}
        {stats && (
          <div className={styles.statsGrid}>
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

        {/* Контент табов */}
        {activeTab === 'moderation' && (
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
                {pendingTasks.map((task) => {
                  const isExpanded = expandedTasks.has(task.id);
                  
                  return (
                    <div
                      key={task.id}
                      className={styles.taskCard}
                    >
                      {/* Заголовок с кнопкой разворачивания */}
                      <div className={styles.taskHeader}>
                        <div className="flex-1">
                          <h3 className={styles.taskTitle}>{task.title}</h3>
                          <div className={styles.taskMeta}>
                            <Badge variant="outline">{task.category.name}</Badge>
                            <span>
                              {new Date(task.createdAt).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => toggleTaskExpanded(task.id)}
                          size="sm"
                          variant="ghost"
                          className={styles.taskExpandButton}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Свернуть
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Развернуть
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Свернутое содержимое - только краткая информация */}
                      {!isExpanded && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            {task.budget && (
                              <span className="font-medium">
                                Цена: {task.budgetType === 'NEGOTIABLE' 
                                  ? `от ${task.budget.toLocaleString('ru-RU')} ₽`
                                  : `${task.budget.toLocaleString('ru-RU')} ₽`}
                              </span>
                            )}
                            {task.images && task.images.length > 0 && (
                              <span className="text-muted-foreground">
                                Фото: {task.images.length}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Автор: {task.user.name || task.user.username || task.user.email}
                          </div>
                        </div>
                      )}

                      {/* Развернутое содержимое */}
                      {isExpanded && (
                        <div className={styles.taskContent}>
                          {/* Описание задачи */}
                          <div>
                            <p className={styles.taskDescription}>
                              {task.description}
                            </p>
                          </div>

                          {/* Изображения задачи */}
                          {task.images && task.images.length > 0 && (
                            <div>
                              <div className="text-sm font-medium mb-2">Фотографии ({task.images.length}):</div>
                              <div className={styles.taskImages}>
                                {task.images.map((imageUrl, index) => (
                                  <div 
                                    key={index} 
                                    className={styles.taskImage}
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={`${task.title} - изображение ${index + 1}`}
                                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(imageUrl, '_blank')}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Стоимость задачи */}
                          {task.budget && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                Цена: {task.budgetType === 'NEGOTIABLE' 
                                  ? `от ${task.budget.toLocaleString('ru-RU')} ₽`
                                  : `${task.budget.toLocaleString('ru-RU')} ₽`}
                              </span>
                            </div>
                          )}

                          {/* Информация об авторе */}
                          <div className={styles.taskAuthor}>
                            <div className={styles.taskAuthorLabel}>Автор:</div>
                            <div className={styles.taskAuthorInfo}>
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
                        </div>
                      )}

                      {/* История изменений - только в развернутом виде */}
                      {isExpanded && (
                        <>
                          {taskHistory[task.id] && taskHistory[task.id].length > 0 && (
                            <div className={styles.taskHistory}>
                              <h4 className={styles.taskHistoryTitle}>История изменений:</h4>
                              <div className={styles.taskHistoryList}>
                                {taskHistory[task.id].map((historyItem, idx) => (
                                  <div key={idx} className={styles.taskHistoryItem}>
                                    <div className="font-medium">
                                      Изменено: {new Date(historyItem.createdAt).toLocaleString('ru-RU')}
                                    </div>
                                    {historyItem.reason && (
                                      <div className="text-muted-foreground">
                                        Причина: {historyItem.reason}
                                      </div>
                                    )}
                                    <div className="text-muted-foreground">
                                      Измененные поля: <span className="font-medium">{historyItem.changedFields.join(', ')}</span>
                                    </div>
                                    {Object.entries(historyItem.changes || {}).map(([field, change]: [string, any]) => (
                                      <div key={field} className={styles.taskHistoryField}>
                                        <div className="font-medium capitalize">{field}:</div>
                                        <div className="flex flex-col gap-1">
                                          <div className="line-through text-red-600 dark:text-red-400 text-xs">
                                            Было: {formatFieldValue(field, change.old)}
                                          </div>
                                          <div className="text-green-600 dark:text-green-400 text-xs">
                                            Стало: {formatFieldValue(field, change.new)}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Кнопка загрузки истории */}
                          <Button
                            onClick={() => loadTaskHistory(task.id)}
                            size="sm"
                            variant="outline"
                            disabled={loadingHistory[task.id]}
                          >
                            {loadingHistory[task.id] ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Загрузка...
                              </>
                            ) : taskHistory[task.id] ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Скрыть историю изменений
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Показать историю изменений
                              </>
                            )}
                          </Button>

                          {/* Поле для комментария при отправке на доработку */}
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Введите комментарий для доработки (обязательно при отправке на доработку)"
                              value={revisionComments[task.id] || ''}
                              onChange={(e) => setRevisionComments(prev => ({
                                ...prev,
                                [task.id]: e.target.value
                              }))}
                              className={styles.commentTextarea}
                            />
                          </div>
                        </>
                      )}

                    {/* Кнопки действий */}
                    <div className={styles.taskActions}>
                      <Button
                        onClick={() => handleModerate(task.id, 'APPROVE')}
                        size="sm"
                        className={cn(styles.taskActionButton, "bg-green-600 hover:bg-green-700")}
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
                        className={styles.taskActionButton}
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
                        className={cn(styles.taskActionButton, "border-orange-500 text-orange-600 hover:bg-orange-50")}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Отдать на доработку
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            className={cn(styles.taskActionButton, "bg-red-600 hover:bg-red-700")}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Удалить
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы уверены, что хотите удалить эту задачу? Владелец задачи получит уведомление. Это действие нельзя отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTask(task.id)}>
                              Удалить задачу
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>Управление пользователями</CardTitle>
              <CardDescription>
                Просмотр и управление пользователями платформы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Функционал управления пользователями будет добавлен в ближайшее время
              </p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'categories' && (
          <Card>
            <CardHeader>
              <CardTitle>Управление категориями</CardTitle>
              <CardDescription>
                Создание и редактирование категорий задач
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Функционал управления категориями будет добавлен в ближайшее время
              </p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <Card>
            <CardHeader>
              <CardTitle>Аналитика</CardTitle>
              <CardDescription>
                Статистика и аналитика по платформе
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats && (
                  <div className={styles.analyticsGrid}>
                    <div className={styles.analyticsCard}>
                      <div className={styles.analyticsCardLabel}>Всего пользователей</div>
                      <div className={styles.analyticsCardValue}>{stats.users.total}</div>
                    </div>
                    <div className={styles.analyticsCard}>
                      <div className={styles.analyticsCardLabel}>Всего задач</div>
                      <div className={styles.analyticsCardValue}>{stats.tasks.total}</div>
                    </div>
                    <div className={styles.analyticsCard}>
                      <div className={styles.analyticsCardLabel}>Одобрено задач</div>
                      <div className={cn(styles.analyticsCardValue, "text-green-600")}>{stats.tasks.approved}</div>
                    </div>
                    <div className={styles.analyticsCard}>
                      <div className={styles.analyticsCardLabel}>Отклонено задач</div>
                      <div className={cn(styles.analyticsCardValue, "text-red-600")}>{stats.tasks.rejected}</div>
                    </div>
                    <div className={styles.analyticsCard}>
                      <div className={styles.analyticsCardLabel}>Всего откликов</div>
                      <div className={styles.analyticsCardValue}>{stats.responses.total}</div>
                    </div>
                    <div className={styles.analyticsCard}>
                      <div className={styles.analyticsCardLabel}>Категорий</div>
                      <div className={styles.analyticsCardValue}>{stats.categories.total}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'ads' && (
          <Card>
            <CardHeader>
              <div className={styles.adsHeader}>
                <div className={styles.adsHeaderContent}>
                  <CardTitle>Управление рекламой</CardTitle>
                  <CardDescription>
                    Добавление и управление рекламными блоками на сайте
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setEditingAd(null);
                    setAdFormData({ imageUrl: '', link: '', position: 0, isActive: true });
                    setIsAdFormOpen(true);
                  }}
                  className={styles.adsHeaderButton}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить рекламу
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ads.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Нет рекламных блоков
                </p>
              ) : (
                <div className="space-y-4">
                  {ads.map((ad) => (
                    <div key={ad.id} className={styles.adItem}>
                      <div className={styles.adItemContent}>
                        <img 
                          src={ad.imageUrl} 
                          alt="Реклама"
                          className={styles.adItemImage}
                        />
                        <div className={styles.adItemInfo}>
                          <div className={styles.adItemField}>
                            <span className={styles.adItemFieldLabel}>Ссылка: </span>
                            <span className="text-sm">{ad.link || 'Не указана'}</span>
                          </div>
                          <div className={styles.adItemField}>
                            <span className={styles.adItemFieldLabel}>Позиция: </span>
                            <span className="text-sm">{ad.position}</span>
                          </div>
                          <div className={cn(styles.adItemField, "flex items-center gap-2")}>
                            <span className={styles.adItemFieldLabel}>Активна: </span>
                            <Badge variant={ad.isActive ? 'default' : 'secondary'}>
                              {ad.isActive ? 'Да' : 'Нет'}
                            </Badge>
                          </div>
                        </div>
                        <div className={styles.adItemActions}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAd(ad)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteAd(ad.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isAdFormOpen && (
          <Dialog open={isAdFormOpen} onOpenChange={setIsAdFormOpen}>
            <DialogContent className={styles.dialogContent}>
              <DialogHeader>
                <DialogTitle>
                  {editingAd ? 'Редактировать рекламу' : 'Добавить рекламу'}
                </DialogTitle>
              </DialogHeader>
              <div className={styles.dialogForm}>
                <div className={styles.dialogFormField}>
                  <label className={styles.dialogFormLabel}>Изображение</label>
                  {adFormData.imageUrl ? (
                    <div className="space-y-2">
                      <img 
                        src={adFormData.imageUrl} 
                        alt="Превью"
                        className={styles.dialogFormImagePreview}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAdFormData(prev => ({ ...prev, imageUrl: '' }))}
                      >
                        Удалить изображение
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={adImageInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                        id="ad-image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingImage}
                        className="w-full"
                        onClick={handleImageButtonClick}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingImage ? 'Загрузка...' : 'Загрузить изображение'}
                      </Button>
                    </div>
                  )}
                </div>
                <div className={styles.dialogFormField}>
                  <label className={styles.dialogFormLabel}>
                    Ссылка <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={adFormData.link}
                    onChange={(e) => setAdFormData(prev => ({ ...prev, link: e.target.value }))}
                    required
                    className={styles.dialogFormInput}
                  />
                </div>
                <div className={styles.dialogFormField}>
                  <label className={styles.dialogFormLabel}>Позиция</label>
                  <Input
                    type="number"
                    min="0"
                    value={adFormData.position}
                    onChange={(e) => setAdFormData(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                    className={styles.dialogFormInput}
                  />
                </div>
                <div className={cn(styles.dialogFormField, "flex items-center gap-2")}>
                  <input
                    type="checkbox"
                    id="ad-active"
                    checked={adFormData.isActive}
                    onChange={(e) => setAdFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <label htmlFor="ad-active" className={styles.dialogFormLabel}>
                    Активна
                  </label>
                </div>
                <div className={styles.dialogFormActions}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAdFormOpen(false);
                      setEditingAd(null);
                      setAdFormData({ imageUrl: '', link: '', position: 0, isActive: true });
                    }}
                    className={styles.dialogFormButton}
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={editingAd ? handleUpdateAd : handleCreateAd}
                    disabled={!adFormData.imageUrl || !adFormData.link || adFormData.link.trim() === ''}
                    className={styles.dialogFormButton}
                  >
                    {editingAd ? 'Сохранить' : 'Создать'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
    </div>
  );
}
