import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BlockchainVerification from '../components/BlockchainVerification';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';

export default function TrackSubmission() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submissionId, setSubmissionId] = useState(id || '');
    const [submission, setSubmission] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submissionId) return;

        setLoading(true);
        setError('');

        try {
            const docRef = doc(db, 'e-waste', submissionId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setSubmission({ id: docSnap.id, ...docSnap.data() });
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
        return `${window.location.origin}/track-submission/${id}`;
    };

    const handleCopyLink = async () => {
        const url = getTrackingUrl(submissionId);
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
        } catch (err) {
            console.error('Failed to copy:', err);
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
        </div>
    );
}