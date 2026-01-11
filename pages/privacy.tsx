import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, Lock, Eye, FileText, Mail, AlertCircle } from 'lucide-react';
import styles from './privacy.module.css';

export default function PrivacyPage() {
  const lastUpdated = '10 января 2025';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Shield className={styles.headerIcon} />
        </div>
        <h1 className={styles.title}>Политика конфиденциальности</h1>
        <p className={styles.subtitle}>
          Последнее обновление: {lastUpdated}
        </p>
      </div>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>
              <Eye className={styles.sectionIcon} />
              Общие положения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.text}>
              Настоящая Политика конфиденциальности определяет порядок обработки и защиты 
              персональных данных пользователей платформы Markethire (далее — «Платформа»), 
              расположенной по адресу sellertask.ru.
            </p>
            <p className={styles.text}>
              Используя Платформу, вы соглашаетесь с условиями настоящей Политики 
              конфиденциальности. Если вы не согласны с условиями, пожалуйста, 
              не используйте Платформу.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>
              <FileText className={styles.sectionIcon} />
              Какие данные мы собираем
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.list}>
              <div className={styles.listItem}>
                <h3 className={styles.listItemTitle}>Данные при регистрации:</h3>
                <ul className={styles.nestedList}>
                  <li>Имя пользователя</li>
                  <li>Электронная почта</li>
                  <li>Пароль (хранится в зашифрованном виде)</li>
                  <li>Роль (заказчик, исполнитель или обе)</li>
                </ul>
              </div>
              <div className={styles.listItem}>
                <h3 className={styles.listItemTitle}>Данные профиля:</h3>
                <ul className={styles.nestedList}>
                  <li>Аватар (если загружен)</li>
                  <li>Дополнительная информация, указанная в профиле</li>
                </ul>
              </div>
              <div className={styles.listItem}>
                <h3 className={styles.listItemTitle}>Данные при использовании сервиса:</h3>
                <ul className={styles.nestedList}>
                  <li>Созданные задачи и услуги</li>
                  <li>Отклики на задачи</li>
                  <li>Сообщения и переписка</li>
                  <li>Загруженные изображения</li>
                  <li>История активности</li>
                </ul>
              </div>
              <div className={styles.listItem}>
                <h3 className={styles.listItemTitle}>Технические данные:</h3>
                <ul className={styles.nestedList}>
                  <li>IP-адрес</li>
                  <li>Тип браузера и операционной системы</li>
                  <li>Информация об устройстве</li>
                  <li>Cookies и аналогичные технологии</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>
              <Lock className={styles.sectionIcon} />
              Как мы используем ваши данные
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.list}>
              <div className={styles.listItem}>
                <h3 className={styles.listItemTitle}>Мы используем ваши данные для:</h3>
                <ul className={styles.nestedList}>
                  <li>Предоставления доступа к функциям Платформы</li>
                  <li>Обработки и модерации создаваемого контента</li>
                  <li>Обеспечения связи между заказчиками и исполнителями</li>
                  <li>Отправки уведомлений о важных событиях</li>
                  <li>Улучшения работы Платформы и пользовательского опыта</li>
                  <li>Обеспечения безопасности и предотвращения мошенничества</li>
                  <li>Соблюдения требований законодательства</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>
              <Shield className={styles.sectionIcon} />
              Защита данных
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.text}>
              Мы применяем современные технические и организационные меры для защиты 
              ваших персональных данных от несанкционированного доступа, изменения, 
              раскрытия или уничтожения:
            </p>
            <ul className={styles.nestedList}>
              <li>Шифрование данных при передаче (HTTPS)</li>
              <li>Безопасное хранение паролей с использованием хеширования</li>
              <li>Регулярное обновление систем безопасности</li>
              <li>Ограниченный доступ к персональным данным только для уполномоченных сотрудников</li>
              <li>Регулярное резервное копирование данных</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>
              <Eye className={styles.sectionIcon} />
              Передача данных третьим лицам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.text}>
              Мы не продаем и не передаем ваши персональные данные третьим лицам, 
              за исключением следующих случаев:
            </p>
            <ul className={styles.nestedList}>
              <li>Когда это необходимо для предоставления услуг Платформы</li>
              <li>Когда это требуется по закону или по запросу государственных органов</li>
              <li>Когда вы дали явное согласие на передачу данных</li>
              <li>Для защиты прав и безопасности Платформы и пользователей</li>
            </ul>
            <p className={styles.text}>
              Мы можем использовать сторонние сервисы (например, для аналитики или 
              хостинга), которые обрабатывают данные в соответствии с их политиками 
              конфиденциальности.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>
              <FileText className={styles.sectionIcon} />
              Cookies и аналогичные технологии
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.text}>
              Мы используем cookies и аналогичные технологии для:
            </p>
            <ul className={styles.nestedList}>
              <li>Аутентификации и сохранения сессий</li>
              <li>Запоминания ваших предпочтений</li>
              <li>Анализа использования Платформы</li>
              <li>Улучшения функциональности</li>
            </ul>
            <p className={styles.text}>
              Вы можете управлять настройками cookies в своем браузере, однако это 
              может повлиять на функциональность Платформы.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>
              <Lock className={styles.sectionIcon} />
              Ваши права
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.text}>
              В соответствии с законодательством о защите персональных данных, 
              вы имеете право:
            </p>
            <ul className={styles.nestedList}>
              <li>Получать информацию о ваших персональных данных</li>
              <li>Требовать исправления неточных данных</li>
              <li>Требовать удаления ваших данных</li>
              <li>Ограничивать обработку ваших данных</li>
              <li>Возражать против обработки данных</li>
              <li>Отозвать согласие на обработку данных</li>
              <li>Подать жалобу в уполномоченный орган</li>
            </ul>
            <p className={styles.text}>
              Для реализации этих прав свяжитесь с нами по адресу{' '}
              <a 
                href="mailto:privacy@sellertask.ru" 
                className={styles.link}
              >
                privacy@sellertask.ru
              </a>
            </p>
          </CardContent>
        </Card>
      </section>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>
              <AlertCircle className={styles.sectionIcon} />
              Хранение данных
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.text}>
              Мы храним ваши персональные данные в течение срока, необходимого для 
              достижения целей обработки, или в течение срока, установленного 
              законодательством.
            </p>
            <p className={styles.text}>
              После удаления аккаунта ваши данные будут удалены в течение 30 дней, 
              за исключением случаев, когда законодательство требует более длительного 
              хранения.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>
              <FileText className={styles.sectionIcon} />
              Изменения в Политике конфиденциальности
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.text}>
              Мы оставляем за собой право вносить изменения в настоящую Политику 
              конфиденциальности. О существенных изменениях мы уведомим вас через 
              Платформу или по электронной почте.
            </p>
            <p className={styles.text}>
              Рекомендуем периодически просматривать эту страницу, чтобы быть в курсе 
              актуальной информации о защите ваших данных.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.sectionTitle}>
              <Mail className={styles.sectionIcon} />
              Контакты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.text}>
              Если у вас есть вопросы относительно настоящей Политики конфиденциальности 
              или обработки ваших персональных данных, вы можете связаться с нами:
            </p>
            <div className={styles.contactInfo}>
              <p className={styles.contactItem}>
                <strong>Email:</strong>{' '}
                <a 
                  href="mailto:privacy@sellertask.ru" 
                  className={styles.link}
                >
                  privacy@sellertask.ru
                </a>
              </p>
              <p className={styles.contactItem}>
                <strong>Поддержка:</strong>{' '}
                <a 
                  href="mailto:support@sellertask.ru" 
                  className={styles.link}
                >
                  support@sellertask.ru
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
