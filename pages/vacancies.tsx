import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Plus, Briefcase, User } from 'lucide-react';
import Link from 'next/link';

export default function VacanciesPage() {
  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Вакансии и резюме</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/vacancies/create" className="flex items-center justify-center">
              <Plus className="h-4 w-4 mr-2" />
              Создать вакансию
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/vacancies/resume/create" className="flex items-center justify-center">
              <Plus className="h-4 w-4 mr-2" />
              Создать резюме
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="vacancies" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="vacancies" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
            Вакансии
          </TabsTrigger>
          <TabsTrigger value="resumes" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            Резюме
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vacancies" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Вакансии скоро появятся</CardTitle>
                <CardDescription>
                  Здесь будут отображаться все доступные вакансии
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Функционал вакансий находится в разработке
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resumes" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Резюме скоро появятся</CardTitle>
                <CardDescription>
                  Здесь будут отображаться все доступные резюме
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Функционал резюме находится в разработке
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
