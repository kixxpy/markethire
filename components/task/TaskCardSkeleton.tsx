import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import styles from './TaskCardSkeleton.module.css';

export default function TaskCardSkeleton() {
  return (
    <Card className={styles.card}>
      <div className={styles.cardContent}>
        {/* Левая часть - изображение */}
        <div className={styles.imageContainer}>
          <Skeleton className={styles.imageSkeleton} />
        </div>

        {/* Правая часть - информация */}
        <div className={styles.infoContainer}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <Skeleton className={styles.titleSkeleton} />
              <Skeleton className={styles.badgeSkeleton} />
            </div>
            <div className={styles.badges}>
              <Skeleton className={styles.smallBadgeSkeleton} />
              <Skeleton className={styles.smallBadgeSkeleton} />
              <Skeleton className={styles.smallBadgeSkeleton} />
            </div>
          </div>
          
          <div className={styles.description}>
            <Skeleton className={styles.descriptionLine} />
            <Skeleton className={styles.descriptionLine} />
            <Skeleton className={styles.descriptionLineShort} />
          </div>
          
          <div className={styles.footer}>
            <div className={styles.priceSection}>
              <Skeleton className={styles.priceSkeleton} />
            </div>
            
            <div className={styles.userSection}>
              <div className={styles.userInfoRow}>
                <Skeleton className={styles.avatarSkeleton} />
                <Skeleton className={styles.userNameSkeleton} />
                <Skeleton className={styles.dateSkeleton} />
              </div>
              <Skeleton className={styles.roleBadgeSkeleton} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
