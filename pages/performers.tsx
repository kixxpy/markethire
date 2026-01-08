import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '../src/api/client';
import { Category, Tag } from '@prisma/client';
import Link from 'next/link';

interface Performer {
  id: string;
  name: string | null;
  email: string;
  description: string | null;
  priceFrom: number | null;
  telegram: string | null;
  whatsapp: string | null;
  emailContact: string | null;
  tags: Array<{ tag: Tag }>;
}

export default function PerformersPage() {
  const router = useRouter();
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categoryId: '',
    tagIds: [] as string[],
    priceFrom: '',
    search: '',
  });

  useEffect(() => {
    loadCategories();
    loadPerformers();
  }, [router.query]);

  useEffect(() => {
    if (filters.categoryId) {
      loadTags(filters.categoryId);
    } else {
      setTags([]);
    }
  }, [filters.categoryId]);

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

  const loadPerformers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.categoryId) queryParams.append('categoryIds', filters.categoryId);
      if (filters.tagIds.length > 0) queryParams.append('tagIds', filters.tagIds.join(','));
      if (filters.priceFrom) queryParams.append('priceFrom', filters.priceFrom);
      if (filters.search) queryParams.append('search', filters.search);

      const data = await api.get<Performer[]>(`/api/users/performers?${queryParams.toString()}`);
      setPerformers(data);
    } catch (error) {
      console.error('Ошибка загрузки исполнителей:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleTagToggle = (tagId: string) => {
    const newTags = filters.tagIds.includes(tagId)
      ? filters.tagIds.filter(id => id !== tagId)
      : [...filters.tagIds, tagId];
    handleFilterChange('tagIds', newTags);
  };

  const applyFilters = () => {
    loadPerformers();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Исполнители</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Фильтры</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Категория
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Цена от (₽)
            </label>
            <input
              type="number"
              value={filters.priceFrom}
              onChange={(e) => handleFilterChange('priceFrom', e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Поиск
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Имя или описание"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Применить
            </button>
          </div>
        </div>

        {filters.categoryId && tags.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Теги
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.tagIds.includes(tag.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Загрузка исполнителей...</p>
        </div>
      ) : performers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Исполнители не найдены</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {performers.map((performer) => (
            <div key={performer.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {performer.name || performer.email}
              </h3>
              {performer.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {performer.description}
                </p>
              )}
              {performer.priceFrom && (
                <p className="text-lg font-semibold text-gray-900 mb-4">
                  От {performer.priceFrom.toLocaleString('ru-RU')} ₽
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {performer.tags.slice(0, 5).map((userTag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded"
                  >
                    {userTag.tag.name}
                  </span>
                ))}
              </div>
              <div className="flex flex-col space-y-2 text-sm text-gray-600">
                {performer.telegram && (
                  <span>Telegram: {performer.telegram}</span>
                )}
                {performer.whatsapp && (
                  <span>WhatsApp: {performer.whatsapp}</span>
                )}
                {performer.emailContact && (
                  <span>Email: {performer.emailContact}</span>
                )}
              </div>
              <Link
                href={`/users/${performer.id}`}
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
              >
                Посмотреть профиль
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
