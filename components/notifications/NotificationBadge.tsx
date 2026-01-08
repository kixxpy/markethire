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
        "text-xs font-medium",
        isSeller
          ? "bg-seller-primary/10 text-seller-primary border-seller-border"
          : "bg-executor-primary/10 text-executor-primary border-executor-border",
        className
      )}
    >
      {isSeller ? '🟦 Seller' : '🟩 Executor'}
    </Badge>
  );
}
