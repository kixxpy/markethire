"use client"

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Menu } from 'lucide-react';
import { cn, getDisplayName } from '../../src/lib/utils';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationCenter } from '../notifications/NotificationCenter';

export function Navbar() {
  const { user, isAuthenticated, logout, activeMode } = useAuthStore();
  const router = useRouter();
  const currentPath = router.pathname;

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
      { href: '/', label: 'Маркетплейс задач', icon: '💼' },
    ];

    if (!isAuthenticated) return baseLinks;

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
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground text-lg shadow-sm">
              👁
            </div>
            <span className="hidden xs:inline sm:inline">Markethire</span>
          </Link>
          
          {/* Desktop / Tablet Navigation */}
          <ul className="hidden md:flex items-center gap-1 flex-wrap">
            {navLinks.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive(link.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {link.icon && <span>{link.icon}</span>}
                  {link.label}
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
                className="hidden sm:flex items-center gap-2 sm:gap-3 max-w-[180px] lg:max-w-xs truncate hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="text-sm text-muted-foreground">
                  {getDisplayName((user as any)?.username, user?.email)}
                </span>
                <Avatar>
                  {user?.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={getDisplayName((user as any)?.username, user?.email)} />
                  )}
                  <AvatarFallback>
                    {getDisplayName((user as any)?.username, user?.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
              >
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
          <Sheet>
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
                  className="flex items-center gap-2 text-xl font-bold"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground text-lg">
                    👁
                  </div>
                  <span>Markethire</span>
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
                    className="flex items-center gap-3 pt-4 border-t hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <Avatar>
                      {user?.avatarUrl && (
                        <AvatarImage src={user.avatarUrl} alt={getDisplayName((user as any)?.username, user?.email)} />
                      )}
                      <AvatarFallback>
                        {getDisplayName((user as any)?.username, user?.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
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
