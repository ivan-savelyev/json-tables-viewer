import { createSignal } from 'solid-js';
import AuthModal from './AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = createSignal(0);
  const [tabs, setTabs] = createSignal([{ 
    id: 0, 
    title: 'Tab 1', 
    url: '', 
    data: {
      data: [],
      meta: {},
      allColumns: []
    },
    loading: false,
    loadingAll: false,
    limit: 100,
    offset: 0,
    paramNames: {
      limit: 'limit',
      offset: 'offset'
    },
    showParamSettings: false
  }]);
  const [authToken, setAuthToken] = createSignal('');
  const [showAuthModal, setShowAuthModal] = createSignal(false);
  const [authUrl, setAuthUrl] = createSignal('http://acm.testacm.cas.local/api/v1/api-token-auth/');

  const addTab = () => {
    const newId = tabs().length > 0 ? Math.max(...tabs().map(t => t.id)) + 1 : 0;
    setTabs([...tabs(), { 
      id: newId, 
      title: `Tab ${newId + 1}`, 
      url: '', 
      data: {
        data: [],
        meta: {},
        allColumns: []
      },
      loading: false,
      loadingAll: false,
      limit: 100,
      offset: 0,
      paramNames: {
        limit: 'limit',
        offset: 'offset'
      },
      showParamSettings: false
    }]);
    setActiveTab(newId);
  };

  const closeTab = (id) => {
    if (tabs().length <= 1) return;
    const newTabs = tabs().filter(tab => tab.id !== id);
    setTabs(newTabs);
    if (activeTab() === id) {
      setActiveTab(newTabs[0].id);
    }
  };

  const handleLoginSuccess = (token) => {
    setAuthToken(token);
    setShowAuthModal(false);
  };

  const getAllColumns = (data) => {
    const columns = new Set(['№']);
    data.forEach(row => {
      Object.keys(row).forEach(key => columns.add(key));
    });
    return Array.from(columns);
  };

  const updateTabData = (id, newData, append = false) => {
    setTabs(tabs().map(tab => {
      if (tab.id === id) {
        const combinedData = append ? [...tab.data.data, ...newData.data] : newData.data;
        return {
          ...tab,
          data: {
            data: combinedData,
            meta: { ...tab.data.meta, ...newData.meta },
            allColumns: getAllColumns(combinedData)
          },
          loading: false,
          loadingAll: false
        };
      }
      return tab;
    }));
  };

  const updateTabUrl = (id, newUrl) => {
    setTabs(tabs().map(tab => 
      tab.id === id ? { ...tab, url: newUrl } : tab
    ));
  };

  const updateTabLimit = (id, newLimit) => {
    setTabs(tabs().map(tab => 
      tab.id === id ? { ...tab, limit: newLimit } : tab
    ));
  };

  const updateTabOffset = (id, newOffset) => {
    setTabs(tabs().map(tab => 
      tab.id === id ? { ...tab, offset: newOffset } : tab
    ));
  };

  const updateParamName = (id, param, newName) => {
    setTabs(tabs().map(tab => 
      tab.id === id ? { 
        ...tab, 
        paramNames: {
          ...tab.paramNames,
          [param]: newName
        }
      } : tab
    ));
  };

  const toggleParamSettings = (id) => {
    setTabs(tabs().map(tab => 
      tab.id === id ? { 
        ...tab, 
        showParamSettings: !tab.showParamSettings 
      } : tab
    ));
  };

  const loadData = async (tab, loadAll = false) => {
    try {
      setTabs(tabs().map(t => 
        t.id === tab.id ? { ...t, loading: !loadAll, loadingAll: loadAll } : t
      ));

      let allData = [];
      let offset = tab.offset;
      let hasMore = true;
      let currentMeta = {};

      while (hasMore && (loadAll || offset === tab.offset)) {
        const urlObj = new URL(tab.url, window.location.origin);
        urlObj.searchParams.set(tab.paramNames.offset, offset);
        urlObj.searchParams.set(tab.paramNames.limit, tab.limit);

        const response = await fetch(urlObj.toString(), {
          headers: {
            'Authorization': `Bearer ${authToken()}`
          }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();

        if (!jsonData.data || jsonData.data.length === 0) {
          hasMore = false;
        } else {
          allData = [...allData, ...jsonData.data];
          offset += tab.limit;
          currentMeta = jsonData.meta || {};
        }

        if (!loadAll) break;
      }

      updateTabData(tab.id, {
        data: allData,
        meta: {
          ...currentMeta,
          totalLoaded: allData.length,
          lastOffset: offset
        }
      });
    } catch (err) {
      alert(err.message);
      setTabs(tabs().map(t => 
        t.id === tab.id ? { ...t, loading: false, loadingAll: false } : t
      ));
    }
  };

  const exportToCSV = (tab) => {
    if (!tab.data.data || tab.data.data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = tab.data.allColumns;
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    tab.data.data.forEach((row, index) => {
      const values = headers.map(header => {
        if (header === '№') return index + 1;
        const value = row[header];
        if (value === undefined || value === null) return '';
        const escaped = String(value).replace(/"/g, '""');
        return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `data_${tab.title}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div class="app">
      <div class="window">
        <div class="title-bar">
          <div class="title-bar-text">JSON Tables Viewer</div>
          <div class="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button 
              class={`auth-button ${authToken() ? 'authenticated' : ''}`}
              onClick={() => setShowAuthModal(true)}
              aria-label="Auth"
            ></button>
          </div>
        </div>

        <div class="window-body">
          <div class="tabs-header">
            {tabs().map(tab => (
              <button
                class={`tab ${activeTab() === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.title}
                <span class="tab-close" onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}>✕</span>
              </button>
            ))}
            <button class="tab-button" onClick={addTab}>+</button>
          </div>

          {tabs().map(tab => (
            <div 
              class="tab-content" 
              style={{ display: activeTab() === tab.id ? 'block' : 'none' }}
            >
              <div class="field-row" style={{ margin: '10px 0' }}>
                <input
                  type="text"
                  value={tab.url}
                  onInput={(e) => updateTabUrl(tab.id, e.target.value)}
                  placeholder="Enter JSON URL"
                  style={{ "flex-grow": 1 }}
                />
                <button 
                  onClick={() => toggleParamSettings(tab.id)}
                  style={{ marginRight: '8px' }}
                >
                  ⚙️
                </button>
              </div>

              {tab.showParamSettings && (
                <div class="param-settings" style={{ margin: '10px 0', padding: '10px', background: '#f0f0f0' }}>
                  <div class="field-row">
                    <label>Limit param name:</label>
                    <input
                      type="text"
                      value={tab.paramNames.limit}
                      onInput={(e) => updateParamName(tab.id, 'limit', e.target.value)}
                      style={{ width: '100px' }}
                    />
                    <label>Value:</label>
                    <input
                      type="number"
                      value={tab.limit}
                      onInput={(e) => updateTabLimit(tab.id, parseInt(e.target.value) || 100)}
                      style={{ width: '80px' }}
                    />
                  </div>
                  <div class="field-row">
                    <label>Offset param name:</label>
                    <input
                      type="text"
                      value={tab.paramNames.offset}
                      onInput={(e) => updateParamName(tab.id, 'offset', e.target.value)}
                      style={{ width: '100px' }}
                    />
                    <label>Value:</label>
                    <input
                      type="number"
                      value={tab.offset}
                      onInput={(e) => updateTabOffset(tab.id, parseInt(e.target.value) || 0)}
                      style={{ width: '80px' }}
                    />
                  </div>
                </div>
              )}

              <div class="field-row" style={{ margin: '10px 0' }}>
                <button 
                  onClick={() => loadData(tab, false)}
                  disabled={!authToken() || tab.loading || tab.loadingAll}
                >
                  {tab.loading ? 'Loading...' : 'Load'}
                </button>
                <button 
                  onClick={() => loadData(tab, true)}
                  disabled={!authToken() || tab.loadingAll || tab.loading}
                  style={{ marginLeft: '8px' }}
                >
                  {tab.loadingAll ? 'Loading All...' : 'Load All'}
                </button>
                <button 
                  onClick={() => exportToCSV(tab)}
                  disabled={tab.data.data.length === 0}
                  style={{ marginLeft: '8px' }}
                >
                  Export CSV
                </button>
              </div>

              <div class="table-wrapper">
                {tab.data.data?.length > 0 ? (
                  <>
                    <table>
                      <thead>
                        <tr>
                          {tab.data.allColumns.map(column => (
                            <th key={column}>{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tab.data.data.map((row, i) => (
                          <tr key={i}>
                            {tab.data.allColumns.map(column => {
                              if (column === '№') {
                                return <td key={column}>{i + 1}</td>;
                              }
                              const value = row[column];
                              return (
                                <td key={`${i}-${column}`}>
                                  {value === undefined || value === null 
                                    ? '' 
                                    : typeof value === 'object' 
                                      ? JSON.stringify(value) 
                                      : value}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div class="meta-info">
                      <h3>Meta Information</h3>
                      <table class="meta-table">
                        <tbody>
                          <tr>
                            <td class="meta-key">Total Rows:</td>
                            <td class="meta-value">{tab.data.data.length}</td>
                          </tr>
                          {Object.entries(tab.data.meta).map(([key, value]) => (
                            <tr key={key}>
                              <td class="meta-key">{key}:</td>
                              <td class="meta-value">
                                {typeof value === 'object' ? JSON.stringify(value) : value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div class="no-data">No data available</div>
                )}
              </div>
            </div>
          ))}

          {showAuthModal() && (
            <AuthModal
              authUrl={authUrl()}
              onClose={() => setShowAuthModal(false)}
              onLoginSuccess={handleLoginSuccess}
              onAuthUrlChange={(newUrl) => setAuthUrl(newUrl)}
            />
          )}
        </div>

        <div class="status-bar">
          <p class="status-bar-field">Status: {authToken() ? 'Authenticated' : 'Not authenticated'}</p>
          <p class="status-bar-field">Tab {activeTab() + 1} of {tabs().length}</p>
        </div>
      </div>
    </div>
  );
}