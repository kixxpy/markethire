"use client"

import Link from 'next/link';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function Logo({ 
  className = '', 
  variant = 'default',
  size = 'md',
  onClick
}: LogoProps) {
  const textSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl'
  };

  if (variant === 'minimal') {
    return (
      <Link
        href="/"
        onClick={onClick}
        className={`flex items-center font-bold whitespace-nowrap ${className}`}
        aria-label="Markethire"
      >
        <span className={`${textSizes[size]} font-bold tracking-tight text-foreground`}>
          Markethire
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/"
      onClick={onClick}
      className={`flex items-center font-bold whitespace-nowrap ${className}`}
      aria-label="Markethire - Главная страница"
    >
      <span className={`${textSizes[size]} font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent`}>
        Markethire
      </span>
    </Link>
  );
}
