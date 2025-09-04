import React from 'react';

interface TypeBadgeProps {
  type: string;
}

const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => {
  const isMonthly = type === 'Monthly';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isMonthly ? 'bg-teal-100 text-teal-800' : 'bg-orange-100 text-orange-800'
    }`}>
      {type}
    </span>
  );
};

export default TypeBadge;
