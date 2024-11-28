import { jsPDF } from 'jspdf';
import type { User } from 'firebase/auth';

interface ReportData {
  stats: {
    totalItems: number;
    completedItems: number;
    pendingItems: number;
    totalWeight: number;
    carbonSaved: number;
    treesEquivalent: number;
  };
  monthlyData: any[];
  purityData: any[];
  resourceData: any[];
}

export const generatePDF = (data: ReportData, currentUser: User) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;
  const lineHeight = 7;

  const isAdmin = currentUser.email === 'admin@ecotrack.com';
  
  // Helper functions
  const addCenteredText = (text: string, y: number, size = 16, style = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
    return y + lineHeight;
  };

  const addSectionTitle = (text: string, y: number) => {
    doc.setFillColor(34, 197, 94);
    doc.rect(20, y - 5, pageWidth - 40, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(text, 25, y);
    doc.setTextColor(0, 0, 0);
    return y + lineHeight;
  };

  const createTable = (headers: string[], tableData: string[][], y: number) => {
    const cellPadding = 3;
    const cellWidth = (pageWidth - 40) / headers.length;
    const cellHeight = 8;

    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 5, pageWidth - 40, cellHeight, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, i) => {
      doc.text(header, 20 + (cellWidth * i) + cellPadding, y);
    });

    doc.setFont('helvetica', 'normal');
    tableData.forEach((row, rowIndex) => {
      const rowY = y + ((rowIndex + 1) * cellHeight);
      if (rowY > doc.internal.pageSize.height - 20) {
        doc.addPage();
        y = 20;
        return createTable(headers, tableData.slice(rowIndex), y);
      }
      row.forEach((cell, cellIndex) => {
        doc.text(cell, 20 + (cellWidth * cellIndex) + cellPadding, rowY);
      });
    });

    return y + ((tableData.length + 1) * cellHeight) + 5;
  };

  // Title
  yPos = addCenteredText(`EcoTrack ${isAdmin ? 'Complete' : 'User'} Recycling Report`, yPos, 24, 'bold');
  yPos += 5;

  // Report Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPos);
  doc.text(`User: ${currentUser.email}`, pageWidth - 20 - doc.getStringUnitWidth(`User: ${currentUser.email}`) * 10 / doc.internal.scaleFactor, yPos);
  yPos += 15;

  // Summary Section
  yPos = addSectionTitle('Summary Statistics', yPos);
  yPos += 10;

  const summaryData = [
    ['Total Items Recycled', `${data.stats.totalItems || 0}`],
    ['Completed Items', `${data.stats.completedItems || 0}`],
    ['Pending Items', `${data.stats.pendingItems || 0}`],
    ['Total Weight Processed', `${Number(data.stats.totalWeight || 0).toFixed(2)} kg`],
    ['Carbon Saved', `${Number(data.stats.carbonSaved || 0).toFixed(2)} kg CO₂`],
    ['Trees Equivalent', `${Number(data.stats.treesEquivalent || 0).toFixed(1)} trees`],
  ];

  summaryData.forEach(([label, value]) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 120, yPos);
    yPos += 7;
  });
  yPos += 10;

  // Monthly Statistics
  yPos = addSectionTitle('Monthly Recycling Statistics', yPos);
  yPos += 10;

  const monthlyHeaders = ['Month', 'Electronics', 'Batteries', 'Others'];
  const monthlyTableData = data.monthlyData.map(item => [
    item.month,
    item.electronics.toString(),
    item.batteries.toString(),
    item.others.toString(),
  ]);

  yPos = createTable(monthlyHeaders, monthlyTableData, yPos);
  yPos += 15;

  // Material Purity Rates
  if (data.purityData.length > 0) {
    yPos = addSectionTitle('Material Purity Rates', yPos);
    yPos += 10;

    const purityHeaders = ['Material', 'Purity Rate (%)'];
    const purityTableData = data.purityData.map(item => [
      item.material,
      item.purity.toFixed(1),
    ]);

    yPos = createTable(purityHeaders, purityTableData, yPos);
    yPos += 15;
  }

  // Resource Usage
  if (data.resourceData.length > 0) {
    if (yPos > doc.internal.pageSize.height - 60) {
      doc.addPage();
      yPos = 20;
    }

    yPos = addSectionTitle('Resource Usage', yPos);
    yPos += 10;

    const resourceHeaders = ['Month', 'Electricity (kWh)', 'Water (L)', 'Labor (hrs)'];
    const resourceTableData = data.resourceData.map(item => [
      item.month,
      item.electricity.toString(),
      item.water.toString(),
      item.labor.toString(),
    ]);

    yPos = createTable(resourceHeaders, resourceTableData, yPos);
  }

  // Footer
  const pageCount = doc.internal.pages.length;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      'Generated by EcoTrack',
      20,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      new Date().toLocaleDateString(),
      pageWidth - 20,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }
  
  // Save the PDF
  doc.save(`ecotrack-recycling-report-${isAdmin ? 'complete' : 'user'}.pdf`);
};