import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';

const data = [
  { month: 'Jan', electronics: 65, batteries: 45 },
  { month: 'Feb', electronics: 59, batteries: 49 },
  { month: 'Mar', electronics: 80, batteries: 40 },
  { month: 'Apr', electronics: 81, batteries: 55 },
  { month: 'May', electronics: 56, batteries: 39 },
  { month: 'Jun', electronics: 55, batteries: 48 },
];

export default function Reports() {
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Recycling Report', 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Add statistics
    doc.setFontSize(14);
    doc.text('Monthly Statistics:', 20, 50);
    
    let y = 60;
    data.forEach(item => {
      doc.setFontSize(12);
      doc.text(`${item.month}: Electronics - ${item.electronics}, Batteries - ${item.batteries}`, 30, y);
      y += 10;
    });
    
    // Add summary
    const totalElectronics = data.reduce((sum, item) => sum + item.electronics, 0);
    const totalBatteries = data.reduce((sum, item) => sum + item.batteries, 0);
    
    y += 10;
    doc.setFontSize(14);
    doc.text('Summary:', 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Total Electronics Recycled: ${totalElectronics}`, 30, y);
    y += 10;
    doc.text(`Total Batteries Recycled: ${totalBatteries}`, 30, y);
    
    // Save the PDF
    doc.save('recycling-report.pdf');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Recycling Reports</h2>
        <button
          onClick={downloadPDF}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Download PDF Report
        </button>
      </div>
      </div>
  );
}