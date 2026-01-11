import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../src/lib/utils';
import { toast } from 'sonner';
import { api } from '../../src/api/client';
import styles from './TaskImageUpload.module.css';

interface TaskImageUploadProps {
  images: string[];
  maxImages?: number;
  onImagesChange: (images: string[]) => void;
  taskId?: string;
  disabled?: boolean;
}

export default function TaskImageUpload({
  images,
  maxImages = 3,
  onImagesChange,
  taskId,
  disabled = false,
}: TaskImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>(images);
  const [removedImages, setRemovedImages] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Синхронизация previewImages с images
  useEffect(() => {
    setPreviewImages(images);
    // Сбрасываем список удаленных изображений при изменении images извне
    setRemovedImages(new Set());
  }, [images]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - previewImages.length;
    if (remainingSlots <= 0) {
      toast.error(`Максимум ${maxImages} изображений`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    // Валидация файлов
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of filesToUpload) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Файл ${file.name}: недопустимый тип. Разрешены только: jpg, jpeg, png, webp`);
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`Файл ${file.name}: размер превышает 5MB`);
        continue;
      }
    }

    // Если задача уже создана, загружаем на сервер
    if (taskId) {
      await uploadImagesToServer(filesToUpload);
    } else {
      // Иначе создаем превью для локального отображения
      createLocalPreviews(filesToUpload);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createLocalPreviews = (files: File[]) => {
    const newPreviews: string[] = [];
    let loadedCount = 0;
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        newPreviews.push(result);
        loadedCount++;
        
        if (loadedCount === files.length) {
          const updated = [...previewImages, ...newPreviews];
          setPreviewImages(updated);
          onImagesChange(updated);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadImagesToServer = async (files: File[]) => {
    if (!taskId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const data = await api.post<{ images: string[] }>(`/api/tasks/${taskId}/images`, formData);
      // Фильтруем изображения, исключая те, которые были удалены локально
      // Это предотвращает возврат удаленных изображений при загрузке новых
      const filteredImages = data.images.filter(img => !removedImages.has(img));
      
      // Правильно вычисляем количество загруженных изображений
      // Это количество новых файлов, которые были загружены
      const uploadedCount = files.length;
      
      setPreviewImages(filteredImages);
      onImagesChange(filteredImages);
      toast.success(`Загружено ${uploadedCount} изображений`);
    } catch (error: any) {
      const errorMessage = error.message || 'Ошибка загрузки изображений';
      // Если ошибка связана с превышением лимита изображений, показываем более понятное сообщение
      if (errorMessage.includes('Максимум 3 изображения') || errorMessage.includes('максимум')) {
        toast.error('Максимум 3 изображения на задачу. Удалите существующие изображения, чтобы добавить новые.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (disabled) return;

    const imageUrl = previewImages[index];
    
    // При редактировании существующей задачи НЕ удаляем сразу из БД
    // Удаляем только из локального состояния
    // Реальное удаление произойдет при сохранении формы через updateTask
    // Это предотвращает проблему, когда изображение удаляется из БД,
    // но при сохранении формы администратор видит старое состояние
    if (taskId && imageUrl.startsWith('/uploads/tasks/')) {
      // Добавляем изображение в список удаленных, чтобы оно не вернулось при загрузке новых
      setRemovedImages(prev => new Set(prev).add(imageUrl));
      // Удаляем из локального состояния
      const updated = previewImages.filter((_, i) => i !== index);
      setPreviewImages(updated);
      onImagesChange(updated);
      toast.success('Изображение будет удалено при сохранении изменений');
    } else {
      // Для локальных превью или задач без taskId просто удаляем из состояния
      const updated = previewImages.filter((_, i) => i !== index);
      setPreviewImages(updated);
      onImagesChange(updated);
    }
  };

  const canAddMore = previewImages.length < maxImages;

  return (
    <div className={styles.container}>
      <label className={styles.label}>Изображения (необязательно, максимум {maxImages})</label>
      
      <div className={styles.grid}>
        {/* Существующие изображения */}
        {previewImages.map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            className={styles.imageContainer}
          >
            <Image
              src={imageUrl}
              alt={`Изображение ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 33vw"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className={styles.removeButton}
                aria-label="Удалить изображение"
              >
                <X className={styles.icon} />
              </button>
            )}
          </div>
        ))}

        {/* Кнопка добавления */}
        {canAddMore && !disabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(styles.addButton, uploading && styles.addButtonDisabled)}
          >
            {uploading ? (
              <>
                <Upload className={cn(styles.iconLarge, "animate-pulse")} />
                <span className={styles.text}>Загрузка...</span>
              </>
            ) : (
              <>
                <ImageIcon className={styles.iconLarge} />
                <span className={styles.text}>Добавить</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading || !canAddMore}
      />

      {previewImages.length > 0 && (
        <p className={styles.info}>
          Загружено {previewImages.length} из {maxImages} изображений
        </p>
      )}
    </div>
  );
}
