import Link from 'next/link';
import { Task, Category, Marketplace, BudgetType, TaskModerationStatus } from '@prisma/client';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { getDisplayName } from '../../src/lib/utils';

interface TaskCardProps {
  task: Task & {
    category: Category;
    moderationStatus?: TaskModerationStatus;
    moderationComment?: string | null;
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
  const getDuration = () => {
    return '1 месяц';
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col">
      <Link href={`/tasks/${task.id}`} className="flex flex-col h-full">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-xl font-bold line-clamp-2 text-foreground group-hover:text-primary transition-colors">
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
                  {task.budget.toLocaleString('ru-RU')} ₽
                </span>
                {task.budgetType === 'NEGOTIABLE' && (
                  <span className="text-xs text-muted-foreground mt-0.5">
                    договорная
                  </span>
                )}
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
        
        <CardFooter className="flex items-center justify-between pt-4 border-t bg-muted/30">
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
