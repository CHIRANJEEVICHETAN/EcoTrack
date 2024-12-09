import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase'; // Firestore instance
import { collection, getDocs, query, where, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Vendor Dashboard</h2>

      {/* Enhanced Dashboard Overview Section */}
      <section className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Dashboard Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-green-100 p-4 rounded-lg">
            <h4 className="text-lg font-medium">Total E-Waste</h4>
            <p className="text-2xl font-bold">{dashboardStats.totalEwaste}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg">
            <h4 className="text-lg font-medium">Total Pickups</h4>
            <p className="text-2xl font-bold">{dashboardStats.totalPickups}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <h4 className="text-lg font-medium">Pending Pickups</h4>
            <p className="text-2xl font-bold">{dashboardStats.pendingPickups}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h4 className="text-lg font-medium">Completed Pickups</h4>
            <p className="text-2xl font-bold">{dashboardStats.completedPickups}</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <h4 className="text-lg font-medium">Total Weight (kg)</h4>
            <p className="text-2xl font-bold">{dashboardStats.totalWeight.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {/* E-Waste Reports Section */}
      <section className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">E-Waste Reports Submitted by Users</h3>

        {/* E-Waste Reports Table */}
        <table className="min-w-full table-auto mb-4">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Location</th>
              <th className="px-4 py-2 text-left">Item Type</th>
              <th className="px-4 py-2 text-left">Brand/Model</th>
              <th className="px-4 py-2 text-left">Condition</th>
              <th className="px-4 py-2 text-left">Weight</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {ewasteReports.map((report) => (
              <tr key={report.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{report.userEmail}</td>
                <td className="px-4 py-2">{report.location}</td>
                <td className="px-4 py-2">{report.itemType}</td>
                <td className="px-4 py-2">{`${report.brand} ${report.model}`}</td>
                <td className="px-4 py-2">{report.condition}</td>
                <td className="px-4 py-2">{report.weight}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    report.status === 'approved' ? 'bg-green-100 text-green-800' :
                    report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {report.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {ewasteReports.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No e-waste reports found
          </div>
        )}
      </section>

      {/* Enhanced Pickup Reports Section */}
      <section className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Pickup Management</h3>

        <table className="min-w-full table-auto mb-4">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">User Name</th>
              <th className="px-4 py-2 text-left">Pickup Location</th>
              <th className="px-4 py-2 text-left">Contact</th>
              <th className="px-4 py-2 text-left">Items</th>
              <th className="px-4 py-2 text-left">Assign Vendor</th>
              <th className="px-4 py-2 text-left">Expected Arrival</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Submission Date</th>
            </tr>
          </thead>
          <tbody>
            {pickupReports.map((report) => (
              <tr key={report.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{report.userName}</td>
                <td className="px-4 py-2">{report.location}</td>
                <td className="px-4 py-2">{report.contact}</td>
                <td className="px-4 py-2">{report.items}</td>
                <td className="px-4 py-2">
                  <select
                    value={report.vendorId || ''}
                    onChange={(e) => handleVendorAssignment(report.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 appearance-none cursor-pointer"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="date"
                    value={report.arrivalDate || ''}
                    onChange={(e) => handleArrivalDateUpdate(report.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    value={report.status}
                    onChange={(e) => handlePickupStatusUpdate(report.id, e.target.value)}
                    className={`w-full px-3 py-2 rounded-md border appearance-none cursor-pointer shadow-sm focus:ring-1 focus:ring-green-500 ${
                      report.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                      report.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                      report.status === 'completed' ? 'bg-green-50 text-green-700 border-green-300' :
                      'bg-gray-50 text-gray-700 border-gray-300'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {report.pickupDate?.toDate().toLocaleDateString() || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pickupReports.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No pickup reports found
          </div>
        )}
      </section>

      {/* Floating Notification */}
      {notification.show && (
        <div className="fixed bottom-4 right-4 animate-slide-up">
          <div className={`rounded-lg p-4 shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-100 border-l-4 border-green-500 text-green-700'
              : 'bg-red-100 border-l-4 border-red-500 text-red-700'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
              )}
              <p>{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add this CSS to your existing styles or in a style tag */}
      <style>
        {`
          select {
            background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
            background-position: right 0.5rem center;
            background-repeat: no-repeat;
            background-size: 1.5em 1.5em;
            padding-right: 2.5rem;
          }
        `}
      </style>
    </div>
  );
};

export default VendorDashboard;
