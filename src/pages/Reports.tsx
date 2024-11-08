import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', electronics: 65, batteries: 45 },
  { month: 'Feb', electronics: 59, batteries: 49 },
  { month: 'Mar', electronics: 80, batteries: 40 },
  { month: 'Apr', electronics: 81, batteries: 55 },
  { month: 'May', electronics: 56, batteries: 39 },
  { month: 'Jun', electronics: 55, batteries: 48 },
];

export default function Reports() {
  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Recycling Reports</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Monthly Recycling Overview</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="electronics" fill="#059669" name="Electronics" />
              <Bar dataKey="batteries" fill="#34D399" name="Batteries" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Total Items Recycled</h3>
          <p className="text-3xl font-bold text-green-600">396</p>
          <p className="text-sm text-gray-600 mt-1">Last 6 months</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">CO₂ Emissions Saved</h3>
          <p className="text-3xl font-bold text-green-600">2.4 tons</p>
          <p className="text-sm text-gray-600 mt-1">Environmental impact</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Recycling Efficiency</h3>
          <p className="text-3xl font-bold text-green-600">94%</p>
          <p className="text-sm text-gray-600 mt-1">Material recovery rate</p>
        </div>
      </div>
    </div>
  );
}