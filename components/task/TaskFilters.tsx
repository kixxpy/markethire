import { useState, useEffect } from 'react';
import { Category, Tag, Marketplace, TaskStatus } from '@prisma/client';
import { api } from '../../src/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { ChevronDown } from 'lucide-react';

interface TaskFiltersProps {
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

export default function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(filters.categoryId || 'all');
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tagIds || []);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadCategories();
    if (selectedCategoryId && selectedCategoryId !== 'all') {
      loadTags(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    try {
      const data = await api.get<Category[]>('/api/categories');
      // Сортируем так, чтобы "Другое" всегда было в конце
      const sorted = [...data].sort((a, b) => {
        if (a.name === "Другое") return 1;
        if (b.name === "Другое") return -1;
        return a.name.localeCompare(b.name, "ru");
      });
      setCategories(sorted);
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Свернуть фильтры' : 'Развернуть фильтры'}
          >
            <CardTitle>Фильтры</CardTitle>
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-200 ${
                isExpanded ? 'transform rotate-180' : ''
              }`}
            />
          </button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              clearFilters();
            }}
          >
            Сбросить
          </Button>
        </div>
      </CardHeader>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
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
                <SelectItem value="YANDEX_MARKET">ЯндексМаркет</SelectItem>
                <SelectItem value="LAMODA">Lamoda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label>Бюджет от</Label>
            <Input
              type="number"
              value={filters.budgetMin || ''}
              onChange={(e) => handleFilterChange('budgetMin', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Бюджет до</Label>
            <Input
              type="number"
              value={filters.budgetMax || ''}
              onChange={(e) => handleFilterChange('budgetMax', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="∞"
            />
          </div>

          <div className="space-y-2">
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
        </div>

        {selectedCategoryId && selectedCategoryId !== 'all' && tags.length > 0 && (
          <div className="space-y-2">
            <Label>Теги</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`px-2.5 py-0.5 rounded text-sm cursor-pointer transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                  onClick={() => handleTagToggle(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
        </CardContent>
      </div>
    </Card>
  );
}
