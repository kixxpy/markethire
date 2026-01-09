"use client"

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { 
  Menu, 
  User, 
  LogOut, 
  Briefcase, 
  ShoppingBag,
  FileText
} from 'lucide-react';
import { cn, getDisplayName } from '../../src/lib/utils';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { Logo } from './Logo';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const currentPath = router.pathname;
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  const getNavLinks = () => {
    const baseLinks: Array<{ href: string; label: string; icon?: React.ReactNode }> = [];

    if (!isAuthenticated) return baseLinks;

    // Администратор
    if (user?.role === 'ADMIN') {
      return [
        ...baseLinks,
        { href: '/admin/dashboard', label: 'Панель администратора' },
      ];
    }

    // Для seller и performer навигация теперь в отдельных блоках
    return baseLinks;
  };

  const navLinks = getNavLinks();

  // Ссылки для шапки профиля (Задачи продавцов и Услуги исполнителей)
  const profileHeaderLinks = [
    { 
      href: '/tasks/seller', 
      label: 'Задачи продавцов', 
      icon: <Briefcase className="h-4 w-4" />
    },
    { 
      href: '/tasks/executor', 
      label: 'Услуги исполнителей', 
      icon: <ShoppingBag className="h-4 w-4" />
    },
    { 
      href: '/vacancies', 
      label: 'Вакансии и резюме', 
      icon: <FileText className="h-4 w-4" />
    },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between gap-2 px-2 sm:px-4">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Logo size="md" className="flex-shrink-0" />
          
          {/* Ссылки для шапки профиля - перенесены рядом с логотипом */}
          {profileHeaderLinks.length > 0 && (
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              {profileHeaderLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                    isActive(link.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span className="flex-shrink-0">{link.icon}</span>
                  <span className="hidden lg:inline truncate">{link.label}</span>
                </Link>
              ))}
            </div>
          )}
          
          {/* Desktop / Tablet Navigation для остальных ссылок */}
          {navLinks.length > 0 && (
            <ul className="hidden md:flex items-center gap-1 lg:gap-2 flex-wrap max-w-full">
              {navLinks.map((link) => (
                <li key={link.href + link.label} className="flex-shrink-0">
                  <Link
                    href={link.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                      isActive(link.href)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {link.icon && <span className="flex-shrink-0">{link.icon}</span>}
                    <span className="truncate">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated ? (
            <>
              <NotificationCenter />
              
              <RoleSwitcher />
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
              >
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="max-w-[140px] lg:max-w-[180px] truncate">
                  {getDisplayName((user as any)?.username, user?.email)}
                </span>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Войти</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Регистрация</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <div className="flex flex-col gap-4 mt-6">
                <Logo 
                  size="md" 
                  variant="minimal" 
                  onClick={() => setIsSheetOpen(false)}
                />
                {isAuthenticated && (
                  <div className="pb-2 border-b">
                    <RoleSwitcher />
                  </div>
                )}
                
                {/* Ссылки для шапки профиля в мобильном меню */}
                {profileHeaderLinks.length > 0 && (
                  <nav className="flex flex-col gap-2 pb-2 border-b">
                    {profileHeaderLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsSheetOpen(false)}
                        className={cn(
                          "px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center",
                          isActive(link.href)
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <span className="mr-2 inline-flex">{link.icon}</span>
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                )}

                {/* Остальные ссылки навигации */}
                {navLinks.length > 0 && (
                  <nav className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href + link.label}
                        href={link.href}
                        onClick={() => setIsSheetOpen(false)}
                        className={cn(
                          "px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center",
                          isActive(link.href)
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {link.icon && <span className="mr-2 inline-flex">{link.icon}</span>}
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                )}
                {isAuthenticated && (
                  <Link
                    href="/profile"
                    onClick={() => setIsSheetOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer mt-2 pt-4 border-t"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {getDisplayName((user as any)?.username, user?.email)}
                      </span>
                    </div>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
