export function exportToCSV(tab) {
  if (!tab.data.data || tab.data.data.length === 0) {
    throw new Error('No data to export');
  }

  // Получаем только видимые колонки (включая "№")
  const visibleColumns = ['№', ...tab.columnSettings.order.filter(
    col => tab.columnSettings.visible[col] !== false
  )];

  const csvRows = [];

  // Добавляем заголовки (только видимые)
  csvRows.push(visibleColumns.join(','));

  // Добавляем данные (только для видимых колонок)
  tab.data.data.forEach((row, index) => {
    const flatRow = flattenObject(row);
    const values = visibleColumns.map(header => {
      if (header === '№') return index + 1;
      const value = flatRow[header];
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
}

export function flattenObject(obj, prefix = '') {
  const result = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  });
  
  return result;
}