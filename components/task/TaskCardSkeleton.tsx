import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import styles from './TaskCardSkeleton.module.css';

export default function TaskCardSkeleton() {
  return (
    <Card className={styles.card}>
        <div className={styles.cardContent}>
          {/* Левая часть - изображение */}
          <div className={styles.imageContainer}>
            <Skeleton className={`${styles.imageSkeleton} skeleton-shimmer`} />
          </div>

          {/* Правая часть - информация */}
          <div className={styles.infoContainer}>
            <div className={styles.header}>
              <div className={styles.titleRow}>
                <Skeleton className={`${styles.titleSkeleton} skeleton-shimmer`} />
                <Skeleton className={`${styles.badgeSkeleton} skeleton-shimmer`} />
              </div>
              <div className={styles.badges}>
                <Skeleton className={`${styles.smallBadgeSkeleton} skeleton-shimmer`} />
                <Skeleton className={`${styles.smallBadgeSkeleton} skeleton-shimmer`} />
                <Skeleton className={`${styles.smallBadgeSkeleton} skeleton-shimmer`} />
              </div>
            </div>
            
            <div className={styles.description}>
              <Skeleton className={`${styles.descriptionLine} skeleton-shimmer`} />
              <Skeleton className={`${styles.descriptionLine} skeleton-shimmer`} />
              <Skeleton className={`${styles.descriptionLineShort} skeleton-shimmer`} />
            </div>
            
            <div className={styles.footer}>
              <div className={styles.priceSection}>
                <Skeleton className={`${styles.priceSkeleton} skeleton-shimmer`} />
              </div>
              
              <div className={styles.userSection}>
                <div className={styles.userInfoRow}>
                  <Skeleton className={`${styles.avatarSkeleton} skeleton-shimmer`} />
                  <Skeleton className={`${styles.userNameSkeleton} skeleton-shimmer`} />
                  <Skeleton className={`${styles.dateSkeleton} skeleton-shimmer`} />
                </div>
                <Skeleton className={`${styles.roleBadgeSkeleton} skeleton-shimmer`} />
              </div>
            </div>
          </div>
        </div>
      </Card>
  );
}
