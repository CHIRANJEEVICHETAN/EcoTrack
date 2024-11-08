import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, getDocs, updateDoc, doc, deleteDoc, DocumentData } from 'firebase/firestore';

interface WasteItem extends DocumentData {
  id: string;
  itemType: string;
  brand?: string;
  model?: string;
  status: string;
  userEmail: string;
  location: string;
}

interface Vendor extends DocumentData {
  id: string;
  name: string;
  location: string;
}

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('waste');
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.email !== 'admin@ecotrack.com') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const wasteQuery = query(collection(db, 'e-waste'));
        const wasteSnapshot = await getDocs(wasteQuery);
        const wasteData = wasteSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as WasteItem[];
        setWasteItems(wasteData);

        const vendorsQuery = query(collection(db, 'vendors'));
        const vendorsSnapshot = await getDocs(vendorsQuery);
        const vendorsData = vendorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Vendor[];
        setVendors(vendorsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [currentUser, navigate]);

  const updateWasteStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'e-waste', id), { status });
      setWasteItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, status } : item
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteVendor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vendors', id));
      setVendors(prev => prev.filter(vendor => vendor.id !== id));
    } catch (error) {
      console.error('Error deleting vendor:', error);
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h2>

      <div className="mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('waste')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'waste'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-green-50'
            }`}
          >
            E-Waste Management
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'vendors'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-green-50'
            }`}
          >
            Recycling Vendors
          </button>
        </nav>
      </div>

      {activeTab === 'waste' ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {wasteItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.itemType}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.brand} {item.model}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.userEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'In Progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <select
                      onChange={(e) => updateWasteStatus(item.id, e.target.value)}
                      value={item.status}
                      className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    >
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {vendor.name}
                </h4>
                <p className="text-sm text-gray-600 mb-4">{vendor.location}</p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => deleteVendor(vendor.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}