import React from 'react';
import { Link } from 'react-router-dom';

const MenuItems = ({ className }) => {
  return (
    <ul className="flex gap-2">
      <li><Link to="/about" className={className}>About</Link></li>
      <li><Link to="/contact" className={className}>Contact</Link></li>
    </ul>
  );
};

export default MenuItems;