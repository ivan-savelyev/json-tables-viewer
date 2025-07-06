import React from 'react';

const Tab = ({ children, isActive, onClick, onClose }) => (
  <div className="tab-container">
    <button
      className={`windows-tab ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
    {onClose && (
      <button className="tab-close" onClick={onClose}>
        ✕
      </button>
    )}
  </div>
);

export default Tab;