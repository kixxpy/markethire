import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createResponseSchema } from '../../src/lib/validation';
import { api } from '../../src/api/client';
import { useRouter } from 'next/router';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';

type ResponseFormData = {
  message: string;
  price?: number;
};

interface ResponseFormProps {
  taskId: string;
  onSuccess?: () => void;
}

export default function ResponseForm({ taskId, onSuccess }: ResponseFormProps) {
  const router = useRouter();
  const form = useForm<ResponseFormData>({
    resolver: zodResolver(createResponseSchema),
    defaultValues: {
      message: '',
      price: undefined,
    },
  });

  const onSubmit = async (data: ResponseFormData) => {
    try {
      await api.post(`/api/tasks/${taskId}/responses`, data);
      toast.success('Отклик отправлен');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/tasks/${taskId}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка создания отклика');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Сообщение *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Расскажите о своем опыте и предложении..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Предлагаемая цена (₽)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting ? 'Отправка...' : 'Отправить отклик'}
        </Button>
      </form>
    </Form>
  );
}
