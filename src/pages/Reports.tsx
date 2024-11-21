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

export default function Reports() {
  const { currentUser } = useAuth();
  const [monthlyData, setMonthlyData] = useState<{ month: string; electronics: number; batteries: number; others: number; }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; }[]>([]);
  const [purityData, setPurityData] = useState<{ material: string; purity: number; }[]>([]);
  const [resourceData, setResourceData] = useState<{ month: string; electricity: number; water: number; labor: number; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');

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
          createdAt: doc.data().createdAt?.toDate()
        }));

        // Fetch recycling data
        const recycleQuery = query(collection(db, 'recycleData'));
        const recycleSnapshot = await getDocs(recycleQuery);
        const recycleItems = recycleSnapshot.docs.map(doc => ({
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        })) as RecycleData[];

        // Process monthly data
        const monthlyStats = processMonthlyData(wasteItems, dateRange);
        setMonthlyData(monthlyStats);

        // Process category data
        const categoryStats = processCategoryData(wasteItems);
        setCategoryData(categoryStats);

        // Process purity data
        const purityStats = processPurityData(recycleItems);
        setPurityData(purityStats);

        // Process resource usage data
        const resourceStats = processResourceData(recycleItems);
        setResourceData(resourceStats);
      } catch (error) {
        console.error('Error fetching report data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [currentUser, dateRange]);

  const processMonthlyData = (items, range) => {
    // Existing monthly data processing logic
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
    
    // Add title and styling
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94);
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

    // Add purity rates
    y += 10;
    doc.setFontSize(16);
    doc.text('Material Purity Rates:', 20, y);
    y += 10;

    purityData.forEach(item => {
      doc.setFontSize(12);
      doc.text(`${item.material}: ${item.purity.toFixed(1)}%`, 30, y);
      y += 10;
    });

    // Add resource usage
    y += 10;
    doc.setFontSize(16);
    doc.text('Resource Usage Summary:', 20, y);
    y += 10;

    resourceData.forEach(item => {
      doc.setFontSize(12);
      doc.text(
        `${item.month}: Electricity - ${item.electricity}kWh, Water - ${item.water}L, Labor - ${item.labor}hrs`,
        30,
        y
      );
      y += 10;
    });
    
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