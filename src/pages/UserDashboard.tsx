import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ChartBarIcon, DocumentTextIcon, ClockIcon, TruckIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface EWasteSubmission {
  id: string;
  itemType: string;
  brand: string;
  model: string;
  status: string;
  location: string;
  weight: string;
  createdAt: any;
  pickupRequested?: boolean;
  vendorAssigned?: boolean;
  vendorName?: string;
  pickupStatus?: string;
  assignedAt?: any;
  pickupId?: string;
  arrivalDate?: string;
}

interface UserStats {
  totalSubmissions: number;
  pendingPickups: number;
  completedRecycling: number;
  inProgress: number;
}

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState<EWasteSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<UserStats>({
    totalSubmissions: 0,
    pendingPickups: 0,
    completedRecycling: 0,
    inProgress: 0
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        const submissionsQuery = query(
          collection(db, 'e-waste'),
          where('userEmail', '==', currentUser.email),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(submissionsQuery);
        const submissionsData = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Document data:', data); // Debug log for each document

          return {
            id: doc.id,
            itemType: data.itemType || '',
            brand: data.brand || '',
            model: data.model || '',
            status: data.status || 'Pending',
            location: data.location || '',
            weight: data.weight || '',
            createdAt: data.createdAt,
            pickupRequested: data.pickupRequested || false,
            vendorAssigned: data.vendorAssigned || false,
            vendorName: data.vendorName || '',
            pickupStatus: data.pickupStatus || '',
            assignedAt: data.assignedAt || null,
            pickupId: data.pickupId || '',
            arrivalDate: data.arrivalDate || null
          };
        });

        console.log('Current user email:', currentUser.email); // Debug log
        console.log('Total documents found:', snapshot.size); // Debug log
        console.log('Fetched submissions:', submissionsData); // Debug log

        setSubmissions(submissionsData);
        
        // Calculate stats
        setStats({
          totalSubmissions: submissionsData.length,
          pendingPickups: submissionsData.filter(s => s.status === 'Pending').length,
          completedRecycling: submissionsData.filter(s => s.status === 'Completed').length,
          inProgress: submissionsData.filter(s => s.status === 'In Progress').length
        });

      } catch (error) {
        console.error('Error fetching user data:', error);
        // Add more detailed error logging
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <div className="mt-4 md:mt-0">
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'overview'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-green-50'
              }`}
            >
              <ChartBarIcon className="h-5 w-5 inline-block mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'submissions'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-green-50'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 inline-block mr-2" />
              <span className="hidden sm:inline">Submissions</span>
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'tracking'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-green-50'
              }`}
            >
              <TruckIcon className="h-5 w-5 inline-block mr-2" />
              <span className="hidden sm:inline">Tracking</span>
            </button>
          </motion.div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Submissions
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats.totalSubmissions}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Similar stats cards for other metrics */}
        </motion.div>
      )}

      {activeTab === 'submissions' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow overflow-hidden sm:rounded-lg"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <motion.tr
                    key={submission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.itemType}
                      </div>
                      <div className="text-sm text-gray-500">
                        {submission.brand} {submission.model}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.weight} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.createdAt?.toDate().toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'tracking' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow overflow-hidden sm:rounded-lg"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pickup Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <motion.tr
                    key={submission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.itemType}
                      </div>
                      <div className="text-sm text-gray-500">
                        {submission.brand} {submission.model}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {submission.pickupRequested ? (
                        <div className="text-sm">
                          {submission.vendorAssigned ? (
                            <>
                              <p className="font-medium text-gray-900">
                                Vendor: {submission.vendorName}
                              </p>
                              {submission.arrivalDate && (
                                <p className="text-gray-500">
                                  Expected Arrival: {new Date(submission.arrivalDate).toLocaleDateString()}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-yellow-600">Awaiting Vendor Assignment</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">No pickup requested</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {submission.createdAt?.toDate().toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UserDashboard; 