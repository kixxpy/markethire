import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../src/lib/utils';
import { toast } from 'sonner';
import { api } from '../../src/api/client';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Синхронизация previewImages с images
  useEffect(() => {
    setPreviewImages(images);
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
      const updated = [...previewImages, ...data.images.slice(previewImages.length)];
      setPreviewImages(updated);
      onImagesChange(updated);
      toast.success(`Загружено ${data.images.length - previewImages.length} изображений`);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка загрузки изображений');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (disabled) return;

    const imageUrl = previewImages[index];
    
    // Если задача создана и изображение загружено на сервер, удаляем его
    if (taskId && imageUrl.startsWith('/uploads/tasks/')) {
      try {
        await api.delete(`/api/tasks/${taskId}/images/${index}`);
      } catch (error) {
        toast.error('Ошибка удаления изображения');
        return;
      }
    }

    const updated = previewImages.filter((_, i) => i !== index);
    setPreviewImages(updated);
    onImagesChange(updated);
  };

  const canAddMore = previewImages.length < maxImages;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Изображения (максимум {maxImages})</label>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Существующие изображения */}
        {previewImages.map((imageUrl, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden border border-input bg-muted group"
          >
            <Image
              src={imageUrl}
              alt={`Изображение ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                aria-label="Удалить изображение"
              >
                <X className="h-4 w-4" />
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
            className={cn(
              "aspect-square rounded-lg border-2 border-dashed border-input bg-muted hover:bg-muted/80 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {uploading ? (
              <>
                <Upload className="h-6 w-6 animate-pulse" />
                <span className="text-xs">Загрузка...</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">Добавить</span>
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
        <p className="text-xs text-muted-foreground">
          Загружено {previewImages.length} из {maxImages} изображений
        </p>
      )}
    </div>
  );
}
