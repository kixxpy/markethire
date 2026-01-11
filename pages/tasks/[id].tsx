import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
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
          <div className="flex items-start justify-between gap-4">
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
