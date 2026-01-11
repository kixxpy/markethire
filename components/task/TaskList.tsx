import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface TaskListProps {
  children: ReactNode;
  className?: string;
}

export function TaskList({ children, className = '' }: TaskListProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
