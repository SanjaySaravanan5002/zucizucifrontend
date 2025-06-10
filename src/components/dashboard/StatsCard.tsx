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
    <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`p-3 rounded-lg ${getIconColorClass()}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-5">
              <h3 className="text-sm font-medium text-gray-500">{title}</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{value}</p>
                {subtitle && (
                  <p className="ml-2 text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>
          </div>
          {change && (
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTrendColor()}`}>
              {increasing ? (
                <ArrowUpRight className="h-5 w-5 mr-1" />
              ) : (
                <ArrowDownRight className="h-5 w-5 mr-1" />
              )}
              {change}
            </div>
          )}
        </div>
        <p className="mt-4 text-sm text-gray-500 border-t border-gray-100 pt-4">{description}</p>
      </div>
    </div>
  );
};

export default StatsCard;