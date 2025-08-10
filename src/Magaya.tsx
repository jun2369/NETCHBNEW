import React, { useState, useEffect } from 'react';
import './Magaya.css';

declare global {
  interface Window {
    XLSX: any;
  }
}

interface TableRow {
  entryNumber: string;
  status: string;
  eventTime: string;
  timeZone: string;
  line: string;
}

interface InputGroup {
  id: number;
  inputData: string;
  entryNumber: string;
  isExpanded: boolean;
}

const MagayaPage: React.FC = () => {
  const [airport, setAirport] = useState('ORD');
  const [mawb, setMawb] = useState('');
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [filteredData, setFilteredData] = useState<TableRow[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [xlsxLoaded, setXlsxLoaded] = useState(false);
  
  // 筛选状态
  const [filters, setFilters] = useState({
    entryNumber: '',
    status: '',
    eventTime: '',
    timeZone: '',
    line: ''
  });
  
  // 初始化20个输入组，默认只展开第一个
  const [inputGroups, setInputGroups] = useState<InputGroup[]>([
    { id: 1, inputData: '', entryNumber: '', isExpanded: true },
    { id: 2, inputData: '', entryNumber: '', isExpanded: false },
    { id: 3, inputData: '', entryNumber: '', isExpanded: false },
    { id: 4, inputData: '', entryNumber: '', isExpanded: false },
    { id: 5, inputData: '', entryNumber: '', isExpanded: false },
    { id: 6, inputData: '', entryNumber: '', isExpanded: false },
    { id: 7, inputData: '', entryNumber: '', isExpanded: false },
    { id: 8, inputData: '', entryNumber: '', isExpanded: false },
    { id: 9, inputData: '', entryNumber: '', isExpanded: false },
    { id: 10, inputData: '', entryNumber: '', isExpanded: false },
    { id: 11, inputData: '', entryNumber: '', isExpanded: false },
    { id: 12, inputData: '', entryNumber: '', isExpanded: false },
    { id: 13, inputData: '', entryNumber: '', isExpanded: false },
    { id: 14, inputData: '', entryNumber: '', isExpanded: false },
    { id: 15, inputData: '', entryNumber: '', isExpanded: false },
    { id: 16, inputData: '', entryNumber: '', isExpanded: false },
    { id: 17, inputData: '', entryNumber: '', isExpanded: false },
    { id: 18, inputData: '', entryNumber: '', isExpanded: false },
    { id: 19, inputData: '', entryNumber: '', isExpanded: false },
    { id: 20, inputData: '', entryNumber: '', isExpanded: false },
    { id: 21, inputData: '', entryNumber: '', isExpanded: false },
    { id: 22, inputData: '', entryNumber: '', isExpanded: false },
    { id: 23, inputData: '', entryNumber: '', isExpanded: false },
  ]);

  // 加载 XLSX 库
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => {
      setXlsxLoaded(true);
    };
    document.body.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // 筛选数据
  useEffect(() => {
    let filtered = [...tableData];
    
    if (filters.entryNumber) {
      filtered = filtered.filter(row => 
        row.entryNumber.toLowerCase().includes(filters.entryNumber.toLowerCase())
      );
    }
    if (filters.status) {
      filtered = filtered.filter(row => 
        row.status.toLowerCase().includes(filters.status.toLowerCase())
      );
    }
    if (filters.eventTime) {
      filtered = filtered.filter(row => 
        row.eventTime.toLowerCase().includes(filters.eventTime.toLowerCase())
      );
    }
    if (filters.timeZone) {
      filtered = filtered.filter(row => 
        row.timeZone.toLowerCase().includes(filters.timeZone.toLowerCase())
      );
    }
    if (filters.line) {
      filtered = filtered.filter(row => 
        row.line.toLowerCase().includes(filters.line.toLowerCase())
      );
    }
    
    setFilteredData(filtered);
  }, [filters, tableData]);

  const getTimeZone = (selectedAirport: string): string => {
    if (selectedAirport === 'ORD' || selectedAirport === 'DFW') {
      return 'America/Chicago';
    } else if (selectedAirport === 'MIA' || selectedAirport === 'JFK') {
      return 'America/New_York';
    } else if (selectedAirport === 'LAX' || selectedAirport === 'SFO') {
      return 'America/Los_Angeles';
    }
    return '';
  };

  const toggleExpand = (id: number) => {
    setInputGroups(groups => 
      groups.map(group => 
        group.id === id ? { ...group, isExpanded: !group.isExpanded } : group
      )
    );
  };

  const updateInputData = (id: number, value: string) => {
    setInputGroups(groups => 
      groups.map(group => 
        group.id === id ? { ...group, inputData: value } : group
      )
    );
  };

  const updateEntryNumber = (id: number, value: string) => {
    setInputGroups(groups => 
      groups.map(group => 
        group.id === id ? { ...group, entryNumber: value } : group
      )
    );
  };

  const handleReset = () => {
    // 重置所有输入组
    setInputGroups(groups => 
      groups.map((group, index) => ({
        ...group,
        inputData: '',
        entryNumber: '',
        isExpanded: index === 0 // 只保持第一个展开
      }))
    );
    // 重置MAWB
    setMawb('');
    // 重置表格和筛选
    setTableData([]);
    setFilteredData([]);
    setShowTable(false);
    setFilters({
      entryNumber: '',
      status: '',
      eventTime: '',
      timeZone: '',
      line: ''
    });
  };

  // 将时间戳格式化为所需格式
  const formatDateTime = (dateTimeStr: string): string => {
    // 输入格式: "Sat Aug 09 2025 06:07:32 GMT-0500 (Central Daylight Time)"
    // 输出格式: "08/09/25 06:07"
    
    if (!dateTimeStr) return '';
    
    try {
      // 解析日期字符串
      const dateMatch = dateTimeStr.match(/(\w+)\s+(\w+)\s+(\d{2})\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (!dateMatch) return '';
      
      const [, dayName, monthName, day, year, hour, minute] = dateMatch;
      
      // 月份映射
      const monthMap: { [key: string]: string } = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      
      const month = monthMap[monthName] || '00';
      const yearShort = year.slice(-2);
      
      return `${month}/${day}/${yearShort} ${hour}:${minute}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const handleConvert = () => {
    const allParsedData: TableRow[] = [];
    const timeZone = getTimeZone(airport);
    
    // 处理每个输入组
    inputGroups.forEach(group => {
      // 跳过没有数据的输入组
      if (!group.inputData.trim() || !group.entryNumber.trim()) {
        return;
      }
      
      const lines = group.inputData.split('\n');
      
      let currentEventTime = '';
      
      // 遍历所有行
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) continue;
        
        // 检查是否是时间戳行（包含 GMT 的行）
        if (line.includes('GMT-') || line.includes('GMT+')) {
          // 提取并格式化时间
          currentEventTime = formatDateTime(line);
          continue;
        }
        
        // 检查是否是 Line# 开头的行
        if (line.startsWith('Line#')) {
          // 提取行号
          const lineMatch = line.match(/Line#\s+(\d+)/);
          if (lineMatch) {
            const lineNumber = lineMatch[1];
            
            // 确定状态
            let status = '';
            if (line.includes('DATA UNDER PGA REVIEW')) {
              status = 'CPSC_check';
            } else if (line.includes('MAY PROCEED')) {
              status = 'CPSC_release';
            }
            
            // 只有当有有效的状态时才添加数据
            if (status) {
              allParsedData.push({
                entryNumber: group.entryNumber,
                status: status,
                eventTime: currentEventTime,
                timeZone: timeZone,
                line: lineNumber
              });
            }
          }
        }
      }
    });

    setTableData(allParsedData);
    setFilteredData(allParsedData);
    setShowTable(true);
  };

  const exportToExcel = () => {
    if (!xlsxLoaded || !window.XLSX) {
      alert('Excel library is still loading. Please try again.');
      return;
    }

    // 创建工作表数据 - 使用筛选后的数据
    const ws_data = [
      ['Entry Number', 'Status', 'Event Time', 'Time Zone', 'Line'],
      ...filteredData.map(row => [
        row.entryNumber,
        row.status,
        row.eventTime,
        row.timeZone,
        row.line
      ])
    ];

    // 创建工作表
    const ws = window.XLSX.utils.aoa_to_sheet(ws_data);
    
    // 创建工作簿
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'MAGAYA Data');
    
    // 生成文件名
    const fileName = mawb ? `${mawb}_MAGAYA T01 PGA.xlsx` : 'MAGAYA T01 PGA.xlsx';
    
    // 导出文件
    window.XLSX.writeFile(wb, fileName);
  };

  const updateFilter = (column: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  return (
    <div className="magaya-container">
      <h1 className="magaya-title">T01 PGA ENTRY-MAGAYA Processing Tool</h1>
      
      <div className="magaya-top-controls">
        <div className="magaya-airport-selector">
          <label>POE</label>
          <select
            value={airport}
            onChange={(e) => setAirport(e.target.value)}
          >
            <option value="ORD">ORD</option>
            <option value="JFK">JFK</option>
            <option value="DFW">DFW</option>
            <option value="MIA">MIA</option>
            <option value="LAX">LAX</option>
            <option value="SFO">SFO</option>
          </select>
        </div>
        
        <div className="magaya-mawb-input">
          <label>MAWB (Optional)</label>
          <input
            type="text"
            value={mawb}
            onChange={(e) => setMawb(e.target.value)}
            placeholder="Enter MAWB"
          />
        </div>
      </div>

      <div className="magaya-input-groups">
        {inputGroups.map((group) => (
          <div key={group.id} className="magaya-input-group-item">
            <div className="magaya-group-header">
              <button 
                className="magaya-toggle-button"
                onClick={() => toggleExpand(group.id)}
              >
                {group.isExpanded ? '−' : '+'} Entry {group.id}
              </button>
              {group.isExpanded && (
                <input
                  type="text"
                  className="magaya-entry-input"
                  value={group.entryNumber}
                  onChange={(e) => updateEntryNumber(group.id, e.target.value)}
                  placeholder="Enter Entry Number"
                />
              )}
            </div>
            {group.isExpanded && (
              <textarea
                className="magaya-textarea-small"
                value={group.inputData}
                onChange={(e) => updateInputData(group.id, e.target.value)}
                placeholder={`Paste data for Entry ${group.id} here...`}
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="magaya-button-group">
        <button 
          className="magaya-convert-button"
          onClick={handleConvert}
        >
          CONVERT
        </button>
        <button 
          className="magaya-reset-button"
          onClick={handleReset}
        >
          RESET
        </button>
      </div>

      {showTable && (
        <div className="magaya-table-container">
          <div className="magaya-table-header">
            <button 
              className="magaya-export-button"
              onClick={exportToExcel}
              disabled={!xlsxLoaded || filteredData.length === 0}
            >
              📥 Export to Excel
            </button>
          </div>
          <table className="magaya-table">
            <thead>
              <tr>
                <th>
                  <div className="magaya-th-content">
                    <span>EntryNumber</span>
                    <input
                      type="text"
                      className="magaya-filter-input"
                      placeholder="Filter..."
                      value={filters.entryNumber}
                      onChange={(e) => updateFilter('entryNumber', e.target.value)}
                    />
                  </div>
                </th>
                <th>
                  <div className="magaya-th-content">
                    <span>Status</span>
                    <input
                      type="text"
                      className="magaya-filter-input"
                      placeholder="Filter..."
                      value={filters.status}
                      onChange={(e) => updateFilter('status', e.target.value)}
                    />
                  </div>
                </th>
                <th>
                  <div className="magaya-th-content">
                    <span>Event Time</span>
                    <input
                      type="text"
                      className="magaya-filter-input"
                      placeholder="Filter..."
                      value={filters.eventTime}
                      onChange={(e) => updateFilter('eventTime', e.target.value)}
                    />
                  </div>
                </th>
                <th>
                  <div className="magaya-th-content">
                    <span>Time Zone</span>
                    <input
                      type="text"
                      className="magaya-filter-input"
                      placeholder="Filter..."
                      value={filters.timeZone}
                      onChange={(e) => updateFilter('timeZone', e.target.value)}
                    />
                  </div>
                </th>
                <th>
                  <div className="magaya-th-content">
                    <span>Line</span>
                    <input
                      type="text"
                      className="magaya-filter-input"
                      placeholder="Filter..."
                      value={filters.line}
                      onChange={(e) => updateFilter('line', e.target.value)}
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <tr key={index}>
                    <td>{row.entryNumber}</td>
                    <td>{row.status}</td>
                    <td>{row.eventTime}</td>
                    <td>{row.timeZone}</td>
                    <td>{row.line}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No data found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MagayaPage;