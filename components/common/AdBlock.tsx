import { Card, CardContent } from '../ui/card';
import styles from './AdBlock.module.css';

interface AdBlockProps {
  className?: string;
  title?: string;
}

export default function AdBlock({ 
  className = '',
  title = 'Реклама'
}: AdBlockProps) {
  return (
    <div className={`${styles.adBlock} ${className}`}>
      <Card className={styles.adCard}>
        <CardContent className={styles.adContent}>
          <div className={styles.adPlaceholder}>
            <p className={styles.adTitle}>{title}</p>
            <p className={styles.adText}>
              300x600
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
