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
            onClick={handleDownloadPDF}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-2">Total Items</h4>
              <p className="text-3xl font-bold text-green-600">{stats.totalItems}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-2">Completed</h4>
              <p className="text-3xl font-bold text-green-600">{stats.completedItems}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-2">Pending</h4>
              <p className="text-3xl font-bold text-green-600">{stats.pendingItems}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-2">Total Weight</h4>
              <p className="text-3xl font-bold text-green-600">{formatNumber(stats.totalWeight)} kg</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-2">Carbon Saved</h4>
              <p className="text-3xl font-bold text-green-600">{formatNumber(stats.carbonSaved)} kg</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-2">Trees Equivalent</h4>
              <p className="text-3xl font-bold text-green-600">{formatNumber(stats.treesEquivalent, 1)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}