import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Mail, MessageSquare, Clock, Github, Twitter } from 'lucide-react';
import styles from './contacts.module.css';

export default function ContactsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <MessageSquare className={styles.headerIcon} />
        </div>
        <h1 className={styles.title}>Контакты</h1>
        <p className={styles.subtitle}>
          Свяжитесь с нами любым удобным способом. Мы всегда готовы помочь!
        </p>
      </div>

      <section className={styles.section}>
        <div className={styles.contactsGrid}>
          <Card>
            <CardHeader>
              <div className={styles.cardIconWrapper}>
                <Mail className={styles.cardIcon} />
              </div>
              <CardTitle className={styles.cardTitle}>Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.contactDetails}>
                <p className={styles.contactLabel}>Общие вопросы и поддержка:</p>
                <a 
                  href="mailto:support@sellertask.ru" 
                  className={styles.contactLink}
                >
                  support@sellertask.ru
                </a>
                <p className={styles.contactLabel}>Вопросы по конфиденциальности:</p>
                <a 
                  href="mailto:privacy@sellertask.ru" 
                  className={styles.contactLink}
                >
                  privacy@sellertask.ru
                </a>
                <p className={styles.contactLabel}>Сотрудничество и партнерство:</p>
                <a 
                  href="mailto:partners@sellertask.ru" 
                  className={styles.contactLink}
                >
                  partners@sellertask.ru
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className={styles.cardIconWrapper}>
                <Clock className={styles.cardIcon} />
              </div>
              <CardTitle className={styles.cardTitle}>Время работы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.contactDetails}>
                <p className={styles.contactText}>
                  <strong>Понедельник - Пятница:</strong> 9:00 - 18:00 (МСК)
                </p>
                <p className={styles.contactText}>
                  <strong>Суббота - Воскресенье:</strong> Выходной
                </p>
                <p className={styles.contactNote}>
                  Мы стараемся отвечать на все запросы в течение 24 часов в рабочие дни.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className={styles.cardIconWrapper}>
                <MessageSquare className={styles.cardIcon} />
              </div>
              <CardTitle className={styles.cardTitle}>Социальные сети</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.socialLinks}>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <Github className={styles.socialIcon} />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <Twitter className={styles.socialIcon} />
                  <span>Twitter</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>Часто задаваемые вопросы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.faqList}>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Как быстро вы отвечаете на письма?</h3>
                <p className={styles.faqAnswer}>
                  Мы стараемся отвечать на все запросы в течение 24 часов в рабочие дни. 
                  В выходные дни ответ может занять немного больше времени.
                </p>
              </div>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Могу ли я получить помощь по использованию платформы?</h3>
                <p className={styles.faqAnswer}>
                  Конечно! Напишите нам на support@sellertask.ru, и мы поможем разобраться 
                  с любыми вопросами по использованию платформы.
                </p>
              </div>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Как сообщить о проблеме или ошибке?</h3>
                <p className={styles.faqAnswer}>
                  Если вы обнаружили ошибку или проблему на платформе, пожалуйста, 
                  напишите нам на support@sellertask.ru с подробным описанием проблемы. 
                  Это поможет нам быстрее её исправить.
                </p>
              </div>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Предлагаете ли вы партнерские программы?</h3>
                <p className={styles.faqAnswer}>
                  Да, мы открыты для сотрудничества! Для обсуждения партнерских программ 
                  и возможностей сотрудничества напишите нам на partners@sellertask.ru.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>Обратная связь</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.text}>
              Ваше мнение очень важно для нас! Если у вас есть предложения по улучшению 
              платформы, идеи для новых функций или просто отзыв о работе сервиса, 
              мы будем рады услышать от вас.
            </p>
            <p className={styles.text}>
              Напишите нам на{' '}
              <a 
                href="mailto:support@sellertask.ru" 
                className={styles.link}
              >
                support@sellertask.ru
              </a>
              {' '}с пометкой "Обратная связь" в теме письма.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
