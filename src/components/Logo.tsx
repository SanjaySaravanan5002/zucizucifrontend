import React from 'react';
import { Droplets } from 'lucide-react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

const Logo = ({ size = 'medium' }: LogoProps) => {
  const sizes = {
    small: {
      container: 'h-8',
      icon: 20,
      text: 'text-lg'
    },
    medium: {
      container: 'h-10',
      icon: 24,
      text: 'text-xl'
    },
    large: {
      container: 'h-12',
      icon: 32,
      text: 'text-2xl'
    }
  };
  
  const currentSize = sizes[size];
  
  return (
    <div className={`flex items-center ${currentSize.container}`}>
      <Droplets 
        size={currentSize.icon} 
        className="text-primary mr-2"
        strokeWidth={2.5}
      />
      <span className={`font-bold ${currentSize.text} text-primary`}>
        Zuci<span className="text-gray-800">CRM</span>
      </span>
    </div>
  );
};

export default Logo;

