import React, { InputHTMLAttributes, SelectHTMLAttributes, ButtonHTMLAttributes } from 'react';

export const Input = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string, error?: string }>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="w-full mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        ref={ref}
        className={`w-full px-3 py-2 bg-white border rounded-md text-sm shadow-sm placeholder-gray-400
          focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label?: string, error?: string }>(
  ({ label, error, className = '', children, ...props }, ref) => (
    <div className="w-full mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        ref={ref}
        className={`w-full px-3 py-2 bg-white border rounded-md text-sm shadow-sm
          focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

export const Button = React.forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }>(
  ({ variant = 'primary', className = '', children, ...props }, ref) => {
    const baseStyle = "inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8] border border-transparent",
      secondary: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300",
      danger: "bg-red-600 text-white hover:bg-red-700 border border-transparent"
    };

    return (
      <button
        ref={ref}
        className={`${baseStyle} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export const Badge = ({ children, variant = 'gray' }: { children: React.ReactNode, variant?: 'gray' | 'green' | 'yellow' | 'red' | 'blue' }) => {
  const variants = {
    gray: "bg-gray-100 text-gray-800 border-gray-200",
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    red: "bg-red-100 text-red-800 border-red-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variants[variant]}`}>
      {children}
    </span>
  );
};
