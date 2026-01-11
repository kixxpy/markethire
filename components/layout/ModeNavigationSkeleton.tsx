import { Skeleton } from '../ui/skeleton';
import styles from './ModeNavigationSkeleton.module.css';

export function ModeNavigationSkeleton() {
  return (
    <div className={styles.navigation}>
      <div className={styles.container}>
        <div className={styles.navContainer}>
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <Skeleton className={styles.navLink} />
            </li>
            <li className={styles.navItem}>
              <Skeleton className={styles.navLink} />
            </li>
            <li className={styles.navItem}>
              <Skeleton className={styles.navLink} />
            </li>
            <li className={styles.navItem}>
              <Skeleton className={styles.navLink} />
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
