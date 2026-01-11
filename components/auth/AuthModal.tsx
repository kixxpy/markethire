"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <DialogTitle className="text-2xl">
                  {mode === 'login' ? 'Вход' : 'Регистрация'}
                </DialogTitle>
              </motion.div>
            </AnimatePresence>
          </DialogHeader>
          <Card className="border-0 shadow-none">
            <CardContent className="p-0 pt-4">
              <AnimatePresence mode="wait">
                {mode === 'login' ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <LoginForm onSuccess={handleClose} />
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Нет аккаунта?{' '}
                      <button
                        onClick={switchToRegister}
                        className="text-primary hover:underline font-medium transition-colors"
                      >
                        Зарегистрироваться
                      </button>
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RegisterForm onSuccess={handleClose} />
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Уже есть аккаунт?{' '}
                      <button
                        onClick={switchToLogin}
                        className="text-primary hover:underline font-medium transition-colors"
                      >
                        Войти
                      </button>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
