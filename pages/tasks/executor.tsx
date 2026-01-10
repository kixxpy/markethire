import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import TaskCard from '../../components/task/TaskCard';
import TaskFiltersSidebar from '../../components/task/TaskFiltersSidebar';
import SearchBar from '../../components/common/SearchBar';
import AdBlock from '../../components/common/AdBlock';
import Pagination from '../../components/common/Pagination';
import { api } from '../../src/api/client';
import { Task, Category } from '@prisma/client';
import { Skeleton } from '../../components/ui/skeleton';
import { Card, CardContent } from '../../components/ui/card';
import { useDebounce } from '../../src/lib/utils';
import styles from './executor.module.css';

interface TaskWithRelations extends Task {
  category: Category;
  user: {
    username?: string | null;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
}

export default function ExecutorServicesCatalog() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState((router.query.search as string) || '');
  const [filters, setFilters] = useState({
    sortBy: 'createdAt' as 'createdAt' | 'budget',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const debouncedSearch = useDebounce(searchQuery, 500);
  const currentPage = parseInt(router.query.page as string) || 1;

  useEffect(() => {
    const queryFilters = {
      categoryId: router.query.categoryId as string,
      tagIds: router.query.tagIds ? (router.query.tagIds as string).split(',') : undefined,
      marketplace: router.query.marketplace as 'WB' | 'OZON' | undefined,
      status: router.query.status as 'OPEN' | 'CLOSED' | undefined,
      budgetMin: router.query.budgetMin ? parseInt(router.query.budgetMin as string) : undefined,
      budgetMax: router.query.budgetMax ? parseInt(router.query.budgetMax as string) : undefined,
      sortBy: (router.query.sortBy as 'createdAt' | 'budget') || 'createdAt',
      sortOrder: (router.query.sortOrder as 'asc' | 'desc') || 'desc',
    };
    setFilters(queryFilters);
    setSearchQuery((router.query.search as string) || '');
  }, [router.query]);

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query, debouncedSearch]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (router.query.categoryId) queryParams.append('categoryId', router.query.categoryId as string);
      if (router.query.tagIds) queryParams.append('tagIds', router.query.tagIds as string);
      if (router.query.marketplace) queryParams.append('marketplace', router.query.marketplace as string);
      if (router.query.status) queryParams.append('status', router.query.status as string);
      if (router.query.budgetMin) queryParams.append('budgetMin', router.query.budgetMin as string);
      if (router.query.budgetMax) queryParams.append('budgetMax', router.query.budgetMax as string);
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      queryParams.append('sortBy', (router.query.sortBy as string) || 'createdAt');
      queryParams.append('sortOrder', (router.query.sortOrder as string) || 'desc');
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', '20');
      queryParams.append('createdInMode', 'PERFORMER');

      const data = await api.get<{
        tasks: TaskWithRelations[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/api/tasks?${queryParams.toString()}`);

      setTasks(data.tasks);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Ошибка загрузки услуг исполнителей:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    const newQuery = { ...router.query, page: page.toString() };
    router.push({
      pathname: '/tasks/executor',
      query: newQuery,
    });
  };

  const handleFiltersChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    const query: any = { page: '1' };
    if (newFilters.categoryId) query.categoryId = newFilters.categoryId;
    if (newFilters.tagIds && newFilters.tagIds.length > 0) query.tagIds = newFilters.tagIds.join(',');
    if (newFilters.marketplace) query.marketplace = newFilters.marketplace;
    if (newFilters.status) query.status = newFilters.status;
    if (newFilters.budgetMin) query.budgetMin = newFilters.budgetMin.toString();
    if (newFilters.budgetMax) query.budgetMax = newFilters.budgetMax.toString();
    if (newFilters.sortBy) query.sortBy = newFilters.sortBy;
    if (newFilters.sortOrder) query.sortOrder = newFilters.sortOrder;
    if (searchQuery) query.search = searchQuery;
    router.push({
      pathname: '/tasks/executor',
      query,
    });
  }, [router, searchQuery]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    const query: any = { ...router.query, page: '1', search: value || undefined };
    if (!value) delete query.search;
    router.push({
      pathname: '/tasks/executor',
      query,
    });
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Услуги исполнителей</h1>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Поиск по названию или описанию услуги..."
          />
          <TaskFiltersSidebar filters={filters} onFiltersChange={handleFiltersChange} />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainContent}>
          {loading ? (
            <div className={styles.grid}>
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Услуги исполнителей не найдены</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className={styles.grid}>
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <aside className={styles.sidebar}>
          <AdBlock count={10} />
        </aside>
      </div>
    </div>
  );
}

