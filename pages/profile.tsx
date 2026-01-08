import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema } from '../src/lib/validation';
import { api } from '../src/api/client';
import { useAuthStore } from '../src/store/authStore';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { getDisplayName } from '../src/lib/utils';

type ProfileFormData = {
  name?: string;
  description?: string;
  telegram?: string;
  emailContact?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated, router]);

  const loadProfile = async () => {
    try {
      const data = await api.get('/api/users/me');
      setProfile(data);
      setAvatarPreview(data.avatarUrl || null);
      reset({
        name: data.name || '',
        description: data.description || '',
        telegram: data.telegram || '',
        emailContact: data.emailContact || '',
      });
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setError(null);
      setSuccess(false);
      const updated = await api.patch('/api/users/me', data);
      updateUser(updated);
      setProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления профиля');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Сброс предыдущих ошибок и успешных сообщений
    setError(null);
    setSuccess(false);

    // Валидация типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Недопустимый тип файла. Разрешены только: jpg, jpeg, png, webp');
      // Сброс значения input для возможности повторной загрузки того же файла
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Валидация размера файла
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Размер файла превышает 5MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      setUploadingAvatar(true);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post<{ avatarUrl: string; user: any }>('/api/users/me/avatar', formData);
      
      // Обновление состояния после успешной загрузки
      setAvatarPreview(response.avatarUrl);
      updateUser(response.user);
      setProfile(response.user);
      setSuccess(true);
      setError(null);
      
      // Автоматическое скрытие сообщения об успехе через 3 секунды
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      // Улучшенная обработка ошибок
      let errorMessage = 'Ошибка загрузки аватара';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      console.error('Ошибка загрузки аватара:', err);
    } finally {
      setUploadingAvatar(false);
      // Сброс значения input после завершения операции
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isAuthenticated || loading) {
    return <div className="text-center py-12">Загрузка...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold mb-6">Профиль</h1>

      <Card className="mb-6">
        <CardContent className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              Профиль успешно обновлен
            </div>
          )}

          {/* Аватар */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <Avatar className="h-24 w-24">
              {avatarPreview && (
                <AvatarImage src={avatarPreview} alt={getDisplayName(profile?.username, profile?.email)} />
              )}
              <AvatarFallback className="text-2xl">
                {getDisplayName(profile?.username, profile?.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
                id="avatar-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? 'Загрузка...' : 'Изменить аватар'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                JPG, PNG или WEBP. Максимум 5MB
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="username">Никнейм</Label>
              <Input
                type="text"
                id="username"
                value={profile?.username || ''}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <div>
              <Label htmlFor="name">Имя (необязательно)</Label>
              <Input
                {...register('name')}
                type="text"
                id="name"
                placeholder="Ваше имя"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Описание (для исполнителей)</Label>
              <textarea
                {...register('description')}
                id="description"
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telegram">Telegram (необязательно)</Label>
                <Input
                  {...register('telegram')}
                  type="text"
                  id="telegram"
                  placeholder="@username"
                />
              </div>

              <div>
                <Label htmlFor="emailContact">Email для связи (необязательно)</Label>
                <Input
                  {...register('emailContact')}
                  type="email"
                  id="emailContact"
                  placeholder="email@example.com"
                />
                {errors.emailContact && (
                  <p className="text-sm text-red-600 mt-1">{errors.emailContact.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
