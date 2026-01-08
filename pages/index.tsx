import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="grid gap-10 lg:grid-cols-2 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Площадка, где продавцы находят исполнителей для задач по маркетплейсам
          </h1>
          <p className="text-lg text-muted-foreground">
            Создавайте задачи как продавец или предлагайте свои услуги как исполнитель.
            Прозрачные условия, удобный поиск, понятные фильтры.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/tasks/seller">Смотреть задачи продавцов</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/tasks/executor">Смотреть услуги исполнителей</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Для продавцов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>— Размещайте задачи по оформлению карточек, рекламе, аналитике и другим задачам.</p>
              <p>— Получайте отклики от исполнителей, которые понимают специфику маркетплейсов.</p>
              <p>— Экономьте время на поиске команды под конкретную задачу.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Для исполнителей</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>— Создавайте свои «услуги» в режиме исполнителя.</p>
              <p>— Получайте заказы от продавцов, которым нужен именно ваш формат работы.</p>
              <p>— Формируйте портфолио и зарабатывайте на экспертизе.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Как это работает</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Выбираете роль</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Зарегистрируйтесь как продавец, исполнитель или выберите обе роли,
              если и размещаете задачи, и выполняете их.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Публикуете задачи или услуги</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              В режиме продавца — создавайте задачи под свои потребности.
              В режиме исполнителя — создавайте услуги, которые вы готовы оказать.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3. Общение и результаты</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Получайте отклики, общайтесь по задачам и фиксируйте договорённости
              прямо на платформе.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Быстрый старт</h2>
        <div className="flex flex-wrap gap-4">
          <Button asChild variant="outline">
            <Link href="/register">Зарегистрироваться</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Войти</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/tasks/create">Создать задачу</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
