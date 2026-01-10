import { useState, useEffect } from 'react';
import { Category, Tag, Marketplace, TaskStatus } from '@prisma/client';
import { api } from '../../src/api/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Filter, X } from 'lucide-react';
import styles from './TaskFiltersSidebar.module.css';

interface TaskFiltersSidebarProps {
  filters: {
    categoryId?: string;
    tagIds?: string[];
    marketplace?: Marketplace;
    status?: TaskStatus;
    budgetMin?: number;
    budgetMax?: number;
    sortBy?: 'createdAt' | 'budget';
    sortOrder?: 'asc' | 'desc';
  };
  onFiltersChange: (filters: any) => void;
}

export default function TaskFiltersSidebar({ filters, onFiltersChange }: TaskFiltersSidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(filters.categoryId || 'all');
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tagIds || []);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadCategories();
    if (selectedCategoryId && selectedCategoryId !== 'all') {
      loadTags(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    setSelectedCategoryId(filters.categoryId || 'all');
    setSelectedTags(filters.tagIds || []);
  }, [filters.categoryId, filters.tagIds]);

  const loadCategories = async () => {
    try {
      const data = await api.get<Category[]>('/api/categories');
      setCategories(data);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const loadTags = async (categoryId: string) => {
    try {
      const data = await api.get<Tag[]>(`/api/tags?categoryId=${categoryId}`);
      setTags(data);
    } catch (error) {
      console.error('Ошибка загрузки тегов:', error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedTags([]);
    handleFilterChange('categoryId', categoryId === 'all' ? undefined : categoryId);
  };

  const handleTagToggle = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
    handleFilterChange('tagIds', newTags.length > 0 ? newTags : undefined);
  };

  const clearFilters = () => {
    setSelectedCategoryId('all');
    setSelectedTags([]);
    onFiltersChange({
      categoryId: undefined,
      tagIds: undefined,
      marketplace: undefined,
      status: undefined,
      budgetMin: undefined,
      budgetMax: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const filtersContent = (
    <div className={styles.filtersContent}>
      <div className={styles.filtersHeader}>
        <h3 className={styles.filtersTitle}>Фильтры</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearFilters}
          className={styles.resetButton}
        >
          Сбросить
        </Button>
      </div>

      <div className={styles.filtersList}>
        <div className={styles.filterItem}>
          <Label>Категория</Label>
          <Select
            value={selectedCategoryId || 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={styles.filterItem}>
          <Label>Маркетплейс</Label>
          <Select
            value={filters.marketplace || 'all'}
            onValueChange={(value) => handleFilterChange('marketplace', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="WB">Wildberries</SelectItem>
              <SelectItem value="OZON">OZON</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={styles.filterItem}>
          <Label>Статус</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="OPEN">Открытые</SelectItem>
              <SelectItem value="CLOSED">Закрытые</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={styles.filterItem}>
          <Label>Бюджет от</Label>
          <Input
            type="number"
            value={filters.budgetMin || ''}
            onChange={(e) => handleFilterChange('budgetMin', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="0"
          />
        </div>

        <div className={styles.filterItem}>
          <Label>Бюджет до</Label>
          <Input
            type="number"
            value={filters.budgetMax || ''}
            onChange={(e) => handleFilterChange('budgetMax', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="∞"
          />
        </div>

        <div className={styles.filterItem}>
          <Label>Сортировка</Label>
          <Select
            value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Дата (новые)</SelectItem>
              <SelectItem value="createdAt-asc">Дата (старые)</SelectItem>
              <SelectItem value="budget-desc">Бюджет (больше)</SelectItem>
              <SelectItem value="budget-asc">Бюджет (меньше)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedCategoryId && selectedCategoryId !== 'all' && tags.length > 0 && (
          <div className={styles.filterItem}>
            <Label>Теги</Label>
            <div className={styles.tagsList}>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`${styles.tagButton} ${
                    selectedTags.includes(tag.id) ? styles.tagButtonActive : ''
                  }`}
                  onClick={() => handleTagToggle(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={styles.triggerButton}
      >
        <Filter className={styles.filterIcon} />
        Фильтры
      </Button>
      <SheetContent side="left" className={styles.sheetContent}>
        <SheetHeader className={styles.sheetHeader}>
          <SheetTitle className={styles.sheetTitle}>Фильтры</SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className={styles.closeButton}
            aria-label="Закрыть"
          >
            <X className={styles.closeIcon} />
          </Button>
        </SheetHeader>
        {filtersContent}
      </SheetContent>
    </Sheet>
  );
}
