"use client"

import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuthStore } from '../../src/store/authStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Check, User, Briefcase, RefreshCw } from 'lucide-react';
import { cn } from '../../src/lib/utils';

export function RoleSwitcher() {
  const { 
    user, 
    activeMode, 
    setActiveMode, 
    canSwitchToSeller, 
    canSwitchToPerformer,
    hasSeenSellerOnboarding,
    hasSeenExecutorOnboarding,
  } = useAuthStore();
  const router = useRouter();

  // Автоматически устанавливаем режим, если он не установлен
  useEffect(() => {
    if (user && !activeMode) {
      if (user.role === 'SELLER') {
        setActiveMode('SELLER');
      } else if (user.role === 'PERFORMER') {
        setActiveMode('PERFORMER');
      } else if (user.role === 'BOTH') {
        // Для пользователей с обеими ролями используем сохраненный режим или SELLER по умолчанию
        const savedMode = typeof window !== 'undefined' 
          ? localStorage.getItem('activeMode') as 'SELLER' | 'PERFORMER' | null
          : null;
        setActiveMode(savedMode || 'SELLER');
      }
    }
  }, [user, activeMode, setActiveMode]);

  if (!user) return null;

  const handleModeChange = (mode: 'SELLER' | 'PERFORMER') => {
    setActiveMode(mode);
    
    // Проверяем, нужно ли показать onboarding
    if (mode === 'SELLER' && !hasSeenSellerOnboarding) {
      router.push('/seller/onboarding');
      return;
    }
    
    if (mode === 'PERFORMER' && !hasSeenExecutorOnboarding) {
      router.push('/executor/onboarding');
      return;
    }
    
    const currentPath = router.pathname;
    if (mode === 'SELLER') {
      if (currentPath.startsWith('/executor')) {
        router.push('/seller/dashboard');
      } else {
        const lastSellerPath = typeof window !== 'undefined' 
          ? localStorage.getItem('lastSellerPath') || '/seller/dashboard'
          : '/seller/dashboard';
        router.push(lastSellerPath);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastSellerPath', router.pathname);
      }
    } else {
      if (currentPath.startsWith('/seller')) {
        router.push('/executor/dashboard');
      } else {
        const lastPerformerPath = typeof window !== 'undefined'
          ? localStorage.getItem('lastPerformerPath') || '/executor/dashboard'
          : '/executor/dashboard';
        router.push(lastPerformerPath);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastPerformerPath', router.pathname);
      }
    }
  };

  const getModeLabel = (mode: 'SELLER' | 'PERFORMER') => {
    return mode === 'SELLER' ? 'Режим заказчика' : 'Режим исполнителя';
  };

  const getModeIcon = (mode: 'SELLER' | 'PERFORMER') => {
    return mode === 'SELLER' ? <Briefcase className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "gap-2 font-medium",
            activeMode === 'SELLER' && "border-seller-border bg-seller-accent hover:bg-seller-accent/80 text-seller-primary",
            activeMode === 'PERFORMER' && "border-executor-border bg-executor-accent hover:bg-executor-accent/80 text-executor-primary"
          )}
        >
          {activeMode ? (
            <>
              {getModeIcon(activeMode)}
              <span className="hidden sm:inline">
                {getModeLabel(activeMode)}
              </span>
              <span className="sm:hidden">
                {activeMode === 'SELLER' ? 'Заказчик' : 'Исполнитель'}
              </span>
            </>
          ) : (
            <>
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Выберите режим</span>
              <span className="sm:hidden">Режим</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Режим работы:
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup 
          value={activeMode || undefined}
          onValueChange={(value) => handleModeChange(value as 'SELLER' | 'PERFORMER')}
        >
          {canSwitchToSeller() && (
            <DropdownMenuRadioItem 
              value="SELLER"
              className={cn(
                "cursor-pointer py-2.5",
                activeMode === 'SELLER' && "bg-seller-accent/30"
              )}
            >
              <div className="flex items-center gap-2.5 w-full">
                <div className={cn(
                  "p-1 rounded-md",
                  activeMode === 'SELLER' 
                    ? "bg-seller-primary/10" 
                    : "bg-muted"
                )}>
                  <Briefcase className={cn(
                    "h-4 w-4",
                    activeMode === 'SELLER' 
                      ? "text-seller-primary" 
                      : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium",
                      activeMode === 'SELLER' && "text-seller-primary"
                    )}>
                      Заказчик
                    </span>
                    {activeMode === 'SELLER' && (
                      <Check className="h-3 w-3 text-seller-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Размещаю задачи для поиска исполнителя</span>
                </div>
              </div>
            </DropdownMenuRadioItem>
          )}
          
          {canSwitchToPerformer() && (
            <DropdownMenuRadioItem 
              value="PERFORMER"
              className={cn(
                "cursor-pointer py-2.5",
                activeMode === 'PERFORMER' && "bg-executor-accent/30"
              )}
            >
              <div className="flex items-center gap-2.5 w-full">
                <div className={cn(
                  "p-1 rounded-md",
                  activeMode === 'PERFORMER' 
                    ? "bg-executor-primary/10" 
                    : "bg-muted"
                )}>
                  <User className={cn(
                    "h-4 w-4",
                    activeMode === 'PERFORMER' 
                      ? "text-executor-primary" 
                      : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium",
                      activeMode === 'PERFORMER' && "text-executor-primary"
                    )}>
                      Исполнитель
                    </span>
                    {activeMode === 'PERFORMER' && (
                      <Check className="h-3 w-3 text-executor-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Ищу задачи и размещаю свои услуги</span>
                </div>
              </div>
            </DropdownMenuRadioItem>
          )}
        </DropdownMenuRadioGroup>
        
        {user.role === 'SELLER' && !canSwitchToPerformer() && (
          <>
            <DropdownMenuSeparator />
            <div className="p-3 bg-executor-accent/30 border border-executor-border rounded-md m-2">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-executor-primary/10">
                  <User className="h-4 w-4 text-executor-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-executor-primary mb-1">
                    Хотите зарабатывать на Markethire?
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Создайте профиль исполнителя и начните получать заказы
                  </p>
                  <Button
                    size="sm"
                    className="w-full bg-executor-primary hover:bg-executor-primary/90 text-executor-primary-foreground text-xs h-7"
                    onClick={() => router.push('/profile?action=enable-performer')}
                  >
                    Создать профиль — 2 минуты
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
        
        {user.role === 'PERFORMER' && !canSwitchToSeller() && (
          <>
            <DropdownMenuSeparator />
            <div className="p-3 bg-seller-accent/30 border border-seller-border rounded-md m-2">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-seller-primary/10">
                  <Briefcase className="h-4 w-4 text-seller-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-seller-primary mb-1">
                    Нужны эксперты для ваших задач?
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Станьте заказчиком и находите исполнителей для ваших проектов
                  </p>
                  <Button
                    size="sm"
                    className="w-full bg-seller-primary hover:bg-seller-primary/90 text-seller-primary-foreground text-xs h-7"
                    onClick={() => router.push('/profile?action=enable-seller')}
                  >
                    Создать профиль — 2 минуты
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
