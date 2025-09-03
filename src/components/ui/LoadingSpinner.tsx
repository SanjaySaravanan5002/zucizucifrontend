import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'wash';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  variant = 'primary',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'border-primary border-t-transparent',
    secondary: 'border-secondary border-t-transparent',
    wash: 'border-4 border-transparent bg-gradient-to-r from-primary via-secondary to-accent rounded-full animate-wash-cycle'
  };

  if (variant === 'wash') {
    return (
      <div className={`${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
        <div className="w-full h-full rounded-full bg-white/20 animate-spin"></div>
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} animate-spin rounded-full border-4 ${variantClasses[variant]} ${className}`}
    />
  );
};

export default LoadingSpinner;