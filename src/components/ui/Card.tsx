import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'floating' | 'gradient';
  className?: string;
  animate?: boolean;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  animate = false,
  hover = true
}) => {
  const baseClasses = 'rounded-xl overflow-hidden';
  
  const variantClasses = {
    default: 'bg-white shadow-sm border border-gray-200',
    glass: 'glass-card',
    floating: 'floating-card bg-white shadow-lg',
    gradient: 'bg-gradient-to-br from-white to-gray-50 shadow-lg border border-white/50'
  };

  const animateClass = animate ? 'animate-fade-in-up' : '';
  const hoverClass = hover && variant === 'floating' ? '' : hover ? 'hover:shadow-lg transition-shadow duration-300' : '';

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${animateClass} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`p-6 border-b border-gray-200/50 ${className}`}>
    {children}
  </div>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`p-6 border-t border-gray-200/50 bg-gray-50/50 ${className}`}>
    {children}
  </div>
);

export default Card;

