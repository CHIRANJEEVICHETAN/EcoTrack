import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { fetchReportData } from '../utils/reportUtils';
import { generatePDF } from '../utils/pdfGenerator';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface Stats {
  totalItems: number;
  completedItems: number;
  pendingItems: number;
  totalWeight: number;
  carbonSaved: number;
  treesEquivalent: number;
}

export default function Reports() {
  const { currentUser } = useAuth();
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [purityData, setPurityData] = useState<any[]>([]);
  const [resourceData, setResourceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');
  const [stats, setStats] = useState<Stats>({
    totalItems: 0,
    completedItems: 0,
    pendingItems: 0,
    totalWeight: 0,
    carbonSaved: 0,
    treesEquivalent: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReportData = async () => {
      if (!currentUser) return;

      try {
        const data = await fetchReportData(currentUser);
        if (data) {
          setStats(data.stats);
          setMonthlyData(data.monthlyData);
          setCategoryData(data.categoryData);
          setPurityData(data.purityData);
          setResourceData(data.resourceData);
        }
      } catch (error) {
        console.error('Error loading report data:', error);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [currentUser, dateRange]);

  const handleDownloadPDF = () => {
    generatePDF({
      stats,
      monthlyData,
      purityData,
      resourceData
    }, currentUser!);
  };

  const formatNumber = (value: number, decimals: number = 2): string => {
    return Number(value).toFixed(decimals);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
          Recycling Reports
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 mb-2 sm:mb-0"
          >
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
          </select>
          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
          >
            Download PDF Report
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Total Items', value: stats.totalItems },
          { label: 'Completed', value: stats.completedItems },
          { label: 'Pending', value: stats.pendingItems },
          { label: 'Total Weight', value: `${formatNumber(stats.totalWeight)} kg` },
          { label: 'Carbon Saved', value: `${formatNumber(stats.carbonSaved)} kg` },
          { label: 'Trees Equivalent', value: formatNumber(stats.treesEquivalent, 1) }
        ].map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-md">
            <h4 className="text-sm font-medium text-gray-500 mb-1">{stat.label}</h4>
            <p className="text-xl font-bold text-green-600">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Recycling Trends */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Monthly Recycling Trends</h3>
          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval={window.innerWidth < 768 ? 1 : 0}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="electronics" fill="#0088FE" name="Electronics" />
                <Bar dataKey="batteries" fill="#00C49F" name="Batteries" />
                <Bar dataKey="others" fill="#FFBB28" name="Others" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={window.innerWidth < 768 ? 80 : 100}
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Material Purity Rates */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Material Purity Rates</h3>
          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="material" 
                  tick={{ fontSize: 12 }}
                  interval={window.innerWidth < 768 ? 1 : 0}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="purity" fill="#8884d8" name="Purity Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Usage Trends */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Resource Usage Trends</h3>
          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval={window.innerWidth < 768 ? 1 : 0}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="electricity" stroke="#8884d8" name="Electricity (kWh)" />
                <Line type="monotone" dataKey="water" stroke="#82ca9d" name="Water (L)" />
                <Line type="monotone" dataKey="labor" stroke="#ffc658" name="Labor (hrs)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}