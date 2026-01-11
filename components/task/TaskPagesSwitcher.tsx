"use client"

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { cn } from '../../src/lib/utils';
import styles from './TaskPagesSwitcher.module.css';

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
    <div className={styles.switcher}>
      <Link
        href="/seller/tasks"
        onClick={handleSellerClick}
        className={cn(
          styles.switcherLink,
          isSellerPage || activeMode === 'SELLER'
            ? styles.switcherLinkActive
            : styles.switcherLinkInactive
        )}
      >
        Как заказчик
      </Link>
      <Link
        href="/executor/tasks"
        onClick={handlePerformerClick}
        className={cn(
          styles.switcherLink,
          isPerformerPage || activeMode === 'PERFORMER'
            ? styles.switcherLinkActive
            : styles.switcherLinkInactive
        )}
      >
        Как исполнитель
      </Link>
    </div>
  );
}
