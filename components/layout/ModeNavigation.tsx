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

export function ModeNavigation() {
  const { isAuthenticated, activeMode } = useAuthStore();
  const router = useRouter();
  const currentPath = router.pathname;

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  // Блок навигации для режима SELLER
  const getSellerNavLinks = () => {
    return [
      { 
        href: '/seller/dashboard', 
        label: 'Панель управления', 
        icon: <LayoutDashboard className="h-4 w-4" />
      },
      { 
        href: '/seller/tasks', 
        label: 'Мои задачи', 
        icon: <ClipboardList className="h-4 w-4" />
      },
      { 
        href: '/tasks/create', 
        label: 'Создать задачу', 
        icon: <Plus className="h-4 w-4" />
      },
    ];
  };

  // Блок навигации для режима PERFORMER
  const getPerformerNavLinks = () => {
    return [
      { 
        href: '/executor/dashboard', 
        label: 'Панель управления', 
        icon: <LayoutDashboard className="h-4 w-4" />
      },
      { 
        href: '/executor/tasks', 
        label: 'Мои задачи', 
        icon: <ClipboardList className="h-4 w-4" />
      },
      { 
        href: '/executor/responses', 
        label: 'Мои отклики', 
        icon: <MessageSquare className="h-4 w-4" />
      },
    ];
  };

  if (!isAuthenticated) return null;

  const sellerNavLinks = activeMode === 'SELLER' ? getSellerNavLinks() : [];
  const performerNavLinks = activeMode === 'PERFORMER' ? getPerformerNavLinks() : [];

  return (
    <div className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-2 sm:px-4">
        {/* Блок навигации для SELLER режима */}
        {activeMode === 'SELLER' && sellerNavLinks.length > 0 && (
          <div className="flex items-center justify-center gap-1 lg:gap-2 bg-seller-accent/30 rounded-lg px-2 lg:px-3 py-2 my-2">
            <ul className="flex items-center gap-1 lg:gap-2 flex-wrap">
              {sellerNavLinks.map((link) => (
                <li key={link.href + link.label} className="flex-shrink-0">
                  <Link
                    href={link.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                      isActive(link.href)
                        ? "bg-seller-primary text-seller-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-seller-accent hover:text-seller-primary"
                    )}
                  >
                    <span className="flex-shrink-0">{link.icon}</span>
                    <span className="truncate">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Блок навигации для PERFORMER режима */}
        {activeMode === 'PERFORMER' && performerNavLinks.length > 0 && (
          <div className="flex items-center justify-center gap-1 lg:gap-2 bg-executor-accent/30 rounded-lg px-2 lg:px-3 py-2 my-2">
            <ul className="flex items-center gap-1 lg:gap-2 flex-wrap">
              {performerNavLinks.map((link) => (
                <li key={link.href + link.label} className="flex-shrink-0">
                  <Link
                    href={link.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                      isActive(link.href)
                        ? "bg-executor-primary text-executor-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-executor-accent hover:text-executor-primary"
                    )}
                  >
                    <span className="flex-shrink-0">{link.icon}</span>
                    <span className="truncate">{link.label}</span>
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
