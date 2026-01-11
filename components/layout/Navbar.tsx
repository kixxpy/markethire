"use client"

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { 
  Menu, 
  User, 
  LogOut, 
  Briefcase, 
  ShoppingBag,
  FileText,
  LayoutDashboard
} from 'lucide-react';
import { cn, getDisplayName } from '../../src/lib/utils';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { Logo } from './Logo';
import { AuthModal } from '../auth/AuthModal';
import { ThemeToggle } from './ThemeToggle';
import styles from './Navbar.module.css';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const currentPath = router.pathname;
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const openLoginModal = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
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
        { href: '/admin/dashboard', label: 'Панель администратора', icon: <LayoutDashboard className="h-4 w-4" /> },
      ];
    }

    // Для seller и performer навигация теперь в отдельных блоках
    return baseLinks;
  };

  const navLinks = getNavLinks();

  // Ссылки для шапки профиля (Задачи заказчиков и Услуги исполнителей)
  // Теперь доступны и для администратора
  const profileHeaderLinks = [
    { 
      href: '/tasks/seller', 
      label: 'Задачи заказчиков', 
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
    <motion.nav
      className={cn(styles.navbar, "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60")}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className={cn(styles.container, "flex items-center justify-between")}>
        <div className={cn(styles.leftSection, "flex items-center min-w-0")}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Logo size="md" className={cn(styles.logo, "flex-shrink-0")} />
          </motion.div>
          
          {/* Ссылки для шапки профиля - перенесены рядом с логотипом */}
          {profileHeaderLinks.length > 0 && (
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              {profileHeaderLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                >
                  <Link
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
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Desktop / Tablet Navigation для остальных ссылок */}
          {navLinks.length > 0 && (
            <ul className={cn(styles.navLinks, "hidden md:flex items-center gap-1 lg:gap-2 flex-wrap max-w-full")}>
              {navLinks.map((link, index) => (
                <motion.li
                  key={link.href + link.label}
                  className="flex-shrink-0"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.3 }}
                >
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
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        <motion.div
          className={cn(styles.rightSection, "flex items-center")}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          {isAuthenticated ? (
            <>
              <ThemeToggle />
              <NotificationCenter />
              
              {/* Скрываем RoleSwitcher для администратора */}
              {user?.role !== 'ADMIN' && <RoleSwitcher />}
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href="/profile"
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="max-w-[140px] lg:max-w-[180px] truncate">
                    {getDisplayName(user?.username ?? null, user?.email)}
                  </span>
                </Link>
              </motion.div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className={cn(styles.logoutButton, "gap-2")}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span className={cn(styles.logoutButtonText, "hidden sm:inline")}>
                  Выйти
                </span>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={openLoginModal}
                className="hidden min-[480px]:inline-flex"
              >
                Войти
              </Button>
              <Button 
                size="sm" 
                onClick={openRegisterModal}
                className="hidden min-[480px]:inline-flex"
              >
                Регистрация
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild className={cn(styles.mobileMenuButton, "md:hidden")}>
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
                {isAuthenticated && user?.role !== 'ADMIN' && (
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
                        {getDisplayName(user?.username ?? null, user?.email)}
                      </span>
                    </div>
                  </Link>
                )}
                {!isAuthenticated && (
                  <div className="flex flex-col gap-2 mt-2 pt-4 border-t">
                    <Button variant="ghost" onClick={() => { setIsSheetOpen(false); openLoginModal(); }}>
                      Войти
                    </Button>
                    <Button onClick={() => { setIsSheetOpen(false); openRegisterModal(); }}>
                      Регистрация
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>
      </div>
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode={authModalMode}
      />
    </motion.nav>
  );
}
