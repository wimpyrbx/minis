import React from 'react';
import { defaultColors } from './Card';

function CardBody({ 
  children, 
  className = '',
  backgroundColor = defaultColors.body 
}) {
  return (
    <div 
      className={`card-body ${className}`}
      style={{ backgroundColor }}
    >
      {children}
    </div>
  );
}

export default CardBody; 