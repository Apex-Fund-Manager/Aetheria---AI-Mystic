import React from 'react';
import { triggerHaptic } from '../utils/haptics.ts';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  hapticEnabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  hapticEnabled = false,
  onClick,
  ...props 
}) => {
  const baseStyles = "relative w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-mystic-500 to-indigo-600 text-white shadow-lg shadow-mystic-500/30 border border-white/10 hover:shadow-mystic-500/50",
    secondary: "bg-mystic-800 text-mystic-100 border border-mystic-700 hover:bg-mystic-700",
    outline: "bg-transparent border-2 border-mystic-500 text-mystic-300 hover:bg-mystic-500/10",
    ghost: "bg-transparent text-mystic-300 hover:text-white"
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hapticEnabled && !isLoading && !disabled) {
      triggerHaptic('light');
    }
    onClick?.(e);
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Divining...
        </>
      ) : children}
    </button>
  );
};