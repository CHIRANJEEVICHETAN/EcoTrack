import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, getDocs, updateDoc, doc, deleteDoc, where, addDoc, collectionGroup, serverTimestamp } from 'firebase/firestore';
import { ChartBarIcon, UsersIcon, TrashIcon, BuildingStorefrontIcon, DocumentTextIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { getAuth, deleteUser as deleteFirebaseUser } from 'firebase/auth';

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

interface Vendor {
  id: string;
  name: string;
  location: string;
  materials: string[];
  contact: string;
}

interface VendorRequest {
  id: string;
  email: string;
  businessName: string;
  businessAddress: string;
  certifications: string;
  achievements: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

interface UserSubmission {
  submissionId: string;
  userId: string;
}

interface Complaint {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  complaintType: string;
  priority: string;
  description: string;
  dateTime: string;
  status: string;
  attachmentUrl?: string;
  createdAt: any;
}

interface Feedback {
  id: string;
  vendor: string;
  feedback: string;
  timestamp: any;
}

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorRequests, setVendorRequests] = useState<VendorRequest[]>([]);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalItems: 0,
    completedItems: 0,
    pendingItems: 0,
  });

  // New vendor form state
  const [newVendor, setNewVendor] = useState({
    name: '',
    location: '',
    contact: '',
    materials: [] as string[],
    newMaterial: '', // For the material input field
  });

  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);

  const [userSubmissions, setUserSubmissions] = useState<UserSubmission[]>([]);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const fetchData = async () => {
    try {
      // Fetch waste items
      const wasteQuery = query(collection(db, 'e-waste'));
      const wasteSnapshot = await getDocs(wasteQuery);
      // Fetch vendor requests
      const vendorRequestsQuery = query(collection(db, 'vendorRequests'));
      const vendorRequestsSnapshot = await getDocs(vendorRequestsQuery);
      const vendorRequestsData = vendorRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as VendorRequest[];
      setVendorRequests(vendorRequestsData);
      const wasteData = wasteSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as WasteItem[];
      setWasteItems(wasteData);

      // Fetch users from Firestore
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
            email: doc.data().email || '',
            displayName: doc.data().displayName || null,
            itemsRecycled: userWasteSnapshot.docs.length,
            joinDate: doc.data().createdAt?.toDate() || new Date(),
          } as UserData;
        })
      );
      setUsers(usersData);

      // Fetch vendors
      const vendorsQuery = query(collection(db, 'vendors'));
      const vendorsSnapshot = await getDocs(vendorsQuery);
      const vendorsData = vendorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vendor[];
      setVendors(vendorsData);

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

  const fetchUserSubmissions = async () => {
    try {
      const submissionsData: UserSubmission[] = [];

      // Use collectionGroup to query all SubmissionID collections
      const submissionsQuery = query(collectionGroup(db, 'SubmissionID'));
      const submissionsSnapshot = await getDocs(submissionsQuery);

      console.log('Number of submissions found:', submissionsSnapshot.size); // Debug log

      submissionsSnapshot.forEach(doc => {
        const data = doc.data();
        const path = doc.ref.path.split('/');
        const userId = path[1]; // BlockChainSubmissionId/{userId}/SubmissionID/{docId}
        
        console.log('Document path:', doc.ref.path); // Debug log
        console.log('Document data:', data); // Debug log

        if (data.submissionId) {
          submissionsData.push({
            submissionId: data.submissionId,
            userId: userId,
          });
        }
      });

      console.log('Processed submissions:', submissionsData); // Debug log
      setUserSubmissions(submissionsData);
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      setError('Failed to load user submissions');
    }
  };

  useEffect(() => {
    if (currentUser?.email !== 'admin@ecotrack.com') {
      navigate('/');
      return;
    }

    fetchData();
    fetchUserSubmissions();
  }, [currentUser, navigate]);

  const addVendor = async () => {
    try {
      if (!newVendor.name || !newVendor.location || !newVendor.contact) {
        setError('Please fill in all required fields');
        return;
      }

      const vendorData = {
        name: newVendor.name,
        location: newVendor.location,
        contact: newVendor.contact,
        materials: newVendor.materials,
      };

      const docRef = await addDoc(collection(db, 'vendors'), vendorData);
      setVendors([...vendors, { ...vendorData, id: docRef.id }]);

      // Reset form
      setNewVendor({
        name: '',
        location: '',
        contact: '',
        materials: [],
        newMaterial: '',
      });
    } catch (error) {
      console.error('Error adding vendor:', error);
      setError('Failed to add vendor');
    }
  };

  async function handleVendorApproval(requestId: string, status: 'approved' | 'rejected') {
    try {
      setLoadingRequestId(requestId);
      await updateDoc(doc(db, 'vendorRequests', requestId), {
        status,
        updatedAt: new Date(),
      });
      
      // Refresh the vendor requests
      fetchData();
    } catch (err) {
      console.error('Error updating vendor status:', err);
      setError('Failed to update vendor status');
    } finally {
      setLoadingRequestId(null);
    }
  }

  const deleteVendor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vendors', id));
      setVendors(vendors.filter(vendor => vendor.id !== id));
    } catch (error) {
      console.error('Error deleting vendor:', error);
      setError('Failed to delete vendor');
    }
  };

  const addMaterial = () => {
    if (newVendor.newMaterial.trim()) {
      setNewVendor({
        ...newVendor,
        materials: [...newVendor.materials, newVendor.newMaterial.trim()],
        newMaterial: '',
      });
    }
  };

  const removeMaterial = (index: number) => {
    setNewVendor({
      ...newVendor,
      materials: newVendor.materials.filter((_, i) => i !== index),
    });
  };

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

  const deleteUserData = async (uid: string) => {
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

      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', uid));

      // Update local state
      setUsers(prev => prev.filter(user => user.uid !== uid));

      setError('User data deleted successfully');
    } catch (error) {
      console.error('Error deleting user data:', error);
      setError('Failed to delete user data');
    }
  };

  const assignVendorToPickup = async (pickupId: string, vendorId: string) => {
    try {
      await updateDoc(doc(db, 'pickups', pickupId), {
        vendorId: vendorId,
        assignedAt: serverTimestamp()
      });
      
      // Optionally notify vendor
      alert('Vendor assigned successfully!');
    } catch (error) {
      console.error('Error assigning vendor:', error);
      alert('Failed to assign vendor');
    }
  };

  const handleComplaintStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'complaints', complaintId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      setComplaints(prev => 
        prev.map(complaint => 
          complaint.id === complaintId 
            ? { ...complaint, status: newStatus }
            : complaint
        )
      );

      setNotification({
        show: true,
        message: 'Complaint status updated successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating complaint status:', error);
      setNotification({
        show: true,
        message: 'Failed to update complaint status',
        type: 'error'
      });
    }
  };

  useEffect(() => {
    const fetchComplaintsAndFeedback = async () => {
      try {
        // Fetch complaints
        const complaintsSnapshot = await getDocs(collection(db, 'complaints'));
        const complaintsData = complaintsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Complaint[];
        setComplaints(complaintsData);

        // Fetch feedback
        const feedbackSnapshot = await getDocs(collection(db, 'feedback'));
        const feedbackData = feedbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Feedback[];
        setFeedbacks(feedbackData);
      } catch (error) {
        console.error('Error fetching complaints and feedback:', error);
      }
    };

    fetchComplaintsAndFeedback();
  }, []);

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
            className={`px-4 py-2 rounded-lg ${activeTab === 'overview'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-green-50'
              }`}
          >
            <ChartBarIcon className="h-5 w-5 inline-block mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'users'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-green-50'
              }`}
          >
            <UsersIcon className="h-5 w-5 inline-block mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'vendors'
              ? 'bg-green-600 text-white'
              : 'text-gray-600 hover:bg-green-50'
              }`}
          >
            <BuildingStorefrontIcon className="h-5 w-5 inline-block mr-2" />
            Vendors
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
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'complaints'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-green-50'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 inline-block mr-2" />
            Complaints
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'feedback'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-green-50'
            }`}
          >
            <ChatBubbleLeftIcon className="h-5 w-5 inline-block mr-2" />
            Feedback
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
                  <BuildingStorefrontIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Vendors
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {vendors.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="space-y-6">
          {/* Vendor Requests Section */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Pending Vendor Requests</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certifications
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
                {vendorRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{request.businessName}</div>
                      <div className="text-sm text-gray-500">{request.businessAddress}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{request.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">Documents: {request.certifications}</div>
                      <div className="text-sm text-gray-500">Achievements: {request.achievements}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === 'pending' && (
                        <div className="space-x-2">
                          <button
                            onClick={() => handleVendorApproval(request.id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                            disabled={loadingRequestId === request.id}
                          >
                            {loadingRequestId === request.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleVendorApproval(request.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                            disabled={loadingRequestId === request.id}
                          >
                            {loadingRequestId === request.id ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add New Vendor Form */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Vendor</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={newVendor.location}
                  onChange={(e) => setNewVendor({ ...newVendor, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact</label>
                <input
                  type="email"
                  value={newVendor.contact}
                  onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Materials</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVendor.newMaterial}
                    onChange={(e) => setNewVendor({ ...newVendor, newMaterial: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Add material..."
                  />
                  <button
                    onClick={addMaterial}
                    className="mt-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {newVendor.materials.map((material, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {material}
                      <button
                        onClick={() => removeMaterial(index)}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={addVendor}
              className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Add Vendor
            </button>
          </div>

          {/* Vendors List */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Materials
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{vendor.location}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {vendor.materials.map((material, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {material}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{vendor.contact}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => deleteVendor(vendor.id)}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                  Submission ID
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
                      {user.displayName || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.itemsRecycled}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.joinDate.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link
                      to={`/user-submissions/${user.uid}`}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View Submissions
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => deleteUserData(user.uid)}
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

      {activeTab === 'complaints' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{complaint.userEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{complaint.subject}</div>
                    <div className="text-sm text-gray-500">{complaint.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{complaint.complaintType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${complaint.priority === 'High' ? 'bg-red-100 text-red-800' : 
                        complaint.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={complaint.status}
                      onChange={(e) => handleComplaintStatusUpdate(complaint.id, e.target.value)}
                      className="text-sm rounded-md border-gray-300"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(complaint.dateTime).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {complaint.attachmentUrl && (
                      <a
                        href={complaint.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        View Attachment
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feedback
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feedbacks.map((feedback) => (
                <tr key={feedback.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{feedback.vendor}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{feedback.feedback}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {feedback.timestamp?.toDate().toLocaleDateString()}
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