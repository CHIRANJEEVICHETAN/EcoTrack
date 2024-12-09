import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, query, getDocs, collectionGroup, where } from 'firebase/firestore';

interface Submission {
  submissionId: string;
  createdAt: Date;
}

interface UserDetails {
  displayName: string | null;
  email: string;
}

export default function UserSubmissions() {
  const { userId } = useParams();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserSubmissions = async () => {
      try {
        // Fetch user details
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          setUserDetails({
            displayName: userData.displayName || null,
            email: userData.email
          });
        }

        // Fetch submissions
        const submissionsRef = collection(db, 'BlockChainSubmissionId', userId!, 'SubmissionID');
        const submissionsSnapshot = await getDocs(submissionsRef);
        
        const submissionsData: Submission[] = [];
        submissionsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.submissionId && data.createdAt) {
            submissionsData.push({
              submissionId: data.submissionId,
              createdAt: data.createdAt.toDate(),
            });
          }
        });

        // Sort submissions by creation date (newest first)
        submissionsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setError('Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserSubmissions();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">User Submissions</h2>
          {userDetails && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                {userDetails.displayName && (
                  <span className="font-medium">{userDetails.displayName} - </span>
                )}
                <span>{userDetails.email}</span>
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4">
          {submissions.length === 0 ? (
            <p className="text-gray-500">No submissions found for this user.</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.submissionId}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <Link
                    to={`/track-submission/${submission.submissionId}`}
                    className="block"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-blue-600 hover:text-blue-800 font-medium">
                          {submission.submissionId}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Submitted on: {submission.createdAt.toLocaleString()}
                        </p>
                      </div>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
