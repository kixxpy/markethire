"use client"

import Link from 'next/link';
import { 
  Briefcase, 
  ShoppingBag,
  FileText,
  Mail,
  Github,
  Twitter
} from 'lucide-react';
import { cn } from '../../src/lib/utils';
import { Logo } from './Logo';
import styles from './Footer.module.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const mainLinks = [
    { 
      href: '/tasks/seller', 
      label: 'Задачи заказчиков', 
      icon: <Briefcase className="h-4 w-4" />
    },
    { 
      href: '/tasks/executor', 
      label: 'Услуги исполнителей', 
      icon: <ShoppingBag className="h-4 w-4" />
    },
    { 
      href: '/vacancies', 
      label: 'Вакансии и резюме', 
      icon: <FileText className="h-4 w-4" />
    },
  ];

  const infoLinks = [
    { href: '/about', label: 'О нас' },
    { href: '/', label: 'Правила использования' },
    { href: '/privacy', label: 'Политика конфиденциальности' },
    { href: '/contacts', label: 'Контакты' },
  ];

  const socialLinks = [
    { 
      href: 'https://github.com', 
      label: 'GitHub', 
      icon: <Github className="h-4 w-4" />,
      external: true
    },
    { 
      href: 'https://twitter.com', 
      label: 'Twitter', 
      icon: <Twitter className="h-4 w-4" />,
      external: true
    },
    { 
      href: 'mailto:support@sellertask.ru', 
      label: 'Email', 
      icon: <Mail className="h-4 w-4" />,
      external: true
    },
  ];

  return (
    <footer className={cn(styles.footer, "border-t bg-background")}>
      <div className={cn(styles.container, "container mx-auto")}>
        <div className={styles.content}>
          {/* Логотип и описание */}
          <div className={styles.brandSection}>
            <Logo size="md" className={styles.logo} />
            <p className={styles.description}>
              Площадка для поиска исполнителей задач по маркетплейсам. 
              Создавайте задачи или предлагайте свои услуги.
            </p>
          </div>

          {/* Основные ссылки */}
          <div className={styles.linksSection}>
            <h3 className={styles.sectionTitle}>Разделы</h3>
            <ul className={styles.linksList}>
              {mainLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={styles.link}
                  >
                    <span className={styles.linkIcon}>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Информационные ссылки */}
          <div className={styles.linksSection}>
            <h3 className={styles.sectionTitle}>Информация</h3>
            <ul className={styles.linksList}>
              {infoLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className={styles.link}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Социальные сети */}
          <div className={styles.linksSection}>
            <h3 className={styles.sectionTitle}>Связь с нами</h3>
            <ul className={styles.linksList}>
              {socialLinks.map((link) => (
                <li key={link.href + link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      <span className={styles.linkIcon}>{link.icon}</span>
                      <span>{link.label}</span>
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className={styles.link}
                    >
                      <span className={styles.linkIcon}>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Копирайт */}
        <div className={styles.copyright}>
          <p className={styles.copyrightText}>
            © {currentYear} Markethire. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
