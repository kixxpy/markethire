"use client"

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Menu, User, LogOut } from 'lucide-react';
import { cn, getDisplayName } from '../../src/lib/utils';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationCenter } from '../notifications/NotificationCenter';

export function Navbar() {
  const { user, isAuthenticated, logout, activeMode } = useAuthStore();
  const router = useRouter();
  const currentPath = router.pathname;
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/' || currentPath.startsWith('/tasks');
    }
    return currentPath.startsWith(path);
  };

  const getNavLinks = () => {
    const baseLinks = [
      { href: '/', label: 'Каталог задач' },
    ];

    if (!isAuthenticated) return baseLinks;

    // Администратор
    if (user?.role === 'ADMIN') {
      return [
        ...baseLinks,
        { href: '/admin/dashboard', label: 'Панель администратора' },
      ];
    }

    if (activeMode === 'SELLER') {
      return [
        ...baseLinks,
        { href: '/seller/dashboard', label: 'Панель управления' },
        { href: '/seller/tasks', label: 'Мои задачи' },
        { href: '/tasks/create', label: 'Создать задачу' },
      ];
    } else if (activeMode === 'PERFORMER') {
      return [
        ...baseLinks,
        { href: '/executor/dashboard', label: 'Панель управления' },
        { href: '/executor/services', label: 'Мои услуги' },
        { href: '/executor/responses', label: 'Мои отклики' },
      ];
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between gap-2 px-2 sm:px-4">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 text-base sm:text-xl font-bold text-foreground hover:text-primary transition-colors whitespace-nowrap"
          >
            <svg 
              width="120" 
              height="28" 
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 sm:h-8 w-auto"
              viewBox="0 0 300 70"
              preserveAspectRatio="xMidYMid meet"
            >
              <text 
                x="0" 
                y="50"
                fontFamily="Verdana, sans-serif"
                fontSize="48"
                fontWeight="700"
                fill="currentColor"
              >
                Markethire
              </text>
            </svg>
          </Link>
          
          {/* Desktop / Tablet Navigation */}
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
                <Link
                  href="/"
                  onClick={() => setIsSheetOpen(false)}
                  className="flex items-center gap-2 text-xl font-bold"
                >
                  <svg 
                    width="120" 
                    height="28" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-auto"
                    viewBox="0 0 300 70"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <text 
                      x="0" 
                      y="50"
                      fontFamily="Verdana, sans-serif"
                      fontSize="48"
                      fontWeight="700"
                      fill="currentColor"
                    >
                      Markethire
                    </text>
                  </svg>
                </Link>
                {isAuthenticated && (
                  <div className="pb-2 border-b">
                    <RoleSwitcher />
                  </div>
                )}
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      onClick={() => setIsSheetOpen(false)}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive(link.href)
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {link.icon && <span className="mr-2">{link.icon}</span>}
                      {link.label}
                    </Link>
                  ))}
                </nav>
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
