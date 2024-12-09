import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function VendorSignup() {
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const email = state?.email || '';
  const [certificationText, setCertificationText] = useState('');
  const [achievementText, setAchievementText] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);

      // Add vendor details to Firestore
      await addDoc(collection(db, 'vendorRequests'), {
        email,
        businessName,
        businessAddress,
        certifications: certificationText,
        achievements: achievementText,
        status: 'pending',
        createdAt: new Date(),
      });

      navigate('/login', { 
        state: { 
          message: 'Your vendor application has been submitted. Please wait for admin approval before logging in.' 
        } 
      });
    } catch (err) {
      console.error('Vendor signup error:', err);
      setError('Failed to submit vendor information');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-400 to-blue-500">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg z-10">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Vendor Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join us and start your journey
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
              Business Name
            </label>
            <input
              id="businessName"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700">
              Business Address
            </label>
            <textarea
              id="businessAddress"
              required
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="certificationText" className="block text-sm font-medium text-gray-700">
              Certifications
            </label>
            <input
              id="certificationText"
              type="text"
              value={certificationText}
              onChange={(e) => setCertificationText(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="achievementText" className="block text-sm font-medium text-gray-700">
              Achievements
            </label>
            <input
              id="achievementText"
              type="text"
              value={achievementText}
              onChange={(e) => setAchievementText(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
