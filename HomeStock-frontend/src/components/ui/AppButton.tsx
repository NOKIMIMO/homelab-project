import React from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'ghost' | 'danger' | 'outlineDanger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'btn-primary shadow-xl shadow-primary/30 font-black hover:scale-105 active:scale-95 transition-all',
  ghost: 'btn-ghost',
  danger: 'btn-error text-white shadow-xl shadow-error/20 font-black',
  outlineDanger: 'btn-error btn-outline border-2 hover:bg-error hover:text-white font-black'
};

const sizeClasses: Record<Size, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
  icon: 'btn-circle'
};

const AppButton: React.FC<AppButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ...props
}) => {
  return (
    <button
      className={cn(
        'btn rounded-2xl',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    />
  );
};

export default AppButton;
