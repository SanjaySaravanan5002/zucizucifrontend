import React from 'react';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  increasing?: boolean;
  icon: LucideIcon;
  description: string;
  subtitle?: string;
}

const StatsCard = ({ 
  title, 
  value, 
  change, 
  increasing, 
  icon: Icon, 
  description,
  subtitle 
}: StatsCardProps) => {
  const getIconColorClass = () => {
    if (title.toLowerCase().includes('customer')) return 'text-purple-600 bg-purple-50';
    if (title.toLowerCase().includes('revenue') || title.toLowerCase().includes('income')) return 'text-green-600 bg-green-50';
    if (title.toLowerCase().includes('expense')) return 'text-red-600 bg-red-50';
    if (title.toLowerCase().includes('lead')) return 'text-blue-600 bg-blue-50';
    if (title.toLowerCase().includes('conversion')) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getTrendColor = () => {
    if (!change) return '';
    const isPositive = increasing;
    const isNeutral = change === '0%';
    
    if (isNeutral) return 'text-gray-600 bg-gray-50';
    return isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  return (
    <div className="glass-card floating-card animate-fade-in-up overflow-hidden">
      <div className="p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-xl shadow-lg animate-bounce-subtle ${getIconColorClass()}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
        <div className="mb-2">
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {change && (
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${getTrendColor()}`}>
            {increasing ? (
              <ArrowUpRight className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 mr-1" />
            )}
            {change}
          </div>
        )}
        <p className="text-sm text-gray-500 border-t border-gray-100 pt-3 mt-3">{description}</p>
      </div>
    </div>
  );
};

export default StatsCard;

