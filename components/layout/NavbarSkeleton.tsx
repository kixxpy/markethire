import { Skeleton } from '../ui/skeleton';
import styles from './NavbarSkeleton.module.css';

export function NavbarSkeleton() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          {/* Логотип */}
          <Skeleton className={styles.logo} />
          
          {/* Ссылки навигации (скрыты на мобильных) */}
          <div className={styles.navLinks}>
            <Skeleton className={styles.navLink} />
            <Skeleton className={styles.navLink} />
            <Skeleton className={styles.navLink} />
          </div>
        </div>

        <div className={styles.rightSection}>
          {/* Кнопка темы */}
          <Skeleton className={styles.iconButton} />
          
          {/* Центр уведомлений */}
          <Skeleton className={styles.iconButton} />
          
          {/* Переключатель ролей */}
          <Skeleton className={styles.roleSwitcher} />
          
          {/* Профиль пользователя (скрыт на мобильных) */}
          <Skeleton className={styles.profileLink} />
          
          {/* Кнопка выхода */}
          <Skeleton className={styles.logoutButton} />
          
          {/* Мобильное меню */}
          <Skeleton className={styles.mobileMenuButton} />
        </div>
      </div>
    </nav>
  );
}
