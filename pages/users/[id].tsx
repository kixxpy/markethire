import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { api } from '../../src/api/client';
import { Tag, Task, Category, Marketplace, BudgetType, TaskModerationStatus, UserRole } from '@prisma/client';
import { Card, CardContent } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { getDisplayName } from '../../src/lib/utils';
import { useAuthStore } from '../../src/store/authStore';
import { Edit, Mail, MessageCircle, Phone } from 'lucide-react';
import TaskCard from '../../components/task/TaskCard';
import Pagination from '../../components/common/Pagination';
import styles from './[id].module.css';

interface UserProfile {
  id: string;
  username: string | null;
  name: string | null;
  email: string;
  description: string | null;
  priceFrom: number | null;
  telegram: string | null;
  whatsapp: string | null;
  emailContact: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
  tags: Array<{ tag: Tag }>;
}

interface TaskWithRelations extends Task {
  category: Category;
  moderationStatus?: TaskModerationStatus;
  createdInMode?: UserRole;
  marketplace: Marketplace[];
  user: {
    username?: string | null;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  images?: string[];
}

interface PaginatedTasks {
  tasks: TaskWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type TaskTab = 'orders' | 'services' | null;

export default function UserProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TaskTab>(null);
  const [orders, setOrders] = useState<PaginatedTasks | null>(null);
  const [services, setServices] = useState<PaginatedTasks | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [servicesPage, setServicesPage] = useState(1);

  const isOwner = isAuthenticated && currentUser?.id === id;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (id) {
      loadUser();
    }
  }, [id, isAuthenticated, router]);

  useEffect(() => {
    if (id && activeTab) {
      loadTasks(activeTab);
    }
  }, [id, activeTab, ordersPage, servicesPage]);

  const loadUser = async () => {
    try {
      const data = await api.get<UserProfile>(`/api/users/${id}`);
      setUser(data);
    } catch (error: any) {
      console.error('Ошибка загрузки профиля:', error);
      if (error?.response?.status === 401) {
        router.push('/login');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (tab: TaskTab) => {
    if (!id || !tab) return;
    
    setLoadingTasks(true);
    try {
      const page = tab === 'orders' ? ordersPage : servicesPage;
      const createdInMode = tab === 'orders' ? 'SELLER' : 'PERFORMER';
      const data = await api.get<PaginatedTasks>(
        `/api/users/${id}/tasks?page=${page}&limit=6&createdInMode=${createdInMode}`
      );
      
      if (tab === 'orders') {
        setOrders(data);
      } else {
        setServices(data);
      }
    } catch (error: any) {
      console.error('Ошибка загрузки задач:', error);
      if (error?.response?.status === 401) {
        router.push('/login');
        return;
      }
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleTabChange = (tab: TaskTab) => {
    setActiveTab(tab);
    if (tab === 'orders' && !orders) {
      loadTasks('orders');
    } else if (tab === 'services' && !services) {
      loadTasks('services');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Skeleton className="h-4 w-32 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Пользователь не найден</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Заголовок профиля */}
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                {user.avatarUrl && (
                  <AvatarImage src={user.avatarUrl} alt={getDisplayName(user.username, user.email)} />
                )}
                <AvatarFallback className="text-2xl sm:text-3xl">
                  {getDisplayName(user.username, user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {getDisplayName(user.username, user.email)}
                  </h1>
                  {isOwner && (
                    <Link href="/profile">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Edit className="h-4 w-4 mr-2" />
                        Редактировать
                      </Button>
                    </Link>
                  )}
                </div>
                
                {user.description && (
                  <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
                    {user.description}
                  </p>
                )}

                {user.priceFrom && (
                  <div className="mt-4">
                    <span className="text-sm text-muted-foreground">Цена от: </span>
                    <span className="text-xl font-semibold">
                      {user.priceFrom.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                )}

                {user.tags && user.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.tags.map((userTag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {userTag.tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Контакты */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Контакты</h2>
              <div className="space-y-2 text-foreground">
                {user.telegram && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <span className="font-medium">Telegram:</span> {user.telegram}
                    </span>
                  </div>
                )}
                {user.whatsapp && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <span className="font-medium">WhatsApp:</span> {user.whatsapp}
                    </span>
                  </div>
                )}
                {user.emailContact && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <span className="font-medium">Email:</span> {user.emailContact}
                    </span>
                  </div>
                )}
                {!user.telegram && !user.whatsapp && !user.emailContact && (
                  <p className="text-muted-foreground">Контакты не указаны</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Вкладки для заказов и услуг */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => handleTabChange('orders')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'orders'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Заказы
          </button>
          <button
            onClick={() => handleTabChange('services')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'services'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Услуги
          </button>
        </div>

        {/* Содержимое вкладок */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {loadingTasks ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : orders && orders.tasks.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {orders.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
                {orders.totalPages > 1 && (
                  <Pagination
                    currentPage={ordersPage}
                    totalPages={orders.totalPages}
                    onPageChange={setOrdersPage}
                  />
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Заказы не найдены</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-4">
            {loadingTasks ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : services && services.tasks.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {services.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
                {services.totalPages > 1 && (
                  <Pagination
                    currentPage={servicesPage}
                    totalPages={services.totalPages}
                    onPageChange={setServicesPage}
                  />
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Услуги не найдены</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
