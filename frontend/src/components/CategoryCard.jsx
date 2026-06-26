import React from 'react';

const CategoryCard = ({ title, icon, onClick, active }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 min-w-[100px]
        ${active 
          ? 'border-primary bg-green-50 shadow-sm' 
          : 'border-border bg-white hover:border-primary hover:shadow-sm'
        }`}
    >
      <div className={`text-3xl mb-2 ${active ? 'text-primary' : 'text-gray-500'}`}>
        {icon}
      </div>
      <span className={`text-sm font-medium ${active ? 'text-primary' : 'text-text'}`}>
        {title}
      </span>
    </button>
  );
};

export default CategoryCard;
