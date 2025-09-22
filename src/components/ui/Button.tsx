import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  liquid?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  liquid = false,
  glow = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'btn-primary text-white shadow-lg hover:scale-105 hover:shadow-xl focus:ring-primary',
    secondary: 'btn-secondary text-white shadow-lg hover:scale-105 hover:shadow-xl focus:ring-secondary',
    success: 'btn-success text-white shadow-lg hover:scale-105 hover:shadow-xl focus:ring-accent',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:scale-105 hover:shadow-xl focus:ring-red-500',
    outline: 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white focus:ring-primary',
    ghost: 'text-primary hover:bg-primary/10 focus:ring-primary'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  const liquidClass = liquid ? 'btn-liquid' : '';
  const glowClass = glow ? 'animate-pulse-glow' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${liquidClass} ${glowClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} ${children ? 'mr-2' : ''}`} />
      )}
      {children}
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} ${children ? 'ml-2' : ''}`} />
      )}
    </button>
  );
};

export default Button;

