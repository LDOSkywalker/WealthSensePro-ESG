import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <h1 className={`${sizes[size]} tracking-tight ${className}`}>
      <span className="font-light">Wealth</span>
      <span className="font-normal">Sense</span>
      <span className="text-primary font-medium">Pro</span>
    </h1>
  );
};

export default Logo;
