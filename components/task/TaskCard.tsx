import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Eye, MessageSquare } from 'lucide-react';
import { Task, Category, Marketplace, BudgetType, TaskModerationStatus, UserRole } from '@prisma/client';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { getDisplayName } from '../../src/lib/utils';
import { cn } from '../../src/lib/utils';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task & {
    category: Category;
    moderationStatus?: TaskModerationStatus;
    moderationComment?: string | null;
    createdInMode?: UserRole;
    marketplace: Marketplace[]; // Изменено на массив
    user: {
      id: string;
      username?: string | null;
      name: string | null;
      email: string;
      avatarUrl?: string | null;
      createdAt: Date;
    };
    tags: Array<{
      id: string;
      name: string;
    }>;
    images?: string[]; // Массив URL изображений (максимум 3)
    _count?: {
      responses: number;
    };
    views?: number; // Количество просмотров (опционально для обратной совместимости)
  };
  showModerationStatus?: boolean;
}

const marketplaceLabels: Record<Marketplace, string> = {
  WB: 'Wildberries',
  OZON: 'OZON',
  YANDEX_MARKET: 'ЯндексМаркет',
  LAMODA: 'Lamoda',
};

const marketplaceColors: Record<Marketplace, string> = {
  WB: 'bg-purple-100 text-purple-800 border-purple-200',
  OZON: 'bg-blue-100 text-blue-800 border-blue-200',
  YANDEX_MARKET: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LAMODA: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function TaskCard({ task, showModerationStatus = false }: TaskCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Определяем стили в зависимости от режима создания
  const isSellerMode = task.createdInMode === 'SELLER' || !task.createdInMode;

  // Получаем изображения (максимум 3)
  const images = task.images?.slice(0, 3) || [];
  const hasImages = images.length > 0;

  const handlePreviousImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Форматирование цены
  const formatPrice = () => {
    if (!task.budget) return null;
    return task.budget.toLocaleString('ru-RU');
  };

  // Функция для расчета времени на сайте
  const getTimeOnSite = (createdAt: Date | string): string => {
    // Преобразуем в Date, если это строка
    const createdDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    
    // Проверяем валидность даты
    if (!(createdDate instanceof Date) || isNaN(createdDate.getTime())) {
      return 'на сайте недавно';
    }
    
    const now = new Date();
    const diff = now.getTime() - createdDate.getTime();
    
    // Проверяем, что разница не отрицательная (на случай проблем с часовыми поясами)
    if (diff < 0) {
      return 'на сайте недавно';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
      const yearWord = years === 1 ? 'год' : years < 5 ? 'года' : 'лет';
      return `на сайте ${years} ${yearWord}`;
    } else if (months > 0) {
      const monthWord = months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев';
      return `на сайте ${months} ${monthWord}`;
    } else {
      const dayWord = days === 1 ? 'день' : days < 5 ? 'дня' : 'дней';
      return `на сайте ${days} ${dayWord}`;
    }
  };

  // Функция для получения текста и стилей статуса модерации
  const getModerationStatusInfo = () => {
    const status = task.moderationStatus || 'PENDING';
    
    switch (status) {
      case 'PENDING':
        return {
          text: 'На модерации',
          className: styles.moderationPending,
        };
      case 'APPROVED':
        return {
          text: 'Активна',
          className: styles.moderationApproved,
        };
      case 'REJECTED':
        return {
          text: 'Удалена',
          className: styles.moderationRejected,
        };
      case 'REVISION':
        return {
          text: 'Требуется доработка',
          className: styles.moderationRevision,
        };
      default:
        return null;
    }
  };

  const moderationStatusInfo = showModerationStatus ? getModerationStatusInfo() : null;

  return (
    <div className="w-full">
      <Card className={styles.card}>
        <div className={styles.cardContent}>
          {/* Левая часть - изображение */}
          {hasImages && (
            <Link href={`/tasks/${task.id}`} className={styles.imageContainer}>
              <div
                className={styles.imageWrapper}
                key={currentImageIndex}
              >
                <Image
                  src={images[currentImageIndex]}
                  alt={task.title}
                  fill
                  className={styles.image}
                  sizes="(max-width: 768px) 200px, 250px"
                  loading={currentImageIndex === 0 ? "eager" : "lazy"}
                  priority={currentImageIndex === 0}
                />
              </div>
            
            {/* Стрелки навигации */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePreviousImage}
                  className={styles.navButton}
                  style={{ left: 8 }}
                  aria-label="Предыдущее изображение"
                >
                  <ChevronLeft className={styles.navIcon} />
                </button>
                <button
                  onClick={handleNextImage}
                  className={styles.navButton}
                  style={{ right: 8 }}
                  aria-label="Следующее изображение"
                >
                  <ChevronRight className={styles.navIcon} />
                </button>
              </>
            )}
            
            {/* Индикаторы изображений (точки) */}
            {images.length > 1 && (
              <div className={styles.imageIndicators}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={cn(
                      styles.indicator,
                      index === currentImageIndex && styles.indicatorActive
                    )}
                    aria-label={`Изображение ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </Link>
          )}

          {/* Правая часть - информация */}
          <div className={styles.infoContainer}>
            <Link href={`/tasks/${task.id}`} className={styles.link}>
              <div className={styles.header}>
                {/* Тег маркетплейса и статистика */}
                <div className={styles.marketplaceTags}>
                  {task.marketplace.map((mp) => (
                    <Badge 
                      key={mp}
                      variant="outline" 
                      className={`${styles.marketplaceTag} ${marketplaceColors[mp]} font-medium text-xs`}
                    >
                      {marketplaceLabels[mp]}
                    </Badge>
                  ))}
                  <div className={styles.stats}>
                    <span className={styles.statItem}>
                      <Eye className={styles.statIcon} />
                      {task.views ?? 0}
                    </span>
                    <span className={styles.statItem}>
                      <MessageSquare className={styles.statIcon} />
                      {task._count?.responses ?? 0}
                    </span>
                  </div>
                </div>
                
                {/* Название */}
                <div className={styles.titleRow}>
                  <h3 className={styles.title}>
                    {task.title}
                  </h3>
                  {moderationStatusInfo && (
                    <Badge 
                      variant="outline" 
                      className={moderationStatusInfo.className}
                    >
                      {moderationStatusInfo.text}
                    </Badge>
                  )}
                </div>
                
                {/* Описание в одну строку */}
                <div className={styles.description}>
                  <p className={styles.descriptionText}>
                    {task.description}
                  </p>
                </div>
                
                {/* Блок с ценой и кнопкой подробнее */}
                <div className={styles.footer}>
                  <div className={styles.priceSection}>
                    {task.budget && (
                      <>
                        {task.budgetType === 'NEGOTIABLE' && (
                          <span className={styles.priceFrom}>от</span>
                        )}
                        <span className={styles.price}>
                          {formatPrice()} ₽
                        </span>
                      </>
                    )}
                  </div>
                  <Link 
                    href={`/tasks/${task.id}`}
                    className={styles.detailsButton}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Подробнее
                  </Link>
                </div>
              </div>
            </Link>
            
            {/* Блок пользователя */}
            <div className={styles.userSection}>
              <Link 
                href={`/users/${task.user.id}`}
                className={styles.userInfoRow}
              >
                <Avatar className={styles.avatar}>
                  {task.user.avatarUrl && (
                    <AvatarImage src={task.user.avatarUrl} alt={getDisplayName(task.user.username, task.user.email)} />
                  )}
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {getDisplayName(task.user.username, task.user.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={styles.userNameContainer}>
                  <span className={styles.userName}>
                    {getDisplayName(task.user.username, task.user.email)}
                  </span>
                  {/* Индикатор онлайн - пока заглушка, можно будет добавить реальную логику */}
                  {/* Для демонстрации: можно добавить пропс isOnline или получать из API */}
                  <div className={styles.onlineIndicator}>
                    <span className={styles.onlineDot}></span>
                    <span className={styles.onlineText}>онлайн</span>
                  </div>
                </div>
                <span className={styles.timeOnSite}>
                  {getTimeOnSite(task.user.createdAt)}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
