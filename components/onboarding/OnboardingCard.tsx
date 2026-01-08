import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LucideIcon } from 'lucide-react';

interface OnboardingCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: 'seller' | 'executor';
}

export function OnboardingCard({ icon: Icon, title, description, color }: OnboardingCardProps) {
  const colorClasses = color === 'seller' 
    ? 'border-seller-border bg-seller-accent/30 text-seller-primary'
    : 'border-executor-border bg-executor-accent/30 text-executor-primary';

  return (
    <Card className={colorClasses}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Icon className="h-6 w-6" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
