import { ReactNode } from 'react';

interface TaskListProps {
  children: ReactNode;
  className?: string;
}

export function TaskList({ children, className = '' }: TaskListProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
