import { useState, useEffect, useCallback, useRef } from 'react';
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
  count?: number;
  variant?: 'sidebar' | 'horizontal';
}

export default function AdBlock({ 
  className = '',
  count = 1,
  variant = 'sidebar'
}: AdBlockProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollLeftRef = useRef<number>(0);

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
    
    const interval = setInterval(() => {
      loadAds();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadAds]);

  const needsAutoScroll = useCallback(() => {
    if (variant !== 'horizontal' || !scrollContainerRef.current) return false;
    const container = scrollContainerRef.current;
    return container.scrollWidth > container.clientWidth;
  }, [variant]);

  const startAutoScroll = useCallback(() => {
    if (!needsAutoScroll() || isPaused || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollStep = 0.5;
    const direction = 1;

    const animate = () => {
      if (!scrollContainerRef.current || isPaused) return;

      const currentScroll = scrollContainerRef.current.scrollLeft;
      const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;

      if (currentScroll >= maxScroll) {
        scrollContainerRef.current.scrollLeft = 0;
      } else {
        scrollContainerRef.current.scrollLeft += scrollStep * direction;
      }

      scrollAnimationRef.current = requestAnimationFrame(animate);
    };

    scrollAnimationRef.current = requestAnimationFrame(animate);
  }, [needsAutoScroll, isPaused]);

  const stopAutoScroll = useCallback(() => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  }, []);

  const handleInteractionStart = useCallback(() => {
    setIsPaused(true);
    stopAutoScroll();
    
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
  }, [stopAutoScroll]);

  const handleInteractionEnd = useCallback(() => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }

    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      if (needsAutoScroll()) {
        startAutoScroll();
      }
    }, 2000);
  }, [needsAutoScroll, startAutoScroll]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const currentScrollLeft = scrollContainerRef.current.scrollLeft;
    const scrollDelta = Math.abs(currentScrollLeft - lastScrollLeftRef.current);

    if (scrollDelta > 1) {
      handleInteractionStart();

      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }

      pauseTimeoutRef.current = setTimeout(() => {
        handleInteractionEnd();
      }, 150);
    }

    lastScrollLeftRef.current = currentScrollLeft;
  }, [handleInteractionStart, handleInteractionEnd]);

  useEffect(() => {
    if (variant === 'horizontal' && ads.length > 0 && !loading) {
      const timer = setTimeout(() => {
        if (needsAutoScroll() && !isPaused) {
          startAutoScroll();
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        stopAutoScroll();
      };
    }

    return () => {
      stopAutoScroll();
    };
  }, [variant, ads, loading, needsAutoScroll, isPaused, startAutoScroll, stopAutoScroll]);

  useEffect(() => {
    return () => {
      stopAutoScroll();
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [stopAutoScroll]);

  const handleAdClick = (ad: Ad) => {
    if (ad.link) {
      window.open(ad.link, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className={`${styles.adContainer} ${styles[variant]} ${className}`}>
        {variant === 'sidebar' && <h3 className={styles.title}>Партнеры</h3>}
        <div 
          className={styles.adWrapper}
          ref={variant === 'horizontal' ? scrollContainerRef : null}
        >
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
      </div>
    );
  }

  if (ads.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.adContainer} ${styles[variant]} ${className}`}>
      {variant === 'sidebar' && <h3 className={styles.title}>Партнеры</h3>}
      <div 
        className={styles.adWrapper}
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        onMouseDown={handleInteractionStart}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd}
      >
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
    </div>
  );
}
