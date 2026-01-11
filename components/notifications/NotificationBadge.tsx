import { Badge } from '../ui/badge';
import { UserRole } from '@prisma/client';
import { cn } from '../../src/lib/utils';

interface NotificationBadgeProps {
  role: UserRole;
  className?: string;
}

export function NotificationBadge({ role, className }: NotificationBadgeProps) {
  const isSeller = role === 'SELLER' || role === 'BOTH';
  
  return (
    <Badge
      className={cn(
        "text-xs font-medium bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {isSeller ? 'Seller' : 'Executor'}
    </Badge>
  );
}
