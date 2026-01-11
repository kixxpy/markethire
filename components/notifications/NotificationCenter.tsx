"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/api/client';
import { NotificationBadge } from './NotificationBadge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Bell, Check, X } from 'lucide-react';
import { UserRole } from '@prisma/client';
import { cn } from '../../src/lib/utils';
import { toast } from 'sonner';

interface Notification {
  id: string;
  userId: string;
  type: string;
  role: UserRole;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

export function NotificationCenter() {
  const { user, activeMode } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [checkingTask, setCheckingTask] = useState<string | null>(null);
  const [deletingNotification, setDeletingNotification] = useState<string | null>(null);
  const autoDeleteTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Константа для автоматического удаления (7 дней в миллисекундах)
  const AUTO_DELETE_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Обновляем каждые 30 секунд
      const interval = setInterval(loadNotifications, 30000);
      return () => {
        clearInterval(interval);
        // Очищаем все таймеры при размонтировании
        autoDeleteTimersRef.current.forEach(timer => clearTimeout(timer));
        autoDeleteTimersRef.current.clear();
      };
    }
  }, [user, activeMode]);

  // Функция для установки таймера автоматического удаления
  const setupAutoDelete = (notification: Notification) => {
    // Очищаем предыдущий таймер, если он существует
    const existingTimer = autoDeleteTimersRef.current.get(notification.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const createdAt = new Date(notification.createdAt).getTime();
    const now = Date.now();
    const age = now - createdAt;
    const timeUntilDelete = AUTO_DELETE_AFTER_MS - age;

    // Если уведомление уже старше 7 дней, удаляем сразу
    if (timeUntilDelete <= 0) {
      handleDeleteNotification(notification.id, false);
      return;
    }

    // Устанавливаем таймер на оставшееся время
    const timer = setTimeout(() => {
      handleDeleteNotification(notification.id, false);
      autoDeleteTimersRef.current.delete(notification.id);
    }, timeUntilDelete);

    autoDeleteTimersRef.current.set(notification.id, timer);
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (activeMode) {
        queryParams.append('role', activeMode);
      }
      queryParams.append('unreadOnly', 'true');
      const data = await api.get<NotificationResponse>(
        `/api/notifications?${queryParams.toString()}`
      );
      
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);

      // Устанавливаем таймеры для автоматического удаления
      data.notifications.forEach(notification => {
        setupAutoDelete(notification);
      });
    } catch (error: any) {
      // Игнорируем ошибки 401 (недействительный токен) - они обрабатываются в API клиенте
      if (error?.message?.includes('Недействительный токен') || error?.message?.includes('Токен не предоставлен')) {
        // Токен будет очищен автоматически, просто не показываем ошибку
        return;
      }
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
      // Удаляем уведомление из списка, так как оно теперь прочитано
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Ошибка обновления уведомления:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/api/notifications/read-all', { role: activeMode });
      // Очищаем список уведомлений, так как все теперь прочитаны
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Ошибка обновления уведомлений:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string, showToast: boolean = true) => {
    // Очищаем таймер, если он существует
    const timer = autoDeleteTimersRef.current.get(notificationId);
    if (timer) {
      clearTimeout(timer);
      autoDeleteTimersRef.current.delete(notificationId);
    }

    setDeletingNotification(notificationId);
    
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      
      const notification = notifications.find(n => n.id === notificationId);
      const wasUnread = notification && !notification.read;
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      if (showToast) {
        toast.success('Уведомление удалено');
      }
    } catch (error: any) {
      console.error('Ошибка удаления уведомления:', error);
      if (showToast) {
        toast.error('Не удалось удалить уведомление');
      }
    } finally {
      setDeletingNotification(null);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.link) return;

    // Проверяем, ведет ли ссылка на задачу
    const taskLinkMatch = notification.link.match(/^\/tasks\/([^\/]+)/);
    
    if (taskLinkMatch) {
      const taskId = taskLinkMatch[1];
      setCheckingTask(notification.id);
      
      try {
        // Проверяем существование задачи перед переходом
        await api.get(`/api/tasks/${taskId}`);
        
        // Задача существует, выполняем переход
        if (!notification.read) {
          await handleMarkAsRead(notification.id);
        }
        router.push(notification.link);
        setOpen(false);
      } catch (error: any) {
        // Задача не найдена или произошла ошибка
        const errorMessage = error?.message || 'Ошибка при проверке задачи';
        
        if (errorMessage.includes('не найдена') || errorMessage.includes('404')) {
          toast.error('Задача была удалена или больше не существует');
          
          // Помечаем уведомление как прочитанное
          if (!notification.read) {
            await handleMarkAsRead(notification.id);
          }
          
          // Удаляем уведомление из списка, так как оно больше не актуально
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else {
          toast.error('Не удалось открыть задачу. Попробуйте позже');
        }
      } finally {
        setCheckingTask(null);
      }
    } else {
      // Для других ссылок выполняем обычный переход без проверки
      if (!notification.read) {
        handleMarkAsRead(notification.id);
      }
      router.push(notification.link);
      setOpen(false);
    }
  };

  if (!user) return null;

  const filteredNotifications = activeMode
    ? notifications.filter(n => n.role === activeMode || n.role === 'BOTH')
    : notifications;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Уведомления</SheetTitle>
          <SheetDescription>
            {activeMode === 'SELLER' && 'Уведомления для режима Заказчика'}
            {activeMode === 'PERFORMER' && 'Уведомления для режима Executor'}
            {!activeMode && 'Все уведомления'}
          </SheetDescription>
        </SheetHeader>
        
        {unreadCount > 0 && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="w-full"
            >
              <Check className="h-4 w-4 mr-2" />
              Пометить все как прочитанные
            </Button>
          </div>
        )}

        <div className="mt-6 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Загрузка...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет уведомлений
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-colors relative group",
                  checkingTask === notification.id && "opacity-50 cursor-wait",
                  notification.read
                    ? "bg-muted/50 hover:bg-muted"
                    : "bg-seller-accent/30 border-seller-border hover:bg-seller-accent/50",
                  notification.role === 'PERFORMER' && !notification.read &&
                    "bg-executor-accent/30 border-executor-border hover:bg-executor-accent/50"
                )}
                onClick={() => !checkingTask && !deletingNotification && handleNotificationClick(notification)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(notification.id);
                  }}
                  disabled={deletingNotification === notification.id}
                  className={cn(
                    "absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                    "hover:bg-destructive/10 text-muted-foreground hover:text-destructive",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    deletingNotification === notification.id && "opacity-100"
                  )}
                  aria-label="Удалить уведомление"
                >
                  <X className="h-4 w-4" />
                </button>
                
                <div className="flex items-start justify-between gap-2 pr-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <NotificationBadge role={notification.role} />
                      <h4 className="font-semibold text-sm">{notification.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
