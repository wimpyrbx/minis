import React from 'react';
import './Card.css';
import CardHeader from './CardHeader';
import CardBody from './CardBody';
import CardFooter from './CardFooter';

// Default colors
export const defaultColors = {
  header: '#2c3440',
  body: '#f0f2f5',
  footer: '#f0f2f5'
};

function Card({ children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card; 