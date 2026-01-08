import Link from 'next/link';
import { Task, Category, Marketplace, BudgetType, TaskModerationStatus } from '@prisma/client';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { cn, getDisplayName } from '../../src/lib/utils';

interface TaskCardProps {
  task: Task & {
    category: Category;
    moderationStatus?: TaskModerationStatus;
    moderationComment?: string | null;
    user: {
      username?: string | null;
      name: string | null;
      email: string;
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

const moderationStatusLabels: Record<TaskModerationStatus, string> = {
  PENDING: 'На модерации',
  APPROVED: 'Одобрена',
  REJECTED: 'Отклонена',
};

const moderationStatusColors: Record<TaskModerationStatus, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  APPROVED: 'bg-green-500/10 text-green-700 border-green-500/20',
  REJECTED: 'bg-red-500/10 text-red-700 border-red-500/20',
};

export default function TaskCard({ task }: TaskCardProps) {
  const getDuration = () => {
    return '1 месяц';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <Link href={`/tasks/${task.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold line-clamp-2">{task.title}</h3>
            {task.moderationStatus && (
              <Badge
                variant="outline"
                className={cn(moderationStatusColors[task.moderationStatus])}
              >
                {moderationStatusLabels[task.moderationStatus]}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {task.description}
          </p>
          
          <div className="flex items-center gap-4 text-sm">
            {task.budget && (
              <span className="font-medium">
                {task.budget.toLocaleString('ru-RU')} ₽
                {task.budgetType === 'NEGOTIABLE' && ' (договорная)'}
              </span>
            )}
            <span className="text-muted-foreground">{getDuration()}</span>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>{marketplaceLabels[task.marketplace]}</span>
            {task.tags.slice(0, 2).map((tag) => (
              <span key={tag.id}>{tag.name}</span>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getDisplayName(task.user.username, task.user.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {getDisplayName(task.user.username, task.user.email)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
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
