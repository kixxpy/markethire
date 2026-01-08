import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { OnboardingCard } from '../../components/onboarding/OnboardingCard';
import Link from 'next/link';
import { User, Search, DollarSign, Plus, ArrowRight } from 'lucide-react';

export default function ExecutorOnboarding() {
  const { isAuthenticated, activeMode, setOnboardingSeen } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (activeMode !== 'PERFORMER') {
      router.push('/');
    }
  }, [isAuthenticated, activeMode, router]);

  const handleContinue = () => {
    setOnboardingSeen('PERFORMER');
    router.push('/executor/dashboard');
  };

  if (!isAuthenticated || activeMode !== 'PERFORMER') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-executor-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-executor-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">Добро пожаловать в режим Executor</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Вы работаете как исполнитель. Находите интересные задачи и зарабатывайте, выполняя их.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <OnboardingCard
          icon={Search}
          title="Находите задачи"
          description="Просматривайте доступные задачи, фильтруйте по категориям и находите проекты, которые вам интересны."
          color="executor"
        />
        <OnboardingCard
          icon={DollarSign}
          title="Откликайтесь и зарабатывайте"
          description="Отправляйте отклики на задачи, предлагайте свою цену и сроки. Получайте заказы и выполняйте их."
          color="executor"
        />
        <OnboardingCard
          icon={User}
          title="Развивайте профиль"
          description="Создавайте услуги, добавляйте теги навыков и повышайте свой рейтинг, чтобы получать больше заказов."
          color="executor"
        />
      </div>

      <Card className="border-executor-border bg-executor-accent/30">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Готовы начать?</h2>
              <p className="text-muted-foreground">
                Найдите свою первую задачу или создайте услугу, чтобы заказчики могли найти вас.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-executor-border hover:bg-executor-accent"
                onClick={handleContinue}
              >
                Пропустить
              </Button>
              <Button
                className="bg-executor-primary hover:bg-executor-primary/90 text-executor-primary-foreground"
                asChild
              >
                <Link href="/">
                  <Search className="h-4 w-4 mr-2" />
                  Найти задачи
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
