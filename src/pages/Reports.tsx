import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Reports() {
  const { currentUser } = useAuth();
  const [monthlyData, setMonthlyData] = useState<{ month: string; electronics: number; batteries: number; others: number; }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        const wasteQuery = query(
          collection(db, 'e-waste'),
          where('userId', '==', currentUser.uid)
        );
        const snapshot = await getDocs(wasteQuery);
        const items = snapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));

        // Process monthly data
        const monthlyStats = processMonthlyData(items, dateRange);
        setMonthlyData(monthlyStats);

        // Process category data
        const categoryStats = processCategoryData(items);
        setCategoryData(categoryStats);
      } catch (error) {
        console.error('Error fetching report data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [currentUser, dateRange]);

  const processMonthlyData = (items, range) => {
    const months = range === '6months' ? 6 : 12;
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

    items.forEach(item => {
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

    return monthlyStats;
  };

  const processCategoryData = (items): { name: string; value: number; }[] => {
    const categories: { [key: string]: number } = {};
    items.forEach(item => {
      categories[item.itemType] = (categories[item.itemType] || 0) + 1;
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value: value as number
    }));
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Add title and styling
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94); // Green color
    doc.text('EcoTrack Recycling Report', 20, 20);
    
    // Add date and user info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`User: ${currentUser?.email}`, 20, 40);

    // Add monthly statistics
    doc.setFontSize(16);
    doc.text('Monthly Recycling Statistics:', 20, 60);

    let y = 70;
    monthlyData.forEach(item => {
      doc.setFontSize(12);
      doc.text(
        `${item.month}: Electronics - ${item.electronics}, Batteries - ${item.batteries}, Others - ${item.others}`,
        30,
        y
      );
      y += 10;
    });
    
    // Add category statistics
    y += 10;
    doc.setFontSize(16);
    doc.text('Category Distribution:', 20, y);
    y += 10;
    
    categoryData.forEach(item => {
      doc.setFontSize(12);
      doc.text(`${item.name}: ${item.value} items`, 30, y);
      y += 10;
    });
    
    // Add summary
    const totalItems = categoryData.reduce((sum, item) => sum + item.value, 0);
    y += 10;
    doc.setFontSize(16);
    doc.text('Summary:', 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Total Items Recycled: ${totalItems}`, 30, y);
    
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
        {/* Bar Chart */}
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

        {/* Pie Chart */}
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

        {/* Statistics Cards */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-2">Total Items Recycled</h4>
              <p className="text-3xl font-bold text-green-600">
                {categoryData.reduce((sum, item) => sum + item.value, 0)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-2">Most Recycled Category</h4>
              <p className="text-3xl font-bold text-green-600">
                {categoryData.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-2">Environmental Impact</h4>
              <p className="text-3xl font-bold text-green-600">
                {(categoryData.reduce((sum, item) => sum + item.value, 0) * 0.5).toFixed(1)} kg CO₂
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}