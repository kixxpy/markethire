"use client"

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import LoginForm from '../forms/LoginForm';
import RegisterForm from '../forms/RegisterForm';
import { Card, CardContent } from '../ui/card';

type AuthMode = 'login' | 'register' | null;

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: AuthMode;
}

export function AuthModal({ open, onOpenChange, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);

  useEffect(() => {
    if (open) {
      setMode(defaultMode);
    }
  }, [open, defaultMode]);

  const handleClose = () => {
    onOpenChange(false);
    // Сбрасываем режим после закрытия с небольшой задержкой
    setTimeout(() => setMode(defaultMode), 200);
  };

  const switchToRegister = () => {
    setMode('register');
  };

  const switchToLogin = () => {
    setMode('login');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {mode === 'login' ? 'Вход' : 'Регистрация'}
          </DialogTitle>
        </DialogHeader>
        <Card className="border-0 shadow-none">
          <CardContent className="p-0 pt-4">
            {mode === 'login' ? (
              <>
                <LoginForm onSuccess={handleClose} />
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Нет аккаунта?{' '}
                  <button
                    onClick={switchToRegister}
                    className="text-primary hover:underline font-medium"
                  >
                    Зарегистрироваться
                  </button>
                </p>
              </>
            ) : (
              <>
                <RegisterForm onSuccess={handleClose} />
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Уже есть аккаунт?{' '}
                  <button
                    onClick={switchToLogin}
                    className="text-primary hover:underline font-medium"
                  >
                    Войти
                  </button>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
