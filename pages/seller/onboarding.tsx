import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/store/authStore';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { OnboardingCard } from '../../components/onboarding/OnboardingCard';
import Link from 'next/link';
import { Briefcase, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react';

export default function SellerOnboarding() {
  const { isAuthenticated, activeMode, setOnboardingSeen } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (activeMode !== 'SELLER') {
      router.push('/');
    }
  }, [isAuthenticated, activeMode, router]);

  const handleContinue = () => {
    setOnboardingSeen('SELLER');
    router.push('/seller/dashboard');
  };

  if (!isAuthenticated || activeMode !== 'SELLER') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-seller-primary/10 flex items-center justify-center">
            <Briefcase className="h-8 w-8 text-seller-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">Добро пожаловать в режим Заказчика</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Вы работаете как заказчик. Находите экспертов и делегируйте задачи для достижения ваших целей.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <OnboardingCard
          icon={Briefcase}
          title="Создавайте задачи"
          description="Опишите задачу, укажите бюджет и сроки. Эксперты увидят ваше предложение и откликнутся."
          color="seller"
        />
        <OnboardingCard
          icon={Users}
          title="Выбирайте экспертов"
          description="Просматривайте отклики, изучайте профили исполнителей и выбирайте лучших для ваших задач."
          color="seller"
        />
        <OnboardingCard
          icon={TrendingUp}
          title="Отслеживайте прогресс"
          description="Контролируйте выполнение задач, общайтесь с исполнителями и получайте результаты."
          color="seller"
        />
      </div>

      <Card className="border-seller-border bg-seller-accent/30">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Готовы начать?</h2>
              <p className="text-muted-foreground">
                Создайте свою первую задачу и начните работать с экспертами уже сегодня.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-seller-border hover:bg-seller-accent"
                onClick={handleContinue}
              >
                Пропустить
              </Button>
              <Button
                className="bg-seller-primary hover:bg-seller-primary/90 text-seller-primary-foreground"
                asChild
              >
                <Link href="/tasks/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Создать задачу
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
