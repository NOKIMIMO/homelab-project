import React from 'react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <div className="header">
      <h1>{title}</h1>
    </div>
  );
};
