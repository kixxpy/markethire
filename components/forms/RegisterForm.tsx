import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../../src/lib/validation';
import { api } from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'next/router';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

type RegisterFormData = {
  email: string;
  password: string;
  username: string;
  name?: string;
};

export default function RegisterForm() {
  const { login } = useAuthStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      username: '',
      name: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Очистка данных перед отправкой
      const cleanedData = {
        ...data,
        name: data.name && data.name.trim() ? data.name.trim() : undefined,
      };
      
      const response = await api.post<{
        message: string;
        user: { id: string; email: string; name: string | null; role: string };
        token: string;
      }>('/api/auth/register', cleanedData);

      login(response.user, response.token);
      toast.success('Регистрация успешна');
      router.push('/seller/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка регистрации');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Минимум 6 символов"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Никнейм</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Ваш никнейм" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Имя (необязательно)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Ваше имя" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
        </Button>
      </form>
    </Form>
  );
}
