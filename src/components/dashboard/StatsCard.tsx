import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  increasing: boolean;
  icon: LucideIcon;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  change, 
  increasing, 
  icon: Icon 
}) => {
  return (
    <div className="bg-white overflow-hidden rounded-lg shadow transition-all duration-200 hover:shadow-md border border-gray-100">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-primary-light/10 rounded-md p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-xl font-semibold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span 
            className={twMerge(
              "inline-flex items-center mr-2",
              increasing ? "text-green-600" : "text-red-600"
            )}
          >
            {change}
            <svg 
              className={`ml-1 h-5 w-5 ${increasing ? "text-green-500" : "text-red-500"}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={increasing ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} 
              />
            </svg>
          </span>
          <span className="text-gray-500">from last month</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;