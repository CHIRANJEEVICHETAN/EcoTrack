import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CalendarIcon, DocumentTextIcon, MapPinIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { storage, db } from './../config/firebase'; // Adjust the path as needed
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';

interface ComplaintRecord {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  complaintType: string;
  priority: string;
  description: string;
  dateTime: string;
  status: string;
  location?: string;
  address?: string;
  attachmentUrl?: string;
  companyName?: string;
  serviceAffected?: string;
  businessImpact?: string;
  desiredResolution?: string;
  followUp?: string;
  createdAt: any;
}

const ComplaintForm: React.FC = () => {
  const { currentUser } = useAuth();  // Get the current user context (user or vendor)
  const [subject, setSubject] = useState('');
  const [complaintType, setComplaintType] = useState('');
  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [attachments, setAttachments] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [serviceAffected, setServiceAffected] = useState('');
  const [businessImpact, setBusinessImpact] = useState('');
  const [desiredResolution, setDesiredResolution] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComplaintHistory, setShowComplaintHistory] = useState(false);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);

  const isVendor = currentUser?.email?.endsWith('@vendor.ecotrack.com'); // Check if user is a vendor

  useEffect(() => {
    if (currentUser) {
      fetchComplaints();
    }
  }, [currentUser]);

  const fetchComplaints = async () => {
    if (!currentUser) return;
    
    setIsLoadingComplaints(true);
    try {
      const complaintsQuery = query(
        collection(db, 'complaints'),
        where('userId', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(complaintsQuery);
      const complaintsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateTime: doc.data().dateTime || doc.data().createdAt?.toDate().toISOString(),
        status: doc.data().status || 'pending'
      })) as ComplaintRecord[];
      
      console.log('Fetched complaints:', complaintsData); // Debug log
      setComplaints(complaintsData);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let attachmentUrl = null;
      if (attachments) {
        const storageRef = ref(storage, `complaints/${currentUser.uid}/${attachments.name}`);
        const uploadResult = await uploadBytes(storageRef, attachments);
        attachmentUrl = await getDownloadURL(uploadResult.ref);
      }

      const complaintData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        subject,
        complaintType,
        priority,
        description,
        dateTime,
        location: !isVendor ? location : null,
        address: !isVendor ? address : null,
        attachmentUrl,
        companyName: isVendor ? companyName : null,
        serviceAffected: isVendor ? serviceAffected : null,
        businessImpact: isVendor ? businessImpact : null,
        desiredResolution,
        followUp,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'complaints'), complaintData);
      
      // Refresh complaints list after submission
      fetchComplaints();
      
      resetForm();
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Error submitting complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setComplaintType('');
    setPriority('');
    setDescription('');
    setDateTime('');
    setLocation('');
    setAddress('');
    setAttachments(null);
    setCompanyName('');
    setServiceAffected('');
    setBusinessImpact('');
    setDesiredResolution('');
    setFollowUp('');
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
        <DocumentTextIcon className="h-6 w-6 text-green-500 inline mr-2" />
        Raise a Complaint
      </h2>
      
      <form onSubmit={handleSubmit}>
        {/* Complaint Subject */}
        <div className="mb-6">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            <DocumentTextIcon className="h-5 w-5 text-gray-500 inline mr-2" />
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 transition duration-200"
            placeholder="Enter the subject of your complaint"
            required
          />
        </div>

        {/* Complaint Type */}
        <div className="mb-6">
          <label htmlFor="complaintType" className="block text-sm font-medium text-gray-700">
            <DocumentTextIcon className="h-5 w-5 text-gray-500 inline mr-2" />
            Complaint Type
          </label>
          <select
            id="complaintType"
            value={complaintType}
            onChange={(e) => setComplaintType(e.target.value)}
            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 transition duration-200"
            required
          >
            <option value="">Select Type</option>
            <option value="Delivery Issue">Delivery Issue</option>
            <option value="E-Waste Collection Issue">E-Waste Collection Issue</option>
            <option value="Quality Issue">Quality Issue</option>
            <option value="Service Issue">Service Issue</option>
          </select>
        </div>

        {/* Priority */}
        <div className="mb-6">
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            <DocumentTextIcon className="h-5 w-5 text-gray-500 inline mr-2" />
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 transition duration-200"
            required
          >
            <option value="">Select Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            <DocumentTextIcon className="h-5 w-5 text-gray-500 inline mr-2" />
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 transition duration-200"
            placeholder="Describe the issue in detail"
            required
          />
        </div>

        {/* Date & Time */}
        <div className="mb-6">
          <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700">
            <CalendarIcon className="h-5 w-5 text-gray-500 inline mr-2" />
            Date and Time of Incident
          </label>
          <input
            id="dateTime"
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 transition duration-200"
            required
          />
        </div>

        {/* Location (Only for users) */}
        {!isVendor && (
          <>
            <div className="mb-6">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                <MapPinIcon className="h-5 w-5 text-gray-500 inline mr-2" />
                Location of Incident
              </label>
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 transition duration-200"
                required
              >
                <option value="">Select Location</option>
                <option value="Home">Home</option>
                <option value="Office">Office</option>
                <option value="Collection Center">Collection Center</option>
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                <MapPinIcon className="h-5 w-5 text-gray-500 inline mr-2" />
                Address/Location
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 transition duration-200"
                required
              />
            </div>
          </>
        )}

        {/* File Upload */}
        <div className="mb-6">
          <label htmlFor="attachments" className="block text-sm font-medium text-gray-700">
            <DocumentTextIcon className="h-5 w-5 text-gray-500 inline mr-2" />
            Attach Supporting Documents
          </label>
          <input
            id="attachments"
            type="file"
            onChange={(e) => setAttachments(e.target.files ? e.target.files[0] : null)}
            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 transition duration-200"
          />
        </div>

        {/* Vendor-Specific Fields */}
        {isVendor && (
          <>
            <div className="mb-6">
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                <DocumentTextIcon className="h-5 w-5 text-gray-500 inline mr-2" />
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 transition duration-200"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="serviceAffected" className="block text-sm font-medium text-gray-700">
                <DocumentTextIcon className="h-5 w-5 text-gray-500 inline mr-2" />
                Service Affected
              </label>
              <textarea
                id="serviceAffected"
                value={serviceAffected}
                onChange={(e) => setServiceAffected(e.target.value)}
                className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 transition duration-200"
                placeholder="What service is affected?"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="businessImpact" className="block text-sm font-medium text-gray-700">
                <DocumentTextIcon className="h-5 w-5 text-gray-500 inline mr-2" />
                Business Impact
              </label>
              <textarea
                id="businessImpact"
                value={businessImpact}
                onChange={(e) => setBusinessImpact(e.target.value)}
                className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 transition duration-200"
                placeholder="Describe the business impact"
                required
              />
            </div>
          </>
        )}

        {/* Desired Resolution */}
        <div className="mb-6">
          <label htmlFor="desiredResolution" className="block text-sm font-medium text-gray-700">
            <DocumentTextIcon className="h-5 w-5 text-gray-500 inline mr-2" />
            Desired Resolution
          </label>
          <textarea
            id="desiredResolution"
            value={desiredResolution}
            onChange={(e) => setDesiredResolution(e.target.value)}
            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 transition duration-200"
            placeholder="What would you like as a resolution?"
            required
          />
        </div>

        {/* Follow-Up */}
        <div className="mb-6">
          <label htmlFor="followUp" className="block text-sm font-medium text-gray-700">
            <DocumentTextIcon className="h-5 w-5 text-gray-500 inline mr-2" />
            Follow-Up
          </label>
          <input
            id="followUp"
            type="text"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 transition duration-200"
            placeholder="Any additional follow-up instructions?"
          />
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Complaint'
            )}
          </button>
        </div>
      </form>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Complaint Submitted Successfully!
              </h3>
              <p className="text-gray-600 mb-4">
                Your complaint has been received and will be processed shortly.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint History Section */}
      <div className="mt-8">
        <button
          onClick={() => setShowComplaintHistory(!showComplaintHistory)}
          className="mb-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition duration-200"
        >
          {showComplaintHistory ? 'Hide Complaint History' : 'Show Complaint History'}
        </button>

        {showComplaintHistory && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b">
              Your Complaint History
            </h3>
            
            {isLoadingComplaints ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : complaints.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complaints.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{complaint.subject}</div>
                          <div className="text-sm text-gray-500">{complaint.description.substring(0, 50)}...</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {complaint.complaintType}
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
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(complaint.dateTime).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No complaints found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintForm;



