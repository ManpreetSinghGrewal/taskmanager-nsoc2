import React from 'react';

export default function FilterTabs({ currentFilter, onSelectFilter }) {
  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'done', label: 'Done' },
    { id: 'overdue-task', label: 'Overdue Tasks' }
  ];

  return (
    <div id="filters">
      {filterOptions.map(option => (
        <button
          key={option.id}
          type="button"
          data-filter={option.id}
          className={`filter-btn ${currentFilter === option.id ? 'active' : ''}`}
          onClick={() => onSelectFilter(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
