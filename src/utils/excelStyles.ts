import * as XLSX from 'xlsx';

// Simple styling that works with standard xlsx library
export const applyUniversalExcelStyles = (ws: XLSX.WorkSheet, dataStartRow: number, totalCols: number, hasAnalytics: boolean = true) => {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  
  // Apply number formatting to numeric cells
  for (let row = 0; row <= range.e.r; row++) {
    for (let col = 0; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[cellRef]) continue;
      
      // Apply number formatting
      if (ws[cellRef].t === 'n') {
        const value = ws[cellRef].v;
        
        // Percentage format (values between 0 and 1)
        if (value >= 0 && value <= 1 && value !== Math.floor(value)) {
          ws[cellRef].z = '0.0%';
        }
        // Currency format for large amounts
        else if (value >= 1000) {
          ws[cellRef].z = '₹#,##0';
        }
        // Decimal format for hours
        else if (value > 0 && value < 24 && value !== Math.floor(value)) {
          ws[cellRef].z = '0.00';
        }
        // Regular numbers
        else if (value >= 100) {
          ws[cellRef].z = '#,##0';
        }
      }
    }
  }
  
  return ws;
};

export const createStyledWorkbook = (
  title: string,
  headers: string[],
  data: any[][],
  analyticsData?: { label: string; value: any }[]
) => {
  const wb = XLSX.utils.book_new();
  
  // Create professional worksheet structure
  const wsData = [
    [title], // Title row
    [`Generated on: ${new Date().toLocaleDateString('en-GB')}`], // Date row
    [], // Empty row
    headers, // Header row
    ...data // Data rows
  ];

  // Add analytics section if provided
  if (analyticsData) {
    wsData.push([]); // Empty row
    wsData.push(['═══ ANALYTICS SUMMARY ═══']); // Analytics header with visual separator
    analyticsData.forEach(item => {
      wsData.push([item.label, item.value]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set professional column widths
  ws['!cols'] = headers.map((header, index) => {
    let width = Math.max(header.length + 2, 15); // Minimum professional width
    
    // Calculate optimal width based on content
    data.forEach(row => {
      if (row[index] !== undefined) {
        const cellLength = String(row[index]).length;
        width = Math.max(width, Math.min(cellLength + 3, 30)); // Max width 30
      }
    });
    
    // Special width adjustments for common column types
    const headerLower = header.toLowerCase();
    if (headerLower.includes('name')) width = Math.max(width, 20);
    if (headerLower.includes('phone')) width = 15;
    if (headerLower.includes('date')) width = 12;
    if (headerLower.includes('amount') || headerLower.includes('salary')) width = 15;
    
    return { width };
  });
  
  // Create professional merged cells
  ws['!merges'] = [
    // Merge title across all columns
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    // Merge date row across all columns
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }
  ];
  
  // Add analytics section merge if exists
  if (analyticsData) {
    const analyticsHeaderRow = 4 + data.length + 1;
    ws['!merges'].push(
      { s: { r: analyticsHeaderRow, c: 0 }, e: { r: analyticsHeaderRow, c: headers.length - 1 } }
    );
  }
  
  // Freeze panes for better navigation
  ws['!freeze'] = { xSplit: 0, ySplit: 4 };
  
  // Add auto-filter to data section
  const filterRange = `A4:${XLSX.utils.encode_col(headers.length - 1)}${4 + data.length}`;
  ws['!autofilter'] = { ref: filterRange };
  
  // Apply number formatting
  applyUniversalExcelStyles(ws, 4, headers.length, !!analyticsData);
  
  return { wb, ws };
};

// Enhanced workbook creation with better structure
export const createProfessionalWorkbook = (
  title: string,
  headers: string[],
  data: any[][],
  analyticsData?: { label: string; value: any }[]
) => {
  const wb = XLSX.utils.book_new();
  
  // Create structured data with clear sections
  const wsData: any[][] = [];
  
  // Title section with visual emphasis
  wsData.push([`📊 ${title.toUpperCase()}`]);
  wsData.push([`📅 Generated: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`]);
  wsData.push([]);
  
  // Data section header
  wsData.push(['📋 DATA SECTION']);
  wsData.push(headers);
  
  // Add all data rows
  data.forEach(row => wsData.push(row));
  
  // Analytics section if provided
  if (analyticsData && analyticsData.length > 0) {
    wsData.push([]);
    wsData.push(['📈 ANALYTICS & INSIGHTS']);
    wsData.push(['Metric', 'Value']);
    
    analyticsData.forEach(item => {
      wsData.push([item.label, item.value]);
    });
  }
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Professional column sizing
  const colWidths = headers.map((header, index) => {
    let maxWidth = header.length + 2;
    
    // Check data content for optimal width
    data.forEach(row => {
      if (row[index] !== undefined) {
        const cellLength = String(row[index]).length;
        maxWidth = Math.max(maxWidth, cellLength + 1);
      }
    });
    
    return { width: Math.min(Math.max(maxWidth, 12), 35) };
  });
  
  ws['!cols'] = colWidths;
  
  // Professional merging
  const merges = [
    // Title row merge
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    // Date row merge
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
    // Data section header merge
    { s: { r: 3, c: 0 }, e: { r: 3, c: headers.length - 1 } }
  ];
  
  // Analytics section merge if exists
  if (analyticsData && analyticsData.length > 0) {
    const analyticsHeaderRow = 5 + data.length + 1;
    merges.push(
      { s: { r: analyticsHeaderRow, c: 0 }, e: { r: analyticsHeaderRow, c: headers.length - 1 } }
    );
  }
  
  ws['!merges'] = merges;
  
  // Freeze panes at data headers
  ws['!freeze'] = { xSplit: 0, ySplit: 5 };
  
  // Auto-filter on data section
  const dataStartRow = 5;
  const dataEndRow = dataStartRow + data.length;
  ws['!autofilter'] = { 
    ref: `A${dataStartRow}:${XLSX.utils.encode_col(headers.length - 1)}${dataEndRow}` 
  };
  
  // Apply formatting
  applyUniversalExcelStyles(ws, dataStartRow, headers.length, !!analyticsData);
  
  return { wb, ws };
};