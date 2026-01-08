"use client"

import { useEffect, useState } from 'react';
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
import { Bell, Check } from 'lucide-react';
import { UserRole } from '@prisma/client';
import { cn } from '../../src/lib/utils';

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

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Обновляем каждые 30 секунд
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, activeMode]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (activeMode) {
        queryParams.append('role', activeMode);
      }
      queryParams.append('unreadOnly', 'false');
      const data = await api.get<NotificationResponse>(
        `/api/notifications?${queryParams.toString()}`
      );
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Ошибка обновления уведомления:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/api/notifications/read-all', { role: activeMode });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Ошибка обновления уведомлений:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
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
            {activeMode === 'SELLER' && 'Уведомления для режима Seller'}
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
                  "p-4 rounded-lg border cursor-pointer transition-colors",
                  notification.read
                    ? "bg-muted/50 hover:bg-muted"
                    : "bg-seller-accent/30 border-seller-border hover:bg-seller-accent/50",
                  notification.role === 'PERFORMER' && !notification.read &&
                    "bg-executor-accent/30 border-executor-border hover:bg-executor-accent/50"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between gap-2">
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
