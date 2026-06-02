import React from 'react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <div className="w-full bg-base-100 border-b border-base-200 pb-4 mb-6">
      <h1 className="text-3xl font-black text-base-content">{title}</h1>
    </div>
  );
};
