import React, { useState, useEffect } from 'react';
import './NETCHB.css';

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

const NETCHBPage: React.FC = () => {
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

  const formatEventTime = (time: string): string => {
    // 格式化时间，如果月份是单数字，添加前导0
    // 输入格式: "7/06/25 18:18" 或 "11/06/25 18:18"
    if (!time) return time;
    
    const parts = time.split('/');
    if (parts.length >= 3) {
      const month = parts[0];
      // 如果月份是单数字，添加前导0
      if (month.length === 1) {
        return `0${time}`;
      }
    }
    return time;
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
      
      const lines = group.inputData.split('\n').filter(line => line.trim());
      
      // 存储CPS和FDA的时间和状态
      let cpsEventTime = '';
      let fdaEventTime = '';
      let cpsStatus = '';
      let fdaStatus = '';
      
      lines.forEach(line => {
        // 提取CPS主标题行的时间和状态
        if (line.includes('] CPS, CPS:')) {
          const timeMatch = line.match(/\[([^\]]+)\]/);
          if (timeMatch) {
            cpsEventTime = formatEventTime(timeMatch[1]);
          }
          // 检查是否包含 DATA UNDER PGA REVIEW
          if (line.includes('DATA UNDER PGA REVIEW')) {
            cpsStatus = 'CPSC_check';
          }
        }
        
        // 提取FDA主标题行的时间和状态
        if (line.includes('] FDA,')) {
          const timeMatch = line.match(/\[([^\]]+)\]/);
          if (timeMatch) {
            fdaEventTime = formatEventTime(timeMatch[1]);
          }
          // 检查是否包含 UNDER PGA REVIEW
          if (line.includes('UNDER PGA REVIEW')) {
            fdaStatus = 'FDA_check';
          }
        }
        
        // 处理包含[CPS]的行
        if (line.includes('[CPS]')) {
          const summaryLineMatch = line.match(/Summary Line (\d+)/);
          if (summaryLineMatch) {
            const lineNumber = summaryLineMatch[1];
            allParsedData.push({
              entryNumber: group.entryNumber,
              status: cpsStatus,
              eventTime: cpsEventTime,
              timeZone: timeZone,
              line: lineNumber
            });
          }
        }
        
        // 处理包含[FDA]的行
        if (line.includes('[FDA]')) {
          const fdaLineMatch = line.match(/Line (\d+),/);
          if (fdaLineMatch) {
            const lineNumber = fdaLineMatch[1];
            allParsedData.push({
              entryNumber: group.entryNumber,
              status: fdaStatus,
              eventTime: fdaEventTime,
              timeZone: timeZone,
              line: lineNumber
            });
          }
        }
      });
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
      ['EntryNumber', 'Status', 'Event Time', 'Time Zone', 'Line'],
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
    window.XLSX.utils.book_append_sheet(wb, ws, 'NETCHB Data');
    
    // 生成文件名
    const fileName = mawb ? `${mawb}_NETCHB T01 PGA.xlsx` : 'NETCHB T01 PGA.xlsx';
    
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
    <div className="netchb-container">
      <h1 className="netchb-title">NETCHB Processing Tool</h1>
      
      <div className="netchb-top-controls">
        <div className="netchb-airport-selector">
          <label>Airport</label>
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
        
        <div className="netchb-mawb-input">
          <label>MAWB (Optional)</label>
          <input
            type="text"
            value={mawb}
            onChange={(e) => setMawb(e.target.value)}
            placeholder="Enter MAWB"
          />
        </div>
      </div>

      <div className="netchb-input-groups">
        {inputGroups.map((group) => (
          <div key={group.id} className="netchb-input-group-item">
            <div className="netchb-group-header">
              <button 
                className="netchb-toggle-button"
                onClick={() => toggleExpand(group.id)}
              >
                {group.isExpanded ? '−' : '+'} Entry {group.id}
              </button>
              {group.isExpanded && (
                <input
                  type="text"
                  className="netchb-entry-input"
                  value={group.entryNumber}
                  onChange={(e) => updateEntryNumber(group.id, e.target.value)}
                  placeholder="Enter Entry Number"
                />
              )}
            </div>
            {group.isExpanded && (
              <textarea
                className="netchb-textarea-small"
                value={group.inputData}
                onChange={(e) => updateInputData(group.id, e.target.value)}
                placeholder={`Paste data for Entry ${group.id} here...`}
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="netchb-button-group">
        <button 
          className="netchb-convert-button"
          onClick={handleConvert}
        >
          转换
        </button>
        <button 
          className="netchb-reset-button"
          onClick={handleReset}
        >
          RESET
        </button>
      </div>

      {showTable && (
        <div className="netchb-table-container">
          <div className="netchb-table-header">
            <button 
              className="netchb-export-button"
              onClick={exportToExcel}
              disabled={!xlsxLoaded || filteredData.length === 0}
            >
              📥 Export to Excel
            </button>
          </div>
          <table className="netchb-table">
            <thead>
              <tr>
                <th>
                  <div className="netchb-th-content">
                    <span>EntryNumber</span>
                    <input
                      type="text"
                      className="netchb-filter-input"
                      placeholder="Filter..."
                      value={filters.entryNumber}
                      onChange={(e) => updateFilter('entryNumber', e.target.value)}
                    />
                  </div>
                </th>
                <th>
                  <div className="netchb-th-content">
                    <span>Status</span>
                    <input
                      type="text"
                      className="netchb-filter-input"
                      placeholder="Filter..."
                      value={filters.status}
                      onChange={(e) => updateFilter('status', e.target.value)}
                    />
                  </div>
                </th>
                <th>
                  <div className="netchb-th-content">
                    <span>Event Time</span>
                    <input
                      type="text"
                      className="netchb-filter-input"
                      placeholder="Filter..."
                      value={filters.eventTime}
                      onChange={(e) => updateFilter('eventTime', e.target.value)}
                    />
                  </div>
                </th>
                <th>
                  <div className="netchb-th-content">
                    <span>Time Zone</span>
                    <input
                      type="text"
                      className="netchb-filter-input"
                      placeholder="Filter..."
                      value={filters.timeZone}
                      onChange={(e) => updateFilter('timeZone', e.target.value)}
                    />
                  </div>
                </th>
                <th>
                  <div className="netchb-th-content">
                    <span>Line</span>
                    <input
                      type="text"
                      className="netchb-filter-input"
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
                  <td colSpan={5} className="netchb-no-data">
                    No data found
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

export default NETCHBPage;