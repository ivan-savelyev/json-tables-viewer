import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import AuthModal from './components/AuthModal';
import TabsManager from './components/TabsManager';
import './App.css';

const App = () => {
  const [tabs, setTabs] = useState(() => {
    const saved = localStorage.getItem('tabs');
    return saved ? JSON.parse(saved) : [{
      id: '1',
      name: 'Таблица 1',
      endpoint: '',
      data: null,
      meta: null,
      loading: false,
      loadingAll: false,
      error: null,
      limit: 25,
      offset: 0
    }];
  });

  const [activeTab, setActiveTab] = useState('1');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    localStorage.setItem('tabs', JSON.stringify(tabs));
  }, [tabs]);

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const addTab = () => {
    const newTabId = Date.now().toString();
    setTabs([...tabs, {
      id: newTabId,
      name: `Таблица ${tabs.length + 1}`,
      endpoint: '',
      data: null,
      meta: null,
      loading: false,
      loadingAll: false,
      error: null,
      limit: 25,
      offset: 0
    }]);
    setActiveTab(newTabId);
  };

  const removeTab = (id) => {
    if (tabs.length <= 1) return;
    const newTabs = tabs.filter(tab => tab.id !== id);
    setTabs(newTabs);
    if (activeTab === id) setActiveTab(newTabs[0].id);
  };

  const updateEndpoint = (id, endpoint) => {
    setTabs(tabs.map(tab => 
      tab.id === id ? { ...tab, endpoint, offset: 0 } : tab
    ));
  };

  const loadData = async (id, loadAll = false) => {
    const tab = tabs.find(t => t.id === id);
    if (!tab || !tab.endpoint) return;

    setTabs(tabs.map(t => t.id === id ? { 
      ...t, 
      loading: !loadAll,
      loadingAll: loadAll,
      error: null,
      data: loadAll ? (t.data || []) : null,
      meta: loadAll ? t.meta : null,
      offset: loadAll ? t.offset : 0
    } : t));

    try {
      let allData = [];
      let currentOffset = loadAll ? tab.offset : 0;
      let hasMore = true;
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      do {
        const url = new URL(tab.endpoint);
        url.searchParams.set('limit', tab.limit);
        url.searchParams.set('offset', currentOffset);

        const response = await axios.get(url.toString(), config);
        const { data, meta } = response.data;

        if (loadAll) {
          allData = [...allData, ...(Array.isArray(data) ? data : [data])];
          currentOffset += tab.limit;
          hasMore = data?.length > 0;
          
          setTabs(tabs.map(t => t.id === id ? { 
            ...t, 
            data: allData,
            meta,
            offset: currentOffset
          } : t));
        } else {
          setTabs(tabs.map(t => t.id === id ? { 
            ...t, 
            data: Array.isArray(data) ? data : [data],
            meta,
            offset: currentOffset + tab.limit,
            loading: false
          } : t));
          break;
        }
      } while (loadAll && hasMore);

    } catch (err) {
      setTabs(tabs.map(t => t.id === id ? { 
        ...t, 
        error: `Ошибка: ${err.response?.data?.message || err.message}`,
        loading: false,
        loadingAll: false
      } : t));
    }
  };

  return (
    <div className="windows-app">
      <div className="windows-title-bar">
        <div className="windows-title">JSON Tables Viewer</div>
        <div className="windows-controls">
          <button 
            className={`windows-button ${isAuthenticated ? 'auth-success' : 'auth-failure'}`}
            onClick={isAuthenticated ? handleLogout : () => setShowAuthModal(true)}
          >
            {isAuthenticated ? 'Выйти' : 'Войти'}
          </button>
        </div>
      </div>

      <Router>
        <Routes>
          <Route path="/" element={<Navigate to={`/tab/${activeTab}`} replace />} />
          <Route path="/tab/:tabId" element={
            <TabsManager
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onTabAdd={addTab}
              onTabRemove={removeTab}
              onEndpointChange={updateEndpoint}
              onLoadData={loadData}
            />
          } />
        </Routes>
      </Router>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
};

export default App;