import React from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'outlineDanger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  /**
   * When true the component renders a `<label>` that contains a hidden file input.
   * Use `accept`, `multiple` and `onFilesSelected` to handle file uploads.
   */
  asLabel?: boolean;
  accept?: string;
  multiple?: boolean;
  onFilesSelected?: (files: FileList | null) => void;
}

const variantClasses: Record<Variant, string> = {
  primary: 'btn-primary shadow-xl shadow-primary/30 font-black hover:scale-105 active:scale-95 transition-all',
  ghost: 'btn-ghost',
  danger: 'btn-error text-white shadow-xl shadow-error/20 font-black',
  outlineDanger: 'btn-error btn-outline border-2 hover:bg-error hover:text-white font-black'
};

const sizeClasses: Record<Size, string> = {
  sm: 'btn-sm',
  md: 'btn-sm md:btn-md',
  lg: 'btn-md md:btn-lg',
  icon: 'btn-circle'
};

const AppButton: React.FC<AppButtonProps> = ({
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  asLabel = false,
  accept,
  multiple = false,
  onFilesSelected,
  children,
  ...buttonProps
}) => {
  const classes = [
    'btn',
    'rounded-2xl',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  if (asLabel) {
    return (
      <label className={`${classes} flex items-center gap-2 px-8 cursor-pointer`}>
        {icon && <span className="flex items-center">{icon}</span>}
        <span className="hidden md:inline">{children}</span>
        <input
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => onFilesSelected?.(e.target.files)}
        />
      </label>
    );
  }

  return (
    <button className={classes} {...buttonProps}>
      {icon && <span className="flex items-center mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default AppButton;
