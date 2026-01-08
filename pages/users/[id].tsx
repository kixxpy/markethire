import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '../../src/api/client';
import { Tag } from '@prisma/client';
import { Card, CardContent } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { Skeleton } from '../../components/ui/skeleton';
import { getDisplayName } from '../../src/lib/utils';

interface UserProfile {
  id: string;
  username: string | null;
  name: string | null;
  email: string;
  description: string | null;
  priceFrom: number | null;
  telegram: string | null;
  whatsapp: string | null;
  emailContact: string | null;
  tags: Array<{ tag: Tag }>;
}

export default function UserProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const data = await api.get<UserProfile>(`/api/users/${id}`);
      setUser(data);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Skeleton className="h-4 w-32 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Пользователь не найден</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardContent className="p-8">
        <h1 className="text-3xl font-bold mb-6">
          {getDisplayName(user.username, user.email)}
        </h1>

        {user.description && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">О себе</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{user.description}</p>
          </div>
        )}

        {user.priceFrom && (
          <div className="mb-6">
            <span className="text-sm text-muted-foreground">Цена от:</span>
            <p className="text-2xl font-semibold">
              {user.priceFrom.toLocaleString('ru-RU')} ₽
            </p>
          </div>
        )}

        {user.tags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Теги</h2>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {user.tags.map((userTag, idx) => (
                <span key={idx}>
                  {userTag.tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-6" />
        <div className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Контакты</h2>
          <div className="space-y-2 text-foreground">
            {user.telegram && (
              <p>
                <span className="font-medium">Telegram:</span> {user.telegram}
              </p>
            )}
            {user.whatsapp && (
              <p>
                <span className="font-medium">WhatsApp:</span> {user.whatsapp}
              </p>
            )}
            {user.emailContact && (
              <p>
                <span className="font-medium">Email:</span> {user.emailContact}
              </p>
            )}
            {!user.telegram && !user.whatsapp && !user.emailContact && (
              <p className="text-muted-foreground">Контакты не указаны</p>
            )}
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
