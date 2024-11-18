import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, getDocs, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { ChartBarIcon, UsersIcon, TrashIcon } from '@heroicons/react/24/outline';

interface WasteItem {
  id: string;
  itemType: string;
  brand?: string;
  model?: string;
  status: string;
  userEmail: string;
  location: string;
  createdAt: Date;
}

interface UserData {
  uid: string;
  email: string;
  displayName: string | null;
  itemsRecycled: number;
  joinDate: Date;
}

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalItems: 0,
    completedItems: 0,
    pendingItems: 0,
  });

  useEffect(() => {
    if (currentUser?.email !== 'admin@ecotrack.com') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch waste items
        const wasteQuery = query(collection(db, 'e-waste'));
        const wasteSnapshot = await getDocs(wasteQuery);
        const wasteData = wasteSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        })) as WasteItem[];
        setWasteItems(wasteData);

        // Fetch users
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = await Promise.all(
          usersSnapshot.docs.map(async (doc) => {
            const userWasteQuery = query(
              collection(db, 'e-waste'),
              where('userId', '==', doc.id)
            );
            const userWasteSnapshot = await getDocs(userWasteQuery);
            return {
              uid: doc.id,
              ...doc.data(),
              itemsRecycled: userWasteSnapshot.docs.length,
              joinDate: doc.data().createdAt?.toDate() || new Date(),
            } as UserData;
          })
        );
        setUsers(usersData);

        // Calculate statistics
        setStats({
          totalUsers: usersData.length,
          totalItems: wasteData.length,
          completedItems: wasteData.filter(item => item.status === 'Completed').length,
          pendingItems: wasteData.filter(item => item.status === 'Pending').length,
        });

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load dashboard data');
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
      setError('Failed to update status');
    }
  };

  const deleteWasteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'e-waste', id));
      setWasteItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting waste item:', error);
      setError('Failed to delete item');
    }
  };

  const deleteUser = async (uid: string) => {
    try {
      // Delete user's waste items
      const userWasteQuery = query(
        collection(db, 'e-waste'),
        where('userId', '==', uid)
      );
      const userWasteSnapshot = await getDocs(userWasteQuery);
      await Promise.all(
        userWasteSnapshot.docs.map(doc => deleteDoc(doc.ref))
      );

      // Delete user document
      await deleteDoc(doc(db, 'users', uid));

      setUsers(prev => prev.filter(user => user.uid !== uid));
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'overview'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-green-50'
            }`}
          >
            <ChartBarIcon className="h-5 w-5 inline-block mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'users'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-green-50'
              }`}
          >
            <UsersIcon className="h-5 w-5 inline-block mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('waste')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'waste'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-green-50'
            }`}
          >
            <TrashIcon className="h-5 w-5 inline-block mr-2" />
            E-Waste
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
          {error}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats.totalUsers}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrashIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Items
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats.totalItems}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed Items
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats.completedItems}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Items
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats.pendingItems}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items Recycled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.uid}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.displayName || user.email}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.itemsRecycled}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.joinDate.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => deleteUser(user.uid)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'waste' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
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
                    <select
                      value={item.status}
                      onChange={(e) => updateWasteStatus(item.id, e.target.value)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => deleteWasteItem(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}