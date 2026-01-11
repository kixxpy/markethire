import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Target, Zap, Shield, Heart, TrendingUp } from 'lucide-react';
import styles from './about.module.css';

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>О нас</h1>
        <p className={styles.subtitle}>
          Площадка для поиска исполнителей задач по маркетплейсам
        </p>
      </div>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>Наша миссия</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.text}>
              Мы создали платформу, которая объединяет заказчиков и исполнителей 
              для эффективной работы с маркетплейсами. Наша цель — сделать процесс 
              поиска специалистов и выполнения задач максимально простым, прозрачным 
              и удобным для всех участников.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Почему выбирают нас</h2>
        <div className={styles.featuresGrid}>
          <Card>
            <CardHeader>
              <div className={styles.iconWrapper}>
                <Zap className={styles.icon} />
              </div>
              <CardTitle className={styles.featureTitle}>Быстрый поиск</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className={styles.featureDescription}>
                Удобные фильтры и поиск помогают быстро найти нужных специалистов 
                или подходящие задачи
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className={styles.iconWrapper}>
                <Shield className={styles.icon} />
              </div>
              <CardTitle className={styles.featureTitle}>Безопасность</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className={styles.featureDescription}>
                Модерация всех задач и прозрачная система взаимодействия обеспечивают 
                безопасность сделок
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className={styles.iconWrapper}>
                <Users className={styles.icon} />
              </div>
              <CardTitle className={styles.featureTitle}>Сообщество</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className={styles.featureDescription}>
                Активное сообщество профессионалов, работающих с различными 
                маркетплейсами
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className={styles.iconWrapper}>
                <Target className={styles.icon} />
              </div>
              <CardTitle className={styles.featureTitle}>Специализация</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className={styles.featureDescription}>
                Фокус на задачах по маркетплейсам: Wildberries, OZON, ЯндексМаркет, 
                Lamoda и другим
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className={styles.iconWrapper}>
                <TrendingUp className={styles.icon} />
              </div>
              <CardTitle className={styles.featureTitle}>Развитие</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className={styles.featureDescription}>
                Постоянное улучшение платформы и добавление новых возможностей 
                для пользователей
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className={styles.iconWrapper}>
                <Heart className={styles.icon} />
              </div>
              <CardTitle className={styles.featureTitle}>Поддержка</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className={styles.featureDescription}>
                Мы всегда готовы помочь и ответить на ваши вопросы. 
                Ваш успех — наш приоритет
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>Как это работает</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.stepsList}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Регистрация</h3>
                  <p className={styles.stepDescription}>
                    Создайте аккаунт и выберите роль: заказчик, исполнитель или обе роли
                  </p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Публикация</h3>
                  <p className={styles.stepDescription}>
                    Заказчики создают задачи, исполнители — услуги. Все проходит модерацию
                  </p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Взаимодействие</h3>
                  <p className={styles.stepDescription}>
                    Получайте отклики, общайтесь и договаривайтесь о сотрудничестве
                  </p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>4</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Результат</h3>
                  <p className={styles.stepDescription}>
                    Выполняйте задачи, получайте оплату и развивайте свой бизнес
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>Связаться с нами</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.text}>
              Если у вас есть вопросы, предложения или вы хотите сотрудничать с нами, 
              напишите нам на{' '}
              <a 
                href="mailto:support@sellertask.ru" 
                className={styles.link}
              >
                support@sellertask.ru
              </a>
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
