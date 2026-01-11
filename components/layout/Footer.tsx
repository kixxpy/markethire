"use client"

import Link from 'next/link';
import { motion } from 'framer-motion';
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
    <motion.footer
      className={cn(styles.footer, "border-t bg-background")}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className={cn(styles.container, "container mx-auto")}>
        <div className={styles.content}>
          {/* Логотип и описание */}
          <motion.div
            className={styles.brandSection}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Logo size="md" className={styles.logo} />
            <p className={styles.description}>
              Площадка для поиска исполнителей задач по маркетплейсам. 
              Создавайте задачи или предлагайте свои услуги.
            </p>
          </motion.div>

          {/* Основные ссылки */}
          <motion.div
            className={styles.linksSection}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className={styles.sectionTitle}>Разделы</h3>
            <ul className={styles.linksList}>
              {mainLinks.map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                >
                  <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                    <Link
                      href={link.href}
                      className={styles.link}
                    >
                      <span className={styles.linkIcon}>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Информационные ссылки */}
          <motion.div
            className={styles.linksSection}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className={styles.sectionTitle}>Информация</h3>
            <ul className={styles.linksList}>
              {infoLinks.map((link, index) => (
                <motion.li
                  key={link.href + link.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                >
                  <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                    <Link
                      href={link.href}
                      className={styles.link}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Социальные сети */}
          <motion.div
            className={styles.linksSection}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className={styles.sectionTitle}>Связь с нами</h3>
            <ul className={styles.linksList}>
              {socialLinks.map((link, index) => (
                <motion.li
                  key={link.href + link.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
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
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Копирайт */}
        <motion.div
          className={styles.copyright}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className={styles.copyrightText}>
            © {currentYear} Markethire. Все права защищены.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
