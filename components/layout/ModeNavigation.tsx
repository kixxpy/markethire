"use client"

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { 
  LayoutDashboard,
  ClipboardList,
  Plus,
  MessageSquare
} from 'lucide-react';
import { cn } from '../../src/lib/utils';
import styles from './ModeNavigation.module.css';

export function ModeNavigation() {
  const { isAuthenticated, activeMode, user } = useAuthStore();
  const router = useRouter();
  const currentPath = router.pathname;

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  // Скрываем для администратора
  if (!isAuthenticated || user?.role === 'ADMIN') return null;

  // Блок навигации для режима SELLER
  const getSellerNavLinks = () => {
    return [
      { 
        href: '/seller/dashboard', 
        label: 'Панель управления', 
        icon: <LayoutDashboard />
      },
      { 
        href: '/seller/tasks', 
        label: 'Мои задачи', 
        icon: <ClipboardList />
      },
      { 
        href: '/tasks/create', 
        label: 'Создать задачу', 
        icon: <Plus />
      },
    ];
  };

  // Блок навигации для режима PERFORMER
  const getPerformerNavLinks = () => {
    return [
      { 
        href: '/executor/dashboard', 
        label: 'Панель управления', 
        icon: <LayoutDashboard />
      },
      { 
        href: '/executor/tasks', 
        label: 'Мои услуги', 
        icon: <ClipboardList />
      },
      { 
        href: '/executor/responses', 
        label: 'Мои отклики', 
        icon: <MessageSquare />
      },
      { 
        href: '/tasks/create', 
        label: 'Добавить услугу', 
        icon: <Plus />
      },
    ];
  };

  const sellerNavLinks = activeMode === 'SELLER' ? getSellerNavLinks() : [];
  const performerNavLinks = activeMode === 'PERFORMER' ? getPerformerNavLinks() : [];

  return (
    <div className={cn(styles.navigation, "w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60")}>
      <div className={cn(styles.container, "container mx-auto")}>
        {/* Блок навигации для SELLER режима */}
        {activeMode === 'SELLER' && sellerNavLinks.length > 0 && (
          <div className={cn(styles.navContainer, "bg-seller-accent/30")}>
            <ul className={styles.navList}>
              {sellerNavLinks.map((link) => (
                <li key={link.href + link.label} className={styles.navItem}>
                  <Link
                    href={link.href}
                    className={cn(
                      styles.navLink,
                      isActive(link.href)
                        ? "bg-seller-primary text-seller-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-seller-accent hover:text-seller-primary"
                    )}
                  >
                    <span className={styles.navLinkIcon}>{link.icon}</span>
                    <span className={styles.navLinkText}>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Блок навигации для PERFORMER режима */}
        {activeMode === 'PERFORMER' && performerNavLinks.length > 0 && (
          <div className={cn(styles.navContainer, "bg-executor-accent/30")}>
            <ul className={styles.navList}>
              {performerNavLinks.map((link) => (
                <li key={link.href + link.label} className={styles.navItem}>
                  <Link
                    href={link.href}
                    className={cn(
                      styles.navLink,
                      isActive(link.href)
                        ? "bg-executor-primary text-executor-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-executor-accent hover:text-executor-primary"
                    )}
                  >
                    <span className={styles.navLinkIcon}>{link.icon}</span>
                    <span className={styles.navLinkText}>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
