"use client"

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { cn } from '../../src/lib/utils';

export function TaskPagesSwitcher() {
  const router = useRouter();
  const { activeMode, setActiveMode, canSwitchToSeller, canSwitchToPerformer } = useAuthStore();

  const currentPath = router.pathname;
  const isSellerPage = currentPath.startsWith('/seller/tasks');
  const isPerformerPage = currentPath.startsWith('/executor/tasks');

  // Показываем только если у пользователя обе роли
  if (!canSwitchToSeller() || !canSwitchToPerformer()) {
    return null;
  }

  const handleSellerClick = () => {
    if (canSwitchToSeller()) {
      setActiveMode('SELLER');
    }
  };

  const handlePerformerClick = () => {
    if (canSwitchToPerformer()) {
      setActiveMode('PERFORMER');
    }
  };

  return (
    <div className="inline-flex rounded-md border bg-muted p-1 gap-1">
      <Link
        href="/seller/tasks"
        onClick={handleSellerClick}
        className={cn(
          'px-3 py-1.5 text-sm rounded-md transition-colors font-medium',
          isSellerPage || activeMode === 'SELLER'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-background/70'
        )}
      >
        Как заказчик
      </Link>
      <Link
        href="/executor/tasks"
        onClick={handlePerformerClick}
        className={cn(
          'px-3 py-1.5 text-sm rounded-md transition-colors font-medium',
          isPerformerPage || activeMode === 'PERFORMER'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-background/70'
        )}
      >
        Как исполнитель
      </Link>
    </div>
  );
}
