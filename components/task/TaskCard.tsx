import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
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
      username?: string | null;
      name: string | null;
      email: string;
      avatarUrl?: string | null;
    };
    tags: Array<{
      id: string;
      name: string;
    }>;
    images?: string[]; // Массив URL изображений (максимум 3)
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
    
    if (task.budgetType === 'NEGOTIABLE') {
      return `от ${task.budget.toLocaleString('ru-RU')} ₽`;
    }
    
    return `${task.budget.toLocaleString('ru-RU')} ₽`;
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="w-full"
    >
      <Card className={styles.card}>
        <Link href={`/tasks/${task.id}`} className={styles.link}>
          {/* Горизонтальная структура карточки */}
          <div className={styles.cardContent}>
            {/* Левая часть - изображение */}
            {hasImages && (
              <motion.div
                className={styles.imageContainer}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className={styles.imageWrapper}
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={images[currentImageIndex]}
                    alt={task.title}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 200px, 250px"
                  />
                </motion.div>
              
              {/* Стрелки навигации */}
              {images.length > 1 && (
                <>
                  <motion.button
                    onClick={handlePreviousImage}
                    className={styles.navButton}
                    style={{ left: 8 }}
                    aria-label="Предыдущее изображение"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                  >
                    <ChevronLeft className={styles.navIcon} />
                  </motion.button>
                  <motion.button
                    onClick={handleNextImage}
                    className={styles.navButton}
                    style={{ right: 8 }}
                    aria-label="Следующее изображение"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                  >
                    <ChevronRight className={styles.navIcon} />
                  </motion.button>
                </>
              )}
              
              {/* Индикаторы изображений (точки) */}
              {images.length > 1 && (
                <div className={styles.imageIndicators}>
                  {images.map((_, index) => (
                    <motion.button
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
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      animate={{
                        scale: index === currentImageIndex ? 1.2 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Правая часть - информация */}
          <div className={styles.infoContainer}>
            <div className={styles.header}>
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
              <div className={styles.badges}>
                {task.marketplace.map((mp) => (
                  <Badge 
                    key={mp}
                    variant="outline" 
                    className={`${marketplaceColors[mp]} font-medium text-xs`}
                  >
                    {marketplaceLabels[mp]}
                  </Badge>
                ))}
                {task.tags.slice(0, 3).map((tag) => (
                  <Badge 
                    key={tag.id} 
                    variant="secondary" 
                    className="text-xs font-normal"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className={styles.description}>
              <p className={styles.descriptionText}>
                {task.description}
              </p>
            </div>
            
            <div className={styles.footer}>
              <div className={styles.priceSection}>
                {task.budget && (
                  <span className={styles.price}>
                    {formatPrice()}
                  </span>
                )}
              </div>
              
              <div className={styles.userSection}>
                <div className={styles.userInfoRow}>
                  <Avatar className={styles.avatar}>
                    {task.user.avatarUrl && (
                      <AvatarImage src={task.user.avatarUrl} alt={getDisplayName(task.user.username, task.user.email)} />
                    )}
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {getDisplayName(task.user.username, task.user.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={styles.userName}>
                    {getDisplayName(task.user.username, task.user.email)}
                  </span>
                  <span className={styles.date}>
                    {new Date(task.createdAt).toLocaleDateString('ru-RU', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {isSellerMode ? (
                  <Badge 
                    variant="outline" 
                    className="bg-muted text-muted-foreground border-border font-medium text-xs"
                  >
                    Заказчик
                  </Badge>
                ) : (
                  <Badge 
                    variant="outline" 
                    className="bg-muted text-muted-foreground border-border font-medium text-xs"
                  >
                    Исполнитель
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
    </motion.div>
  );
}
