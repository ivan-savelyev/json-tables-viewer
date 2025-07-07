import { createSignal } from 'solid-js';
import AuthModal from './AuthModal';
import { exportToCSV, flattenObject } from './csvExporter';

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
    showParamSettings: false,
    columnSettings: {
      visible: {},
      order: []
    }
  }]);
  const [authToken, setAuthToken] = createSignal('');
  const [showAuthModal, setShowAuthModal] = createSignal(false);
  const [authUrl, setAuthUrl] = createSignal('http://acm.testacm.cas.local/api/v1/api-token-auth/');

  // Функция для переключения видимости колонки
const toggleColumnVisibility = (tabId, columnName) => {
  // Запрещаем скрывать заголовок "№"
  if (columnName === '№') return;
  
  setTabs(tabs().map(tab => {
    if (tab.id === tabId) {
      const newVisible = {
        ...tab.columnSettings.visible,
        [columnName]: !tab.columnSettings.visible[columnName]
      };
      return {
        ...tab,
        columnSettings: {
          ...tab.columnSettings,
          visible: newVisible
        }
      };
    }
    return tab;
  }));
};

const [draggedIndex, setDraggedIndex] = createSignal(null);
const [dropTargetIndex, setDropTargetIndex] = createSignal(null);

  // Функция для перемещения колонки
const moveColumn = (tabId, dragIndex, hoverIndex) => {
  setTabs(tabs().map(tab => {
    if (tab.id === tabId) {
      const newOrder = [...tab.columnSettings.order];
      const visibleColumns = newOrder.filter(col => tab.columnSettings.visible[col] !== false);
      
      // Получаем фактические имена колонок для перемещения
      const dragColumn = visibleColumns[dragIndex];
      const hoverColumn = visibleColumns[hoverIndex];
      
      // Находим их позиции в полном списке
      const dragPos = newOrder.indexOf(dragColumn);
      const hoverPos = newOrder.indexOf(hoverColumn);
      
      // Удаляем и вставляем в новую позицию
      newOrder.splice(dragPos, 1);
      newOrder.splice(hoverPos, 0, dragColumn);
      
      return {
        ...tab,
        columnSettings: {
          ...tab.columnSettings,
          order: newOrder
        }
      };
    }
    return tab;
  }));
};

const DraggableColumnHeader = ({ column, index, tab, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isDropTarget }) => {
  return (
    <th
      draggable
      classList={{
        dragging: isDragging,
        'drop-target': isDropTarget
      }}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      {column}
<button 
  onClick={(e) => {
    e.stopPropagation();
    // Запрещаем скрывать заголовок "№"
    if (column !== '№') {
      toggleColumnVisibility(tab.id, column);
    }
  }}
  style={{ 
    marginLeft: '5px', 
    fontSize: '10px',
    visibility: column === '№' ? 'hidden' : 'visible' // Скрываем кнопку для "№"
  }}
>
  ×
</button>
    </th>
  );
};

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
      showParamSettings: false,
      columnSettings: {
        visible: {},
        order: []
      }
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
      const flatRow = flattenObject(row);
      Object.keys(flatRow).forEach(key => columns.add(key));
    });
    
    return Array.from(columns);
  };

const updateTabData = (id, newData, append = false) => {
  setTabs(tabs().map(tab => {
    if (tab.id === id) {
      const combinedData = append ? [...tab.data.data, ...newData.data] : newData.data;
      const flattenedData = combinedData.map(row => flattenObject(row));
      const allColumns = getAllColumns(flattenedData);
      const currentVisible = tab.columnSettings?.visible || {};
      
      const newVisible = {};
      allColumns.forEach(col => {
        // Заголовок "№" всегда видим
        newVisible[col] = col === '№' ? true : (currentVisible[col] !== false);
      });

      return {
        ...tab,
        data: {
          data: combinedData,
          meta: { ...tab.data.meta, ...newData.meta },
          allColumns: allColumns
        },
        columnSettings: {
          visible: newVisible,
          order: allColumns.filter(c => c !== '№')
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

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => {
      if (acc === null || acc === undefined) return undefined;
      return acc[part];
    }, obj);
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
  onClick={() => {
    try {
      exportToCSV(tab);
    } catch (err) {
      alert(err.message);
    }
  }}
  disabled={tab.data.data.length === 0}
  style={{ marginLeft: '8px' }}
>
  Export CSV
</button>
              </div>

          <div class="table-container">
            <div class="table-wrapper">
              {tab.data.data?.length > 0 ? (
<table>
  <thead>
    <tr>
      <th>№</th>
      {tab.columnSettings.order
        .filter(col => tab.columnSettings.visible[col] !== false)
        .map((column, colIndex) => (
          <DraggableColumnHeader
            key={`${tab.id}-${column}`}
            column={column}
            index={colIndex}
            tab={tab}
            isDragging={draggedIndex() === colIndex}
            isDropTarget={dropTargetIndex() === colIndex}
onDragStart={(e, index) => {
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", index.toString());
  setDraggedIndex(index);
}}
onDragOver={(e, index) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  if (draggedIndex() !== null && draggedIndex() !== index) {
    setDropTargetIndex(index);
  }
}}
            onDrop={(e, index) => {
              e.preventDefault();
              const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
              if (dragIndex !== index) {
                moveColumn(tab.id, dragIndex, index);
              }
              setDropTargetIndex(null);
            }}
onDragEnd={() => {
  setDraggedIndex(null);
  setDropTargetIndex(null);
}}
          />
        ))}
    </tr>
  </thead>
  <tbody>
    {tab.data.data.map((row, i) => (
      <tr key={i}>
        <td>{i + 1}</td>
        {tab.columnSettings.order
          .filter(col => tab.columnSettings.visible[col] !== false)
          .map(column => (
            <td key={`${i}-${column}`}>
              {getNestedValue(row, column) ?? ''}
            </td>
          ))}
      </tr>
    ))}
  </tbody>
</table>
              ) : (
                <div class="no-data">No data available</div>
              )}
            </div>
            
            <div style={{ margin: '10px 0' }}>
              <button onClick={() => {
                const allColumns = tab.data.allColumns.filter(c => c !== '№');
                setTabs(tabs().map(t => {
                  if (t.id === tab.id) {
                    return {
                      ...t,
                      columnSettings: {
                        visible: Object.fromEntries(allColumns.map(c => [c, true])),
                        order: [...allColumns]
                      }
                    };
                  }
                  return t;
                }));
              }}>
                Reset Columns
              </button>
            </div>

            {tab.data.data?.length > 0 && (
              <div class="meta-info">
                <h3>Meta Information</h3>
                <div class="meta-content">
                  <div class="meta-row">
                    <span class="meta-key">Total Rows:</span>
                    <span class="meta-value">{tab.data.data.length}</span>
                  </div>
                  {Object.entries(tab.data.meta).map(([key, value]) => (
                    <div class="meta-row" key={key}>
                      <span class="meta-key">{key}:</span>
                      <span class="meta-value">
                        {typeof value === 'object' ? JSON.stringify(value) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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