import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BlockchainVerification from '../components/BlockchainVerification';
import { db } from '../config/firebase';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';

interface PickupRequest {
  userName: string;
  location: string;
  contact: string;
  items: string;
  status: 'pending';
  pickupDate: any;
  vendorId: string;
  userId: string;
  createdAt: any;
}

interface SubmissionData {
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

interface SuccessPopupProps {
  message: string;
  onClose: () => void;
}

const SuccessPopup: React.FC<SuccessPopupProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 relative animate-fade-in-up">
        <div className="flex flex-col items-center text-center">
          <div className="bg-green-100 rounded-full p-3 mb-4">
            <svg 
              className="w-8 h-8 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Success!
          </h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={onClose}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TrackSubmission() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submissionId, setSubmissionId] = useState(id || '');
    const [submission, setSubmission] = useState<SubmissionData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const { currentUser } = useAuth();
    const [isRequestingPickup, setIsRequestingPickup] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submissionId) return;

        setLoading(true);
        setError('');

        try {
            // Fetch e-waste submission
            const docRef = doc(db, 'e-waste', submissionId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const ewasteData = docSnap.data();
                let submissionData: SubmissionData = { 
                    id: docSnap.id, 
                    ...ewasteData,
                    itemType: ewasteData.itemType || '',
                    status: ewasteData.status || '',
                    location: ewasteData.location || '',
                    weight: ewasteData.weight || '',
                    brand: ewasteData.brand || '',
                    model: ewasteData.model || '',
                    createdAt: ewasteData.createdAt
                };

                // If pickup is requested, fetch pickup details
                if (ewasteData.pickupId) {
                    const pickupRef = doc(db, 'pickups', ewasteData.pickupId);
                    const pickupSnap = await getDoc(pickupRef);
                    
                    if (pickupSnap.exists()) {
                        const pickupData = pickupSnap.data();
                        
                        // Add arrival date to submission data
                        submissionData = {
                            ...submissionData,
                            pickupRequested: true,
                            pickupId: ewasteData.pickupId,
                            arrivalDate: pickupData.arrivalDate || null
                        };
                        
                        // If vendor is assigned, fetch vendor details
                        if (pickupData.vendorId) {
                            const vendorRef = doc(db, 'vendors', pickupData.vendorId);
                            const vendorSnap = await getDoc(vendorRef);
                            
                            if (vendorSnap.exists()) {
                                submissionData = {
                                    ...submissionData,
                                    vendorAssigned: true,
                                    vendorName: vendorSnap.data().name,
                                    pickupStatus: pickupData.status,
                                    assignedAt: pickupData.assignedAt,
                                    arrivalDate: pickupData.arrivalDate
                                };
                            }
                        }
                    }
                }

                setSubmission(submissionData);
                navigate(`/track-submission/${submissionId}`);
            } else {
                setError('No submission found with this ID');
            }
        } catch (err) {
            console.error('Error fetching submission:', err);
            setError('Error fetching submission details');
        } finally {
            setLoading(false);
        }
    };

    const getTrackingUrl = (id: string) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/track-submission/${id}`;
    };

    const handleCopyLink = async () => {
        const url = getTrackingUrl(submissionId);
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleRequestPickup = async () => {
        if (!currentUser || !submission) return;
        
        setIsRequestingPickup(true);
        try {
            const pickupData: PickupRequest = {
                userName: currentUser.displayName || currentUser.email || 'Anonymous',
                location: submission.location,
                contact: currentUser.email || '',
                items: `${submission.itemType} - ${submission.brand} ${submission.model}`,
                status: 'pending',
                pickupDate: serverTimestamp(),
                vendorId: '',
                userId: currentUser.uid,
                createdAt: serverTimestamp()
            };

            // Create pickup request
            const docRef = await addDoc(collection(db, 'pickups'), pickupData);
            
            // Update original submission
            await updateDoc(doc(db, 'e-waste', submission.id), {
                pickupRequested: true,
                pickupId: docRef.id
            });

            // Update local state
            setSubmission(prev => ({
                ...prev,
                pickupRequested: true,
                pickupId: docRef.id
            }));

            alert('Pickup requested successfully! We will assign a vendor soon.');
        } catch (error) {
            console.error('Error requesting pickup:', error);
            alert('Failed to request pickup. Please try again.');
        } finally {
            setIsRequestingPickup(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6">Track Submission</h2>

            <form onSubmit={handleTrack} className="mb-8">
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={submissionId}
                        onChange={(e) => setSubmissionId(e.target.value)}
                        placeholder="Enter submission ID"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        {loading ? 'Tracking...' : 'Track'}
                    </button>
                </div>
                {error && (
                    <p className="mt-2 text-red-600 text-sm">{error}</p>
                )}
            </form>

            {submission && (
                <div className="space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-4">Submission Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Item Type</p>
                                <p className="font-medium">{submission.itemType}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <p className="font-medium">{submission.status}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Weight</p>
                                <p className="font-medium">{submission.weight} kg</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Location</p>
                                <p className="font-medium">{submission.location}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Submitted On</p>
                                <p className="font-medium">
                                    {submission.createdAt?.toDate().toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-4">Pickup Service</h3>
                        
                        {submission.status === 'Pending' && !submission.pickupRequested && (
                            <button
                                onClick={handleRequestPickup}
                                disabled={isRequestingPickup}
                                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {isRequestingPickup ? 'Requesting Pickup...' : 'Request Pickup'}
                            </button>
                        )}
                        
                        {submission.pickupRequested && (
                            <div className="bg-blue-50 p-4 rounded-md">
                                {!submission.vendorAssigned ? (
                                    <p className="text-blue-700">
                                        Pickup requested! We will assign a vendor soon.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-blue-700 font-medium">Pickup Status</p>
                                            <span className={`px-3 py-1 rounded-full text-sm ${
                                                submission.pickupStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                submission.pickupStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                submission.pickupStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {submission.pickupStatus?.charAt(0).toUpperCase() + submission.pickupStatus?.slice(1) || 'Pending'}
                                            </span>
                                        </div>
                                        <div className="text-blue-700">
                                            <p><span className="font-medium">Assigned Vendor:</span> {submission.vendorName}</p>
                                            {submission.assignedAt && (
                                                <p className="text-sm">
                                                    <span className="font-medium">Assigned on:</span>{' '}
                                                    {submission.assignedAt.toDate().toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        {submission.pickupRequested && submission.vendorAssigned && (
                                            <div className="mt-2">
                                                <span className="text-sm font-medium text-gray-500 block mb-1">Expected Arrival:</span>
                                                <span className="text-sm text-gray-900">
                                                    {submission.arrivalDate 
                                                        ? new Date(submission.arrivalDate).toLocaleDateString() 
                                                        : 'Not scheduled yet'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-medium">Track This Submission</h3>
                            <button
                                onClick={handleCopyLink}
                                className="flex items-center text-sm text-green-600 hover:text-green-700"
                            >
                                {copied ? (
                                    <span className="flex items-center">
                                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied!
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                        Copy Link
                                    </span>
                                )}
                            </button>
                        </div>
                        <div className="flex justify-center items-center">
                            <QRCodeSVG
                                value={getTrackingUrl(submissionId)}
                                size={200}
                                level="H"
                                includeMargin={true}
                                className="border p-2 rounded"
                            />
                        </div>
                        <p className="text-center mt-4 text-sm text-gray-500">
                            Scan this QR code to track this submission
                        </p>
                    </div>

                    <BlockchainVerification itemId={submissionId} />
                </div>
            )}

            {showSuccessPopup && (
                <SuccessPopup
                    message={successMessage}
                    onClose={() => setShowSuccessPopup(false)}
                />
            )}
        </div>
    );
}