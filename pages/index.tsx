import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuthStore } from '../src/store/authStore';

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Редирект администратора на панель
  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, user, router]);

  // Если администратор, не показываем контент (будет редирект)
  if (isAuthenticated && user?.role === 'ADMIN') {
    return null;
  }

  const openLoginModal = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const steps = [
    {
      title: "1. Выбираете роль",
      content: "Зарегистрируйтесь как заказчик, исполнитель или выберите обе роли, если и размещаете задачи, и выполняете их.",
    },
    {
      title: "2. Публикуете задачи или услуги",
      content: "В режиме заказчика — создавайте задачи под свои потребности. В режиме исполнителя — создавайте услуги, которые вы готовы оказать.",
    },
    {
      title: "3. Общение и результаты",
      content: "Получайте отклики, общайтесь по задачам и фиксируйте договорённости прямо на платформе.",
    },
  ];

  return (
    <>
      <motion.div
        className="space-y-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.section
          className="grid gap-10 lg:grid-cols-2 items-center"
          variants={itemVariants}
        >
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <motion.h1
              className="text-4xl md:text-5xl font-bold tracking-tight"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Площадка, где заказчики находят исполнителей для задач по маркетплейсам
            </motion.h1>
            <motion.p
              className="text-lg text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Создавайте задачи как заказчик или предлагайте свои услуги как исполнитель.
              Прозрачные условия, удобный поиск, понятные фильтры.
            </motion.p>
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Button asChild size="lg">
                <Link href="/tasks/seller">Смотреть задачи заказчиков</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/tasks/executor">Смотреть услуги исполнителей</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <motion.div
              data-aos="fade-left"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Для заказчиков</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>— Размещайте задачи по оформлению карточек, рекламе, аналитике и другим задачам.</p>
                  <p>— Получайте отклики от исполнителей, которые понимают специфику маркетплейсов.</p>
                  <p>— Экономьте время на поиске команды под конкретную задачу.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              data-aos="fade-left"
              data-aos-delay="100"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Для исполнителей</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>— Создавайте свои «услуги» в режиме исполнителя.</p>
                  <p>— Получайте заказы от заказчиков, которым нужен именно ваш формат работы.</p>
                  <p>— Формируйте портфолио и зарабатывайте на экспертизе.</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.section>

        <motion.section
          className="space-y-6"
          variants={itemVariants}
        >
          <motion.h2
            className="text-2xl font-semibold"
            data-aos="fade-up"
          >
            Как это работает
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                variants={itemVariants}
                whileHover={{ scale: 1.03, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {step.content}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="space-y-4"
          variants={itemVariants}
          data-aos="fade-up"
        >
          <motion.h2
            className="text-2xl font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Быстрый старт
          </motion.h2>
          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Button variant="outline" onClick={openRegisterModal}>
              Зарегистрироваться
            </Button>
            <Button variant="outline" onClick={openLoginModal}>
              Войти
            </Button>
            <Button asChild variant="outline">
              <Link href="/tasks/create">Создать задачу</Link>
            </Button>
          </motion.div>
        </motion.section>
      </motion.div>
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        defaultMode={authModalMode}
      />
    </>
  );
}
