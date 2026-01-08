import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import { Task, Category, Marketplace, BudgetType, TaskModerationStatus, UserRole } from '@prisma/client';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { getDisplayName } from '../../src/lib/utils';
import { cn } from '../../src/lib/utils';

interface TaskCardProps {
  task: Task & {
    category: Category;
    moderationStatus?: TaskModerationStatus;
    moderationComment?: string | null;
    createdInMode?: UserRole;
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
}

const marketplaceLabels: Record<Marketplace, string> = {
  WB: 'Wildberries',
  OZON: 'OZON',
};

const marketplaceColors: Record<Marketplace, string> = {
  WB: 'bg-blue-100 text-blue-800 border-blue-200',
  OZON: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function TaskCard({ task }: TaskCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Определяем стили в зависимости от режима создания
  const isSellerMode = task.createdInMode === 'SELLER' || !task.createdInMode;
  const isExecutorMode = !isSellerMode;
  
  const cardStyles = isSellerMode
    ? 'border-seller-border bg-seller-accent/10 hover:bg-seller-accent/20 group-hover:border-seller-primary/50'
    : 'border-executor-border bg-executor-accent/10 hover:bg-executor-accent/20 group-hover:border-executor-primary/50';

  // Получаем изображения (максимум 3)
  const images = task.images?.slice(0, 3) || [];
  const hasImages = images.length > 0;

  // Форматирование цены
  const formatPrice = () => {
    if (!task.budget) return null;
    
    if (task.budgetType === 'NEGOTIABLE') {
      return `от ${task.budget.toLocaleString('ru-RU')} ₽`;
    }
    
    return `${task.budget.toLocaleString('ru-RU')} ₽`;
  };

  const getDuration = () => {
    return '1 месяц';
  };

  // Для режима исполнителя - упрощенная карточка как на скриншоте
  if (isExecutorMode) {
    return (
      <Card className={cn(
        "group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col",
        cardStyles
      )}>
        <Link href={`/tasks/${task.id}`} className="flex flex-col h-full">
          {/* Секция с изображением */}
          {hasImages && (
            <div className="relative w-full aspect-square bg-white rounded-t-lg overflow-hidden border-b">
              <div className="relative w-full h-full">
                <Image
                  src={images[currentImageIndex]}
                  alt={task.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              
              {/* Индикаторы изображений (точки) */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentImageIndex(index);
                      }}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        index === currentImageIndex
                          ? "bg-executor-primary"
                          : "bg-gray-300"
                      )}
                      aria-label={`Изображение ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Секция с информацией */}
          <CardContent className="flex-1 flex flex-col p-4 space-y-3">
            {/* Тег маркетплейса */}
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${marketplaceColors[task.marketplace]} font-medium text-xs`}
              >
                {marketplaceLabels[task.marketplace]}
              </Badge>
            </div>

            {/* Название задачи */}
            <h3 className="text-lg font-bold text-foreground line-clamp-2">
              {task.title}
            </h3>

            {/* Цена */}
            {task.budget && (
              <div className="mt-auto">
                <span className="text-xl font-bold text-foreground">
                  {formatPrice()}
                </span>
              </div>
            )}
          </CardContent>
        </Link>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col",
      cardStyles
    )}>
      <Link href={`/tasks/${task.id}`} className="flex flex-col h-full">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className={cn(
              "text-xl font-bold line-clamp-2 transition-colors",
              isSellerMode 
                ? "text-foreground group-hover:text-seller-primary" 
                : "text-foreground group-hover:text-executor-primary"
            )}>
              {task.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={`${marketplaceColors[task.marketplace]} font-medium text-xs`}
            >
              {marketplaceLabels[task.marketplace]}
            </Badge>
            {isSellerMode ? (
              <Badge 
                variant="outline" 
                className="bg-seller-primary/10 text-seller-primary border-seller-border font-medium text-xs"
              >
                🟦 Продавец
              </Badge>
            ) : (
              <Badge 
                variant="outline" 
                className="bg-executor-primary/10 text-executor-primary border-executor-border font-medium text-xs"
              >
                🟩 Исполнитель
              </Badge>
            )}
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
        </CardHeader>
        
        <CardContent className="flex-1 space-y-4 pb-4">
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {task.description}
          </p>
          
          <div className="flex items-center justify-between pt-2 border-t">
            {task.budget && (
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-foreground">
                  {task.budgetType === 'NEGOTIABLE' 
                    ? `от ${task.budget.toLocaleString('ru-RU')} ₽`
                    : `${task.budget.toLocaleString('ru-RU')} ₽`
                  }
                </span>
              </div>
            )}
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">
                {getDuration()}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                срок выполнения
              </span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className={cn(
          "flex items-center justify-between pt-4 border-t",
          isSellerMode 
            ? "bg-seller-accent/20 border-seller-border/30" 
            : "bg-executor-accent/20 border-executor-border/30"
        )}>
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 ring-2 ring-background">
              {task.user.avatarUrl && (
                <AvatarImage src={task.user.avatarUrl} alt={getDisplayName(task.user.username, task.user.email)} />
              )}
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {getDisplayName(task.user.username, task.user.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">
              {getDisplayName(task.user.username, task.user.email)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {new Date(task.createdAt).toLocaleDateString('ru-RU', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </CardFooter>
      </Link>
    </Card>
  );
}
