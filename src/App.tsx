import React, { useState, useRef } from 'react';
import NETCHBPage from './NETCHB'; // 导入新的NETCHB组件

// Define types for Excel operations
declare global {
  interface Window {
    XLSX: any;
  }
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-64 h-screen bg-gradient-to-b from-purple-600 via-white to-blue-600 shadow-lg">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">CONVERSION</h2>
        <div className="space-y-4">
          <button
            onClick={() => setActiveTab('temu')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'temu'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-90'
            }`}
          >
            TEMU PGA MANIFEST
          </button>
          <button
            onClick={() => setActiveTab('netchb')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'netchb'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-90'
            }`}
          >
            T01 PGA ENTRY-NETCHB
          </button>
          <button
            onClick={() => setActiveTab('other')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'other'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-90'
            }`}
          >
            Other
          </button>
        </div>
      </div>
    </div>
  );
};

const OtherPage: React.FC = () => {
  const handleNimbusClick = () => {
    window.open('https://tools.nimbusgroup.us/login?from=%2Ft01%2Fnetchb', '_blank');
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <button
          onClick={handleNimbusClick}
          className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          Nimbus Tool
        </button>
        <p className="mt-4 text-gray-600 max-w-md">
          For non-TEMU PGA, Please click and use Nimbus Tool for conversion.
        </p>
      </div>
    </div>
  );
};

const TemuPGAPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [mawb, setMawb] = useState('');
  const [flightNo, setFlightNo] = useState('');
  const [airport, setAirport] = useState('ORD');
  const [houseBill, setHouseBill] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [xlsxLoaded, setXlsxLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  
  const columnMapping: { [key: string]: string } = {
    'E': 'V',
    'G': 'W',
    'CB': 'S',
    'CA': 'T',
    'BY': 'Q',
    'BX': 'P',
    'BW': 'O',
    'BO': 'AC和AK',
    'CD': 'C',
    'BH': 'G和AM',
    'BL': 'AO和AP',
    'BM': 'H',
    'BP': 'I',
    'BT': 'BF',
    'N': 'AA'
  };

  
  const fixedValues: { [key: string]: string } = {
    'Admiralty': 'X',
    '40': 'M',
    '01': 'B',
    '2568210': 'D',
    '2567704': 'E',
    'Y': 'F',
    'PCS': 'AL',
    '4701': 'AV'
  };

  
  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => {
      setXlsxLoaded(true);
      console.log('XLSX library loaded');
    };
    script.onerror = () => {
      console.error('Failed to load XLSX library');
    };
    document.body.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleFileUpload = (uploadedFile: File) => {
    if (uploadedFile.name.endsWith('.xlsx')) {
      setFile(uploadedFile);
    } else {
      alert('Please upload an Excel file (.xlsx format only)');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  };

  // 将列字母转换为索引（例如：'A' -> 0, 'B' -> 1, 'AA' -> 26）
  const columnToIndex = (col: string): number => {
    let index = 0;
    for (let i = 0; i < col.length; i++) {
      index = index * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0)) + 1;
    }
    return index - 1;
  };

  // 将索引转换为列字母
  const indexToColumn = (index: number): string => {
    let column = '';
    while (index >= 0) {
      column = String.fromCharCode(index % 26 + 'A'.charCodeAt(0)) + column;
      index = Math.floor(index / 26) - 1;
    }
    return column;
  };

  const processExcel = async () => {
    if (!xlsxLoaded || !window.XLSX) {
      alert('Excel library is still loading. Please try again in a moment.');
      return;
    }

    if (!file) {
      alert('Please upload a file first');
      return;
    }

    if (!mawb.match(/^\d{3}-\d{8}$/)) {
      alert('MAWB must be in xxx-xxxxxxxx format');
      return;
    }

    if (!flightNo) {
      alert('Please enter Flight No');
      return;
    }

    setIsLoading(true);

    try {
      // Read uploaded file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = window.XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // 获取上传文件的范围
          const range = window.XLSX.utils.decode_range(worksheet['!ref']);
          
          // 获取mawb sheet的A2单元格内容
          let mawbSheetA2Value = '';
          if (workbook.SheetNames.includes('mawb')) {
            const mawbSheet = workbook.Sheets['mawb'];
            const a2Cell = mawbSheet['A2'];
            if (a2Cell && a2Cell.v !== undefined && a2Cell.v !== null && a2Cell.v !== '') {
              mawbSheetA2Value = a2Cell.v;
            }
          }
          
          // Fetch template
          const templateResponse = await fetch('https://jun2369.github.io/MAWBchangenew/NEWCHB.xlsx');
          if (!templateResponse.ok) {
            throw new Error('Failed to fetch template file');
          }
          const templateBlob = await templateResponse.blob();
          
          const templateReader = new FileReader();
          
          templateReader.onload = (templateEvent) => {
            try {
              const templateData = templateEvent.target?.result;
              const templateWorkbook = window.XLSX.read(templateData, { type: 'binary' });
              const templateSheetName = templateWorkbook.SheetNames[0];
              const templateSheet = templateWorkbook.Sheets[templateSheetName];
              
              // 获取模板的原始范围
              const templateRange = window.XLSX.utils.decode_range(templateSheet['!ref']);
              
              // 创建新的sheet对象
              const newSheet = {};
              
              // 复制模板的第一行（标题行）- 复制到DY列
              const maxTemplateCol = columnToIndex('DY');
              for (let col = 0; col <= maxTemplateCol; col++) {
                const cellAddress = indexToColumn(col) + '1';
                if (templateSheet[cellAddress]) {
                  newSheet[cellAddress] = JSON.parse(JSON.stringify(templateSheet[cellAddress]));
                }
              }
              
              // 添加 Error Message 列标题
              newSheet['DY1'] = { v: 'Error Message', t: 's' };
              
              // 处理上传文件的数据（从第3行开始，跳过第1行和第2行的标题）
              let outputRow = 2; // 输出到模板的第2行开始
              
              for (let sourceRow = 2; sourceRow <= range.e.r; sourceRow++) {
                // 检查源文件该行是否有数据（检查几个关键列是否有值）
                let hasData = false;
                
                // 检查源文件的一些关键列是否有数据
                for (let col = 0; col <= 10; col++) {
                  const cellAddress = indexToColumn(col) + (sourceRow + 1);
                  if (worksheet[cellAddress] && worksheet[cellAddress].v !== undefined && worksheet[cellAddress].v !== null && worksheet[cellAddress].v !== '') {
                    hasData = true;
                    break;
                  }
                }
                
                // 如果该行没有数据，跳过
                if (!hasData) {
                  continue;
                }
                
                // 从mawb sheet的A2单元格获取内容，填充到导出文件的AB列
                if (mawbSheetA2Value) {
                  newSheet[`AB${outputRow}`] = { v: mawbSheetA2Value, t: 's' };
                }
                
                // MAWB 处理 - 分割为前3位和后8位
                const mawbFirst3 = mawb.substring(0, 3);  // 前3位 -> AH列
                const mawbLast8 = mawb.substring(4);      // 跳过横杠，取后8位 -> AI列
                newSheet[`AH${outputRow}`] = { v: mawbFirst3, t: 's' };
                newSheet[`AI${outputRow}`] = { v: mawbLast8, t: 's' };
                
                // Flight No 处理 - 分割为前2位和后面的
                const flightNoFirst2 = flightNo.substring(0, 2);  // 前2位 -> AS列
                const flightNoRest = flightNo.substring(2);       // 后面的 -> AT列
                newSheet[`AS${outputRow}`] = { v: flightNoFirst2, t: 's' };
                newSheet[`AT${outputRow}`] = { v: flightNoRest, t: 's' };
                
                // House Bill -> AJ列
                if (houseBill) {
                  newSheet[`AJ${outputRow}`] = { v: houseBill, t: 's' };
                }
                
                // EntryDate -> K列, L列, AQ列, AN列
                if (entryDate) {
                  newSheet[`K${outputRow}`] = { v: entryDate, t: 's' };
                  newSheet[`L${outputRow}`] = { v: entryDate, t: 's' };
                  newSheet[`AQ${outputRow}`] = { v: entryDate, t: 's' };
                  newSheet[`AN${outputRow}`] = { v: entryDate, t: 's' };
                }
                
                // dropdown list 选择的机场
                if (airport === 'ORD' || airport === 'JFK') {
                  // HBT1填充 导出文件 AR 列
                  newSheet[`AR${outputRow}`] = { v: 'HBT1', t: 's' };
                  // IL 填充 导出文件 AX 列
                  newSheet[`AX${outputRow}`] = { v: 'IL', t: 's' };
                  // 3901 填充 导出文件 AU, AW, J 列
                  newSheet[`AU${outputRow}`] = { v: '3901', t: 's' };
                  newSheet[`AW${outputRow}`] = { v: '3901', t: 's' };
                  newSheet[`J${outputRow}`] = { v: '3901', t: 's' };
                } else if (airport === 'MIA') {
                  // LEG0 填充 导出文件 AR列
                  newSheet[`AR${outputRow}`] = { v: 'LEG0', t: 's' };
                  // 5206 填充 导出文件的 AU, AW, J列
                  newSheet[`AU${outputRow}`] = { v: '5206', t: 's' };
                  newSheet[`AW${outputRow}`] = { v: '5206', t: 's' };
                  newSheet[`J${outputRow}`] = { v: '5206', t: 's' };
                  // FL 填充 AX列
                  newSheet[`AX${outputRow}`] = { v: 'FL', t: 's' };
                } else if (airport === 'LAX') {
                  // WBH9 填充到 AR列
                  newSheet[`AR${outputRow}`] = { v: 'WBH9', t: 's' };
                  // 2720 填充到 J列, AU列, AW列
                  newSheet[`J${outputRow}`] = { v: '2720', t: 's' };
                  newSheet[`AU${outputRow}`] = { v: '2720', t: 's' };
                  newSheet[`AW${outputRow}`] = { v: '2720', t: 's' };
                  // CA 填充到 AX列
                  newSheet[`AX${outputRow}`] = { v: 'CA', t: 's' };
                } else if (airport === 'SFO') {
                  // W0B3 填充到 AR列
                  newSheet[`AR${outputRow}`] = { v: 'W0B3', t: 's' };
                  // 2801 填充到 J列, AU列, AW列
                  newSheet[`J${outputRow}`] = { v: '2801', t: 's' };
                  newSheet[`AU${outputRow}`] = { v: '2801', t: 's' };
                  newSheet[`AW${outputRow}`] = { v: '2801', t: 's' };
                  // CA 填充到 AX列
                  newSheet[`AX${outputRow}`] = { v: 'CA', t: 's' };
                }
                
                // 处理列映射
                Object.entries(columnMapping).forEach(([sourceCol, targetCol]) => {
                  const sourceColLetter = sourceCol.trim();
                  const sourceCellAddress = `${sourceColLetter}${sourceRow + 1}`;
                  const sourceCell = worksheet[sourceCellAddress];
                  
                  if (sourceCell && sourceCell.v !== undefined && sourceCell.v !== null && sourceCell.v !== '') {
                    // 处理目标列（可能是多列）
                    const targetCols = targetCol.split('和');
                    
                    targetCols.forEach(col => {
                      const targetCellAddress = `${col.trim()}${outputRow}`;
                      newSheet[targetCellAddress] = { 
                        v: sourceCell.v, 
                        t: sourceCell.t || 's' 
                      };
                    });
                  }
                });
                
                // 处理固定值填充 - 确保每一行都填充
                Object.entries(fixedValues).forEach(([value, targetCol]) => {
                  const targetColLetter = targetCol.trim();
                  const targetCellAddress = `${targetColLetter}${outputRow}`;
                  newSheet[targetCellAddress] = { v: value, t: 's' };
                });
                
                // 收集所有错误信息
                const errorMessages = [];
                
                // 检查P列的值（manufacture_address）
                const pCellAddress = `P${outputRow}`;
                if (newSheet[pCellAddress] && newSheet[pCellAddress].v) {
                  const pValue = String(newSheet[pCellAddress].v);
                  const pLength = pValue.length;
                  
                  // 如果长度小于3或大于255，添加错误信息
                  if (pLength < 3 || pLength > 255) {
                    errorMessages.push('manufacture_address is required, must be between 3 and 255 characters, and cannot contain Chinese characters');
                  }
                }
                
                // 检查O列的值（manufacture_name）
                const oCellAddress = `O${outputRow}`;
                if (newSheet[oCellAddress] && newSheet[oCellAddress].v) {
                  const oValue = String(newSheet[oCellAddress].v);
                  const oLength = oValue.length;
                  
                  // 如果长度小于3或大于100，添加错误信息
                  if (oLength < 3 || oLength > 100) {
                    errorMessages.push('manufacture_name is required, must be between 3 and 100 characters, and cannot contain Chinese characters');
                  }
                }
                
                // 检查T列的值（manufacture_zip_code）
                const tCellAddress = `T${outputRow}`;
                if (newSheet[tCellAddress] && newSheet[tCellAddress].v) {
                  const tValue = String(newSheet[tCellAddress].v);
                  
                  // 检查是否全是0或长度不等于6
                  if (tValue === '000000' || tValue.length !== 6) {
                    errorMessages.push('manufacture_zip_code must be 6 digits');
                  }
                } else {
                  // 如果T列没有值，也添加错误信息
                  errorMessages.push('manufacture_zip_code must be 6 digits');
                }
                
                // 将所有错误信息合并到DY列
                if (errorMessages.length > 0) {
                  newSheet[`DY${outputRow}`] = { 
                    v: errorMessages.join('; '), 
                    t: 's' 
                  };
                }
                
                outputRow++;
              }
              
              // 设置sheet的范围（到DY列）
              const lastRow = outputRow - 1;
              const lastCol = columnToIndex('DY');
              newSheet['!ref'] = `A1:${indexToColumn(lastCol)}${lastRow}`;
              
              // 设置列宽（可选，帮助减小文件大小）
              newSheet['!cols'] = [];
              for (let i = 0; i <= lastCol; i++) {
                newSheet['!cols'][i] = { wch: 15 };
              }
              
              // 创建新的workbook
              const newWorkbook = window.XLSX.utils.book_new();
              window.XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Processed Data');
              
              // Generate Excel file with compression
              const wbout = window.XLSX.write(newWorkbook, { 
                bookType: 'xlsx', 
                type: 'binary',
                compression: true
              });
              
              // Convert to blob
              const buf = new ArrayBuffer(wbout.length);
              const view = new Uint8Array(buf);
              for (let i = 0; i < wbout.length; i++) {
                view[i] = wbout.charCodeAt(i) & 0xFF;
              }
              
              // Create download link
              const blob = new Blob([buf], { type: 'application/octet-stream' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              // 使用MAWB作为文件名
              link.download = `${mawb}_TEMU_NETCHB.xlsx`;
              link.click();
              
              URL.revokeObjectURL(url);
              
              // 移除成功提示，直接设置加载状态为false
              setIsLoading(false);
            } catch (innerError) {
              console.error('Error in template processing:', innerError);
              alert('Error processing template file. Please check the console for details.');
              setIsLoading(false);
            }
          };
          
          templateReader.onerror = () => {
            console.error('Error reading template file');
            alert('Error reading template file');
            setIsLoading(false);
          };
          
          templateReader.readAsBinaryString(templateBlob);
          
        } catch (error) {
          console.error('Error processing file:', error);
          alert('Error processing file. Please check the console for details.');
          setIsLoading(false);
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading uploaded file');
        alert('Error reading uploaded file');
        setIsLoading(false);
      };
      
      reader.readAsBinaryString(file);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing file. Please check the console for details.');
      setIsLoading(false);
    }
  };

  // Reset function
  const handleReset = () => {
    setFile(null);
    setMawb('');
    setFlightNo('');
    setAirport('ORD');
    setHouseBill('');
    setEntryDate('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">TEMU PGA Processing Tool</h1>
      
      {!xlsxLoaded && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          Loading Excel processing library...
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Excel File</h2>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
            
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            
            <p className="text-gray-600 mb-2 text-lg">
              Drag and drop your Excel file here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:underline font-medium"
              >
                browse
              </button>
            </p>
            <p className="text-sm text-gray-500">Only .xlsx format is accepted</p>
            
            {file && (
              <div className="mt-4 p-3 bg-green-100 rounded text-green-700 font-medium">
                Selected: {file.name}
              </div>
            )}
          </div>
        </div>
        
        {/* Input Fields Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Shipment Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MAWB
              </label>
              <input
                type="text"
                value={mawb}
                onChange={(e) => setMawb(e.target.value)}
                placeholder="xxx-xxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Must be in xxx-xxxxxxxx format</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flight No
              </label>
              <input
                type="text"
                value={flightNo}
                onChange={(e) => setFlightNo(e.target.value)}
                placeholder="e.g., CA8900"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Format should be correct, e.g., CA8900</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                POE
              </label>
              <select
                value={airport}
                onChange={(e) => setAirport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ORD">ORD</option>
                <option value="JFK">JFK</option>
                <option value="MIA">MIA</option>
                <option value="LAX">LAX</option>
                <option value="SFO">SFO</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                House Bill
              </label>
              <input
                type="text"
                value={houseBill}
                onChange={(e) => setHouseBill(e.target.value)}
                placeholder="Enter House Bill"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
                <span className="ml-2 relative inline-block group">
                  <span className="text-yellow-500 cursor-help text-base">⚠</span>
                  <span className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    The input will be reflected in the Date of Import, as well as in the Entry, Arrival, and Export fields, per Joanna's suggestion
                  </span>
                </span>
              </label>
              <input
                type="text"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                placeholder="Enter Entry Date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={processExcel}
              disabled={isLoading || !xlsxLoaded}
              className={`w-full mt-6 px-4 py-2 font-semibold rounded-lg transition-colors ${
                isLoading || !xlsxLoaded
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isLoading ? 'Processing...' : 'Process Excel File'}
            </button>
            
            <button
              onClick={handleReset}
              className="w-full mt-3 px-4 py-2 font-semibold rounded-lg transition-colors bg-gray-500 text-white hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('temu');

  return (
    <div className="flex h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 bg-gradient-to-br from-blue-100 via-white to-orange-100 overflow-auto">
        {activeTab === 'temu' && <TemuPGAPage />}
        {activeTab === 'netchb' && <NETCHBPage />}
        {activeTab === 'other' && <OtherPage />}
      </main>
    </div>
  );
};

export default App;