import React from 'react';
import { useParams } from 'react-router-dom';
import JsonTableView from './JsonTableView';
import Tab from './Tab';

const TabsManager = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  onTabAdd, 
  onTabRemove,
  onEndpointChange,
  onLoadData
}) => {
  const { tabId } = useParams();
  const currentTab = tabs.find(tab => tab.id === tabId) || tabs[0];

  const handleLoadAll = () => {
    if (currentTab.endpoint) {
      onLoadData(currentTab.id, true);
    }
  };

  return (
    <>
      <div className="windows-tab-bar">
        {tabs.map(tab => (
          <Tab
            key={tab.id}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            onClose={tabs.length > 1 ? () => onTabRemove(tab.id) : null}
          >
            {tab.name}
          </Tab>
        ))}
        <button className="windows-tab-add" onClick={onTabAdd}>
          +
        </button>
      </div>

      <div className="tab-controls">
        <div className="tab-controls-group tab-controls-url">
          <span className="tab-controls-label">URL:</span>
          <input
            type="text"
            value={currentTab.endpoint}
            onChange={(e) => onEndpointChange(currentTab.id, e.target.value)}
            placeholder="Полный URL (например: http://localhost/api/data)"
            className="windows-input"
          />
        </div>
        
        <div className="tab-controls-group">
          <button 
            className="windows-button"
            onClick={() => onLoadData(currentTab.id)}
            disabled={currentTab.loading || currentTab.loadingAll}
          >
            {currentTab.loading ? 'Загрузка...' : 'Загрузить'}
          </button>
          <button 
            className="windows-button"
            onClick={handleLoadAll}
            disabled={currentTab.loading || currentTab.loadingAll}
          >
            {currentTab.loadingAll ? 'Загрузка...' : 'Загрузить все'}
          </button>
          <span className="pagination-info">
            Лимит: {currentTab.limit}, Offset: {currentTab.offset}
          </span>
        </div>
      </div>

      <div className="windows-content">
        <JsonTableView 
          data={currentTab.data}
          meta={currentTab.meta}
          loading={currentTab.loadingAll ? 'all' : currentTab.loading}
          error={currentTab.error}
        />
      </div>
    </>
  );
};

export default TabsManager;