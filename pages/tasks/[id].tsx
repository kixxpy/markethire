import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2, Trash2, MessageSquare, Send } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import { getDisplayName } from '../../src/lib/utils';
import FormattedText from '../../src/components/common/FormattedText';
import Pagination from '../../components/common/Pagination';
import { Textarea } from '../../components/ui/textarea';
import styles from './[id].module.css';

interface TaskWithRelations extends Task {
  category: Category;
  moderationStatus?: TaskModerationStatus;
  moderationComment?: string | null;
  images?: string[];
  marketplace: Marketplace[]; // Изменено на массив
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
    replies?: Array<{
      id: string;
      message: string;
      createdAt: Date;
      user: {
        id: string;
        username: string | null;
        name: string | null;
        email: string;
      };
    }>;
  }>;
}

const marketplaceLabels: Record<Marketplace, string> = {
  WB: 'Wildberries',
  OZON: 'OZON',
  YANDEX_MARKET: 'ЯндексМаркет',
  LAMODA: 'Lamoda',
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [myResponse, setMyResponse] = useState<{
    id: string;
    message: string;
    price: number | null;
    deadline: string | null;
    createdAt: Date;
  } | null>(null);
  
  // Новые состояния для пагинации и ответов
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResponses, setTotalResponses] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState<Record<string, string>>({});
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  useEffect(() => {
    if (task && user && task.userId === user.id) {
      loadResponses(1);
    }
  }, [task, user]);

  useEffect(() => {
    if (task && user && task.userId !== user.id) {
      loadMyResponse();
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

  const loadResponses = async (page: number = 1) => {
    if (!isAuthenticated || !user || !task || task.userId !== user.id) {
      return;
    }
    try {
      const data = await api.get<{
        responses: TaskWithRelations['responses'];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/api/tasks/${id}/responses?page=${page}&limit=10`);
      setResponses(data.responses);
      setTotalPages(data.totalPages);
      setTotalResponses(data.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Ошибка загрузки откликов:', error);
    }
  };

  const loadMyResponse = async () => {
    if (!isAuthenticated || !user || !task || isOwner) {
      return;
    }
    try {
      const data = await api.get(`/api/tasks/${id}/my-response`);
      setMyResponse(data);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.error('Ошибка загрузки отклика:', error);
      }
      setMyResponse(null);
    }
  };

  const handleDeleteResponse = async () => {
    if (!myResponse) return;
    try {
      await api.delete(`/api/responses/${myResponse.id}`);
      toast.success('Отклик удален');
      setMyResponse(null);
      setShowResponseForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления отклика');
    }
  };

  const handleDeleteResponseByOwner = async (responseId: string) => {
    try {
      await api.delete(`/api/responses/${responseId}`);
      toast.success('Отклик удален');
      loadResponses(currentPage);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления отклика');
    }
  };

  const handleSendReply = async (responseId: string) => {
    const message = replyMessage[responseId]?.trim();
    if (!message) {
      toast.error('Введите сообщение');
      return;
    }

    if (message.length > 1000) {
      toast.error('Сообщение не может превышать 1000 символов');
      return;
    }

    try {
      await api.post(`/api/responses/${responseId}/replies`, { message });
      toast.success('Ответ отправлен');
      setReplyingTo(null);
      setReplyMessage({ ...replyMessage, [responseId]: '' });
      loadResponses(currentPage);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка отправки ответа');
    }
  };

  const handleDeleteReply = async (responseId: string, replyId: string) => {
    try {
      await api.delete(`/api/responses/${responseId}/replies?replyId=${replyId}`);
      toast.success('Ответ удален');
      loadResponses(currentPage);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления ответа');
    }
  };

  const truncateText = (text: string, maxLength: number = 200): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const toggleMessageExpansion = (responseId: string) => {
    setExpandedMessages({
      ...expandedMessages,
      [responseId]: !expandedMessages[responseId],
    });
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

  const images = task?.images || [];
  const hasImages = images.length > 0;

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleOpenLightbox = (index: number) => {
    setLightboxImageIndex(index);
    setIsLightboxOpen(true);
  };

  const handleLightboxPrevious = useCallback(() => {
    setLightboxImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleLightboxNext = useCallback(() => {
    setLightboxImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Сброс индекса изображения при изменении задачи
  useEffect(() => {
    if (task) {
      setCurrentImageIndex(0);
    }
  }, [task?.id]);

  // Обработка клавиатуры для навигации в модальном окне
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleLightboxPrevious();
      } else if (e.key === 'ArrowRight') {
        handleLightboxNext();
      } else if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handleLightboxPrevious, handleLightboxNext]);

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
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <CardTitle className="text-2xl">{task.title}</CardTitle>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {task.marketplace.map((mp) => (
                  <span key={mp}>{marketplaceLabels[mp]}</span>
                ))}
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
              <div className={styles.actionsContainer}>
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
          {/* Слайдер изображений */}
          {hasImages && (
            <>
              <div className={styles.sliderContainer}>
                <div className={styles.slider}>
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`${styles.slide} ${
                        index === currentImageIndex ? styles.slideActive : ''
                      }`}
                    >
                      <div
                        className={styles.slideImage}
                        onClick={() => handleOpenLightbox(index)}
                      >
                        <Image
                          src={image}
                          alt={`${task.title} - изображение ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="250px"
                          loading={index === 0 ? "eager" : "lazy"}
                          priority={index === 0}
                        />
                        <div className={styles.zoomOverlay}>
                          <Maximize2 className={styles.zoomIcon} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Стрелки навигации */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePreviousImage}
                      className={styles.sliderNavButton}
                      style={{ left: '0.5rem' }}
                      aria-label="Предыдущее изображение"
                    >
                      <ChevronLeft className={styles.sliderNavIcon} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className={styles.sliderNavButton}
                      style={{ right: '0.5rem' }}
                      aria-label="Следующее изображение"
                    >
                      <ChevronRight className={styles.sliderNavIcon} />
                    </button>
                  </>
                )}
                
                {/* Индикаторы (точки) */}
                {images.length > 1 && (
                  <div className={styles.sliderIndicators}>
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`${styles.sliderIndicator} ${
                          index === currentImageIndex ? styles.sliderIndicatorActive : ''
                        }`}
                        aria-label={`Изображение ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Модальное окно для просмотра изображений */}
              <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogContent className={styles.lightboxContent}>
                  <div className={styles.lightboxContainer}>
                    <Image
                      src={images[lightboxImageIndex]}
                      alt={`${task.title} - изображение ${lightboxImageIndex + 1}`}
                      fill
                      className="object-contain"
                      sizes="90vw"
                      loading="eager"
                    />
                    
                    {/* Стрелки навигации в модальном окне */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={handleLightboxPrevious}
                          className={styles.lightboxNavButton}
                          style={{ left: '1rem' }}
                          aria-label="Предыдущее изображение"
                        >
                          <ChevronLeft className={styles.lightboxNavIcon} />
                        </button>
                        <button
                          onClick={handleLightboxNext}
                          className={styles.lightboxNavButton}
                          style={{ right: '1rem' }}
                          aria-label="Следующее изображение"
                        >
                          <ChevronRight className={styles.lightboxNavIcon} />
                        </button>
                      </>
                    )}
                    
                    {/* Индикатор текущего изображения */}
                    {images.length > 1 && (
                      <div className={styles.lightboxCounter}>
                        {lightboxImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Separator />
            </>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-2">Описание</h2>
            <FormattedText 
              text={task.description || ''} 
              className="text-muted-foreground"
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {task.budget && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Цена:</span>
                <p className="text-lg font-semibold">
                  {task.budgetType === 'NEGOTIABLE' 
                    ? `от ${task.budget.toLocaleString('ru-RU')} ₽`
                    : `${task.budget.toLocaleString('ru-RU')} ₽`}
                </p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-muted-foreground">Автор:</span>
              <Link href={`/users/${task.user.id}`} className="text-lg hover:underline cursor-pointer block">
                {getDisplayName(task.user.username, task.user.email)}
              </Link>
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

      {canRespond && !myResponse && (
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
                    loadMyResponse();
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {myResponse && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Мой отклик</CardTitle>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Удалить отклик
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить отклик?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Вы уверены, что хотите удалить свой отклик на эту задачу? 
                      Это действие нельзя отменить.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteResponse}
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
              <p className="text-sm">{myResponse.message}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                {myResponse.price && (
                  <span className="font-semibold">
                    Цена: {myResponse.price.toLocaleString('ru-RU')} ₽
                  </span>
                )}
                {myResponse.deadline && (
                  <span className="text-muted-foreground">
                    Срок: {myResponse.deadline}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Отправлено: {new Date(myResponse.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Отклики ({totalResponses})</CardTitle>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Пока нет откликов</p>
            ) : (
              <div className="space-y-4">
                {responses.map((response) => {
                  const isExpanded = expandedMessages[response.id];
                  const displayMessage = isExpanded 
                    ? response.message 
                    : truncateText(response.message, 200);
                  const needsTruncation = response.message.length > 200;

                  return (
                    <Card key={response.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link 
                              href={`/users/${response.user.id}`}
                              className="font-medium hover:underline cursor-pointer block"
                            >
                              {getDisplayName(response.user.username, response.user.email)}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {new Date(response.createdAt).toLocaleDateString('ru-RU', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {response.price && (
                              <span className="text-lg font-semibold">
                                {response.price.toLocaleString('ru-RU')} ₽
                              </span>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Удалить отклик?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Вы уверены, что хотите удалить этот отклик? 
                                    Это действие нельзя отменить.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteResponseByOwner(response.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm whitespace-pre-wrap">{displayMessage}</p>
                          {needsTruncation && (
                            <button
                              onClick={() => toggleMessageExpansion(response.id)}
                              className="text-xs text-primary hover:underline"
                            >
                              {isExpanded ? 'Свернуть' : 'Показать полностью'}
                            </button>
                          )}
                        </div>

                        {response.deadline && (
                          <p className="text-xs text-muted-foreground">
                            Срок: {response.deadline}
                          </p>
                        )}

                        {/* Ответы на отклик */}
                        {response.replies && response.replies.length > 0 && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Ответы ({response.replies.length}):
                            </p>
                            {response.replies.map((reply) => (
                              <div key={reply.id} className="bg-muted/50 p-3 rounded-md space-y-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <Link 
                                      href={`/users/${reply.user.id}`}
                                      className="text-xs font-medium hover:underline cursor-pointer block"
                                    >
                                      {getDisplayName(reply.user.username, reply.user.email)}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(reply.createdAt).toLocaleDateString('ru-RU', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Удалить ответ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Вы уверены, что хотите удалить этот ответ?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteReply(response.id, reply.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Удалить
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Форма ответа */}
                        {replyingTo === response.id ? (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            <Textarea
                              placeholder="Введите ваш ответ..."
                              value={replyMessage[response.id] || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 1000) {
                                  setReplyMessage({ ...replyMessage, [response.id]: value });
                                }
                              }}
                              rows={3}
                              maxLength={1000}
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {(replyMessage[response.id] || '').length} / 1000
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyMessage({ ...replyMessage, [response.id]: '' });
                                  }}
                                >
                                  Отмена
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSendReply(response.id)}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Отправить
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReplyingTo(response.id)}
                            className="mt-2"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Ответить
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            
            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    loadResponses(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
