import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { api } from '../../src/api/client';
import styles from './AdBlock.module.css';

interface Ad {
  id: string;
  imageUrl: string;
  link: string | null;
  position: number;
  isActive: boolean;
}

interface AdBlockProps {
  className?: string;
  count?: number; // Количество рекламных блоков
}

export default function AdBlock({ 
  className = '',
  count = 1
}: AdBlockProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAds = useCallback(async () => {
    try {
      const data = await api.get<{ ads: Ad[] }>('/api/ads');
      // Проверяем, что данные в правильном формате
      if (data && Array.isArray(data.ads)) {
        // Берем только необходимое количество активных реклам
        const adsToShow = data.ads.slice(0, count);
        setAds(adsToShow);
      } else {
        console.warn('Неожиданный формат ответа от API рекламы:', data);
        setAds([]);
      }
    } catch (error: any) {
      console.error('Ошибка загрузки рекламы:', error);
      // В режиме разработки показываем детали ошибки
      if (process.env.NODE_ENV === 'development') {
        console.error('Детали ошибки:', error.message, error);
      }
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    loadAds();
    
    // Периодически обновляем рекламу (каждые 30 секунд)
    // Это гарантирует, что изменения в админ-панели отобразятся на страницах
    const interval = setInterval(() => {
      loadAds();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadAds]);

  const handleAdClick = (ad: Ad) => {
    if (ad.link) {
      window.open(ad.link, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className={`${styles.adContainer} ${className}`}>
        <h3 className={styles.title}>Партнеры</h3>
        {[...Array(count)].map((_, i) => (
          <div key={i} className={styles.adBlock}>
            <Card className={styles.adCard}>
              <CardContent className={styles.adContent}>
                <div className={styles.adPlaceholder}>
                  <p className={styles.adText}>Загрузка...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  // Если нет активных реклам (isActive = false), не показываем рекламный блок
  if (ads.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.adContainer} ${className}`}>
      <h3 className={styles.title}>Партнеры</h3>
      {ads.map((ad) => (
        <div key={ad.id} className={styles.adBlock}>
          <Card 
            className={styles.adCard}
            onClick={() => handleAdClick(ad)}
          >
            <CardContent className={styles.adContent}>
              <img 
                src={ad.imageUrl} 
                alt="Реклама"
                className={styles.adImage}
              />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
