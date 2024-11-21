import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface RecycleData {
  materialType: string;
  quantity: number;
  purityRate: number;
  electricity: number;
  water: number;
  labor: number;
  timestamp: Date;
}

interface MonthlyData {
  month: string;
  electronics: number;
  batteries: number;
  others: number;
}

interface PurityData {
  material: string;
  purity: number;
}

interface ResourceData {
  month: string;
  electricity: number;
  water: number;
  labor: number;
}

interface Stats {
  totalItems: number;
  completedItems: number;
  pendingItems: number;
}

interface WasteItem {
  createdAt: Date;
  status: string;
  itemType: string;
  // ... other properties if needed
}

export default function Reports() {
  const { currentUser } = useAuth();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; }[]>([]);
  const [purityData, setPurityData] = useState<PurityData[]>([]);
  const [resourceData, setResourceData] = useState<ResourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');
  const [stats, setStats] = useState<Stats>({
    totalItems: 0,
    completedItems: 0,
    pendingItems: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        // Fetch e-waste data
        const wasteQuery = query(
          collection(db, 'e-waste'),
          where('userId', '==', currentUser.uid)
        );
        const wasteSnapshot = await getDocs(wasteQuery);
        const wasteItems = wasteSnapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          status: doc.data().status,
          itemType: doc.data().itemType
        }));

        // Calculate stats
        setStats({
          totalItems: wasteItems.length,
          completedItems: wasteItems.filter(item => item.status === 'Completed').length,
          pendingItems: wasteItems.filter(item => item.status === 'Pending').length
        });

        // Process monthly data
        const months = dateRange === '6months' ? 6 : 12;
        const monthlyStats = new Array(months).fill(null).map((_, index) => {
          const date = new Date();
          date.setMonth(date.getMonth() - index);
          return {
            month: date.toLocaleString('default', { month: 'short' }),
            electronics: 0,
            batteries: 0,
            others: 0
          };
        }).reverse();

        wasteItems.forEach(item => {
          if (!item.createdAt) return;
          const itemMonth = item.createdAt.toLocaleString('default', { month: 'short' });
          const monthData = monthlyStats.find(m => m.month === itemMonth);
          if (monthData) {
            if (item.itemType.toLowerCase().includes('computer') || item.itemType.toLowerCase().includes('phone')) {
              monthData.electronics++;
            } else if (item.itemType.toLowerCase().includes('battery')) {
              monthData.batteries++;
            } else {
              monthData.others++;
            }
          }
        });
        setMonthlyData(monthlyStats);

        // Fetch recycling data
        const recycleQuery = query(collection(db, 'recycleData'));
        const recycleSnapshot = await getDocs(recycleQuery);
        const recycleItems = recycleSnapshot.docs.map(doc => ({
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        })) as RecycleData[];


        // Process category data
        const categoryStats = processCategoryData(wasteItems);
        setCategoryData(categoryStats);

        // Process purity data
        const purityRates: { [key: string]: number[] } = {};
        recycleItems.forEach(item => {
          if (!purityRates[item.materialType]) {
            purityRates[item.materialType] = [];
          }
          purityRates[item.materialType].push(item.purityRate);
        });

        const processedPurityData = Object.entries(purityRates).map(([material, rates]) => ({
          material,
          purity: rates.reduce((sum, rate) => sum + rate, 0) / rates.length
        }));
        setPurityData(processedPurityData);

        // Process resource data
        const monthlyResources: { [key: string]: { electricity: number; water: number; labor: number; } } = {};
        recycleItems.forEach(item => {
          const month = item.timestamp.toLocaleString('default', { month: 'short' });
          if (!monthlyResources[month]) {
            monthlyResources[month] = { electricity: 0, water: 0, labor: 0 };
          }
          monthlyResources[month].electricity += item.electricity;
          monthlyResources[month].water += item.water;
          monthlyResources[month].labor += item.labor;
        });

        const processedResourceData = Object.entries(monthlyResources).map(([month, resources]) => ({
          month,
          ...resources
        }));
        setResourceData(processedResourceData);

      } catch (error) {
        console.error('Error fetching report data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [currentUser, dateRange]);

  const processCategoryData = (items) => {
    const categories: { [key: string]: number } = {};
    items.forEach(item => {
      categories[item.itemType] = (categories[item.itemType] || 0) + 1;
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value
    }));
  };

  const processPurityData = (items: RecycleData[]) => {
    const purityRates: { [key: string]: number[] } = {};
    items.forEach(item => {
      if (!purityRates[item.materialType]) {
        purityRates[item.materialType] = [];
      }
      purityRates[item.materialType].push(item.purityRate);
    });

    return Object.entries(purityRates).map(([material, rates]) => ({
      material,
      purity: rates.reduce((sum, rate) => sum + rate, 0) / rates.length
    }));
  };

  const processResourceData = (items: RecycleData[]) => {
    const monthlyResources: { [key: string]: { electricity: number; water: number; labor: number; } } = {};

    items.forEach(item => {
      const month = item.timestamp.toLocaleString('default', { month: 'short' });
      if (!monthlyResources[month]) {
        monthlyResources[month] = { electricity: 0, water: 0, labor: 0 };
      }
      monthlyResources[month].electricity += item.electricity;
      monthlyResources[month].water += item.water;
      monthlyResources[month].labor += item.labor;
    });

    return Object.entries(monthlyResources).map(([month, resources]) => ({
      month,
      ...resources
    }));
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;
    const lineHeight = 7;
    
    // Helper function to add centered text
    const addCenteredText = (text: string, y: number, size = 16, style = 'normal') => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, y);
      return y + lineHeight;
    };

    // Helper function to add section title
    const addSectionTitle = (text: string, y: number) => {
      doc.setFillColor(34, 197, 94); // Green color
      doc.rect(20, y - 5, pageWidth - 40, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(text, 25, y);
      doc.setTextColor(0, 0, 0);
      return y + lineHeight;
    };

    // Helper function to add table
    const createTable = (headers: string[], data: string[][], y: number) => {
      const cellPadding = 3;
      const cellWidth = (pageWidth - 40) / headers.length;
      const cellHeight = 8;

      // Table headers
      doc.setFillColor(240, 240, 240);
      doc.rect(20, y - 5, pageWidth - 40, cellHeight, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      headers.forEach((header, i) => {
        doc.text(header, 20 + (cellWidth * i) + cellPadding, y);
      });

      // Table rows
      doc.setFont('helvetica', 'normal');
      data.forEach((row, rowIndex) => {
        const rowY = y + ((rowIndex + 1) * cellHeight);
        if (rowY > doc.internal.pageSize.height - 20) {
          doc.addPage();
          y = 20;
          return createTable(headers, data.slice(rowIndex), y);
        }
        row.forEach((cell, cellIndex) => {
          doc.text(cell, 20 + (cellWidth * cellIndex) + cellPadding, rowY);
        });
      });

      return y + ((data.length + 1) * cellHeight) + 5;
    };

    // Title
    yPos = addCenteredText('EcoTrack Recycling Report', yPos, 24, 'bold');
    yPos += 5;

    // Report Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPos);
    doc.text(`User: ${currentUser?.email}`, pageWidth - 20 - doc.getStringUnitWidth(`User: ${currentUser?.email}`) * 10 / doc.internal.scaleFactor, yPos);
    yPos += 15;

    // Summary Section
    yPos = addSectionTitle('Summary Statistics', yPos);
    yPos += 10;

    const summaryData = [
      ['Total Items Recycled', `${stats.totalItems}`],
      ['Completed Items', `${stats.completedItems}`],
      ['Pending Items', `${stats.pendingItems}`],
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
    const monthlyTableData = monthlyData.map(item => [
      item.month,
      item.electronics.toString(),
      item.batteries.toString(),
      item.others.toString()
    ]);

    yPos = createTable(monthlyHeaders, monthlyTableData, yPos);
    yPos += 15;

    // Material Purity Rates
    if (purityData.length > 0) {
      yPos = addSectionTitle('Material Purity Rates', yPos);
      yPos += 10;

      const purityHeaders = ['Material', 'Purity Rate (%)'];
      const purityTableData = purityData.map(item => [
        item.material,
        item.purity.toFixed(1)
      ]);

      yPos = createTable(purityHeaders, purityTableData, yPos);
      yPos += 15;
    }

    // Resource Usage
    if (resourceData.length > 0) {
      if (yPos > doc.internal.pageSize.height - 60) {
        doc.addPage();
        yPos = 20;
      }

      yPos = addSectionTitle('Resource Usage', yPos);
      yPos += 10;

      const resourceHeaders = ['Month', 'Electricity (kWh)', 'Water (L)', 'Labor (hrs)'];
      const resourceTableData = resourceData.map(item => [
        item.month,
        item.electricity.toString(),
        item.water.toString(),
        item.labor.toString()
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
    doc.save('ecotrack-recycling-report.pdf');
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Recycling Reports</h2>
        <div className="flex gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
          </select>
          <button
            onClick={downloadPDF}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Download PDF Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Recycling Trends */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Monthly Recycling Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="electronics" fill="#0088FE" name="Electronics" />
                <Bar dataKey="batteries" fill="#00C49F" name="Batteries" />
                <Bar dataKey="others" fill="#FFBB28" name="Others" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Category Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Material Purity Rates */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Material Purity Rates</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="material" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="purity" fill="#8884d8" name="Purity Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Usage Trends */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Resource Usage Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="electricity" stroke="#8884d8" name="Electricity (kWh)" />
                <Line type="monotone" dataKey="water" stroke="#82ca9d" name="Water (L)" />
                <Line type="monotone" dataKey="labor" stroke="#ffc658" name="Labor (hrs)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-2">Total Items Recycled</h4>
              <p className="text-3xl font-bold text-green-600">
                {categoryData.reduce((sum, item) => sum + item.value, 0)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-2">Average Purity Rate</h4>
              <p className="text-3xl font-bold text-green-600">
                {purityData.length > 0
                  ? (purityData.reduce((sum, item) => sum + item.purity, 0) / purityData.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-2">Total Energy Used</h4>
              <p className="text-3xl font-bold text-green-600">
                {resourceData.reduce((sum, item) => sum + item.electricity, 0)} kWh
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-2">Water Consumption</h4>
              <p className="text-3xl font-bold text-green-600">
                {resourceData.reduce((sum, item) => sum + item.water, 0)} L
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}