import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase'; // Firestore instance
import { collection, getDocs, query, where, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface Vendor {
  id: string;
  name: string;
  location: string;
}

interface EWasteReport {
  id: string;
  userEmail: string;
  location: string;
  condition: string;
  status: string;
  createdAt: any; // Firestore Timestamp
  brand: string;
  model: string;
  itemType: string;
  weight: string;
  userId: string;
  arrivalDate?: string;
  vendorId?: string;
  description?: string;
  imageUrl?: string;
}

interface DashboardStats {
  totalEwaste: number;
  totalPickups: number;
  pendingPickups: number;
  completedPickups: number;
  totalWeight: number;
}

interface PickupReport {
  id: string;
  userName: string;
  location: string;
  contact: string;
  items: string;
  status: 'pending' | 'in_progress' | 'completed';
  pickupDate: any; // Firestore Timestamp
  vendorId: string;
  userId: string;
  submissionId?: string; // Reference to e-waste submission
  assignedAt?: any; // Timestamp when vendor was assigned
  arrivalDate?: string;
}

const VendorDashboard = () => {
  const [ewasteReports, setEwasteReports] = useState<EWasteReport[]>([]);
  const [pickupReports, setPickupReports] = useState<PickupReport[]>([]);  // New state for pickup reports
  const [vendorId, setVendorId] = useState<string>('12345'); // Example Vendor ID (replace with dynamic ID if needed)
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalEwaste: 0,
    totalPickups: 0,
    pendingPickups: 0,
    completedPickups: 0,
    totalWeight: 0
  });
  const [pickupStatus, setPickupStatus] = useState<{ [key: string]: boolean }>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch eWaste reports from Firestore
  useEffect(() => {
    const fetchEwasteReports = async () => {
      try {
        const reportsQuery = query(
          collection(db, 'e-waste')
        );
        const reportsSnapshot = await getDocs(reportsQuery);
        
        // Map the documents to our interface
        const reportsList = reportsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          status: doc.data().status || 'pending'
        })) as EWasteReport[];
        
        // Sort by createdAt timestamp (most recent first)
        reportsList.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        
        console.log('Fetched reports:', reportsList); // Debug log
        setEwasteReports(reportsList);
      } catch (error) {
        console.error('Error fetching eWaste reports:', error);
      }
    };

    fetchEwasteReports();
  }, []); // Remove vendorId dependency since we're not using it

  // Fetch Pickup Reports (assuming a separate collection for pickup)
  useEffect(() => {
    const fetchPickupReports = async () => {
      try {
        // Remove the where clause to see all pickups first
        const pickupQuery = query(
          collection(db, 'pickups')
        );
        const pickupSnapshot = await getDocs(pickupQuery);
        const pickupList = pickupSnapshot.docs.map((doc) => ({
          id: doc.id,
          userName: doc.data().userName || '',
          location: doc.data().location || '',
          contact: doc.data().contact || '',
          items: doc.data().items || '',
          status: doc.data().status || 'pending',
          pickupDate: doc.data().pickupDate,
          vendorId: doc.data().vendorId || '',
          userId: doc.data().userId || '',
          arrivalDate: doc.data().arrivalDate || ''
        })) as PickupReport[];
        
        console.log('Fetched pickup reports:', pickupList); // Debug log
        setPickupReports(pickupList);
      } catch (error) {
        console.error('Error fetching pickup reports:', error);
      }
    };

    fetchPickupReports();
  }, []); // Remove vendorId dependency

  // Add this function to fetch vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
        const vendorsList = vendorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Vendor[];
        setVendors(vendorsList);
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    };

    fetchVendors();
  }, []);

  // Add this function to calculate dashboard stats
  useEffect(() => {
    const calculateStats = () => {
      const stats = {
        totalEwaste: ewasteReports.length,
        totalPickups: pickupReports.length,
        pendingPickups: pickupReports.filter(r => r.status === 'pending').length,
        completedPickups: pickupReports.filter(r => r.status === 'completed').length,
        totalWeight: ewasteReports.reduce((sum, report) => sum + parseFloat(report.weight || '0'), 0)
      };
      setDashboardStats(stats);
    };

    calculateStats();
  }, [ewasteReports, pickupReports]);

  // Add this function to handle status updates
  const handlePickupStatusUpdate = async (pickupId: string, newStatus: string) => {
    try {
      // Update Firestore
      await updateDoc(doc(db, 'pickups', pickupId), {
        status: newStatus,
        lastUpdated: serverTimestamp()
      });

      // Find the pickup report to get user details
      const pickup = pickupReports.find(report => report.id === pickupId);
      
      // Create user notification in Firestore
      if (pickup?.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: pickup.userId,
          message: `Your pickup request status has been updated to ${newStatus}`,
          type: 'status_update',
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // Update local state
      setPickupReports(prevReports => 
        prevReports.map(report => 
          report.id === pickupId 
            ? { ...report, status: newStatus as 'pending' | 'in_progress' | 'completed' }
            : report
        )
      );

      // Show success notification
      setNotification({
        show: true,
        message: 'Pickup status updated successfully!',
        type: 'success'
      });

      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);

    } catch (error) {
      console.error('Error updating pickup status:', error);
      setNotification({
        show: true,
        message: 'Failed to update pickup status',
        type: 'error'
      });
    }
  };

  // Add this function to handle vendor assignment
  const handleVendorAssignment = async (pickupId: string, vendorId: string) => {
    try {
      // Update pickup document
      await updateDoc(doc(db, 'pickups', pickupId), {
        vendorId,
        assignedAt: serverTimestamp()
      });

      // Find the pickup to get the e-waste submission ID
      const pickup = pickupReports.find(p => p.id === pickupId);
      if (pickup?.submissionId) {
        await updateDoc(doc(db, 'e-waste', pickup.submissionId), {
          vendorAssigned: true,
          vendorId
        });
      }

      // Update local state
      setPickupReports(prevReports =>
        prevReports.map(report =>
          report.id === pickupId
            ? { ...report, vendorId }
            : report
        )
      );

      // Show success notification
      setNotification({
        show: true,
        message: 'Vendor assigned successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error assigning vendor:', error);
      setNotification({
        show: true,
        message: 'Failed to assign vendor',
        type: 'error'
      });
    }
  };

  const handleArrivalDateUpdate = async (pickupId: string, date: string) => {
    try {
      await updateDoc(doc(db, 'pickups', pickupId), {
        arrivalDate: date
      });

      // Update local state
      setPickupReports(prevReports =>
        prevReports.map(report =>
          report.id === pickupId
            ? { ...report, arrivalDate: date }
            : report
        )
      );

      setNotification({
        show: true,
        message: 'Arrival date updated successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating arrival date:', error);
      setNotification({
        show: true,
        message: 'Failed to update arrival date',
        type: 'error'
      });
    }
  };

  const filteredReports = pickupReports.filter(report => 
    report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <h2 className="text-2xl font-bold mb-6">Vendor Dashboard</h2>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-500">Total E-waste</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{dashboardStats.totalEwaste} kg</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Pickups</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{dashboardStats.totalPickups}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-500">Pending Pickups</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{dashboardStats.pendingPickups}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-500">Completed Pickups</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{dashboardStats.completedPickups}</p>
        </div>
      </div>

      {/* Pickup Reports Section */}
      <section className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Pickup Reports</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by name or location..."
              className="px-3 py-2 border rounded-md w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pickup Location
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Arrival
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{report.userName}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{report.location}</div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{report.contact}</div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4">
                    <div className="text-sm text-gray-500">{report.items}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <select
                      value={report.status}
                      onChange={(e) => handlePickupStatusUpdate(report.id, e.target.value)}
                      className={`text-sm rounded-md border px-2 py-1 ${
                        report.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                        report.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                        'bg-green-50 text-green-700 border-green-300'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="date"
                      value={report.arrivalDate || ''}
                      onChange={(e) => handleArrivalDateUpdate(report.id, e.target.value)}
                      className="text-sm border rounded-md px-2 py-1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View for Hidden Columns */}
        <div className="sm:hidden">
          {filteredReports.map((report) => (
            <div key={report.id} className="px-4 py-3 border-t">
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">Contact:</span>
                <span className="ml-2 text-sm text-gray-900">{report.contact}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500">Items:</span>
                <span className="ml-2 text-sm text-gray-900">{report.items}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No pickup reports found</p>
          </div>
        )}

        {/* Notification */}
        {notification.show && (
          <div className="fixed bottom-4 right-4 animate-slide-up">
            <div className={`rounded-lg p-4 shadow-lg ${
              notification.type === 'success' 
                ? 'bg-green-100 border-l-4 border-green-500 text-green-700'
                : 'bg-red-100 border-l-4 border-red-500 text-red-700'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {notification.type === 'success' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm">{notification.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default VendorDashboard;
