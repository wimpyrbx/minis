import React from 'react';
import { defaultColors } from './Card';

function CardHeader({ 
  title, 
  icon, 
  backgroundColor = defaultColors.header,
  rightComponent,
  className = '' 
}) {
  return (
    <div 
      className={`card-header ${className}`} 
      style={{ backgroundColor }}
    >
      <div className="card-header-left">
        {icon && <i className={icon}></i>}
        {title && <h3>{title}</h3>}
      </div>
      {rightComponent && (
        <div className="card-header-right">
          {rightComponent}
        </div>
      )}
    </div>
  );
}

export default CardHeader; 