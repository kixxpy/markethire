import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TaskCard from '../../components/task/TaskCard';
import TaskFilters from '../../components/task/TaskFilters';
import Pagination from '../../components/common/Pagination';
import { api } from '../../src/api/client';
import { Task, Category } from '@prisma/client';
import { Skeleton } from '../../components/ui/skeleton';
import { Card, CardContent } from '../../components/ui/card';

interface TaskWithRelations extends Task {
  category: Category;
  user: {
    username?: string | null;
    name: string | null;
    email: string;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
}

export default function SellerTasksCatalog() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    sortBy: 'createdAt' as 'createdAt' | 'budget',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

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
  }, [router.query]);

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query]);

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
      queryParams.append('sortBy', (router.query.sortBy as string) || 'createdAt');
      queryParams.append('sortOrder', (router.query.sortOrder as string) || 'desc');
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', '20');
      queryParams.append('createdInMode', 'SELLER');

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
      console.error('Ошибка загрузки задач продавцов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    const newQuery = { ...router.query, page: page.toString() };
    router.push({
      pathname: '/tasks/seller',
      query: newQuery,
    });
  };

  const handleFiltersChange = (newFilters: any) => {
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
    router.push({
      pathname: '/tasks/seller',
      query,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Задачи продавцов</h1>
      <TaskFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <p className="text-muted-foreground">Задачи продавцов не найдены</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8">
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
  );
}

