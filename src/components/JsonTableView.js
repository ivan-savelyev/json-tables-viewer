import React, { useState, useMemo } from 'react';

const JsonTableView = ({ data, meta, loading, error }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!data || !sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const renderTable = () => {
    if (!data) return <div className="no-data">Данные не загружены</div>;
    
    try {
      if (data.length === 0) return <div className="no-data">Нет данных для отображения</div>;
      
      const headers = Object.keys(data[0] || {});
      
      return (
        <>
          {loading && (
            <div className="loading-all">
              Загружено {data.length} записей{loading === 'all' ? ', загрузка продолжается...' : ''}
            </div>
          )}
          
          <table className="windows-table">
            <thead>
              <tr>
                {headers.map(key => (
                  <th 
                    key={key}
                    onClick={() => requestSort(key)}
                    className={sortConfig.key === key ? `sorted-${sortConfig.direction}` : ''}
                  >
                    {key}
                    {sortConfig.key === key && (
                      <span className="sort-arrow">
                        {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr key={index}>
                  {headers.map(key => (
                    <td key={`${index}-${key}`}>
                      {typeof item[key] === 'object' 
                        ? JSON.stringify(item[key]) 
                        : String(item[key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {meta && (
            <div className="meta-section">
              <h3>Meta информация:</h3>
              <table className="windows-table">
                <tbody>
                  {Object.entries(meta).map(([key, value]) => (
                    <tr key={key}>
                      <th>{key}</th>
                      <td>
                        {typeof value === 'object' 
                          ? JSON.stringify(value) 
                          : String(value ?? '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      );
    } catch (err) {
      return <div className="error-message">Ошибка отрисовки данных</div>;
    }
  };

  return (
    <div className="tab-content">
      {error && <div className="error-message">{error}</div>}
      {renderTable()}
    </div>
  );
};

export default JsonTableView;