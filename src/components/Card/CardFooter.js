import React from 'react';
import { defaultColors } from './Card';

function CardFooter({ 
  children, 
  className = '',
  backgroundColor = defaultColors.footer 
}) {
  return (
    <div 
      className={`card-footer ${className}`}
      style={{ backgroundColor }}
    >
      {children}
    </div>
  );
}

export default CardFooter; 