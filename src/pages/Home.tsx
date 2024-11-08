import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-8">
          Welcome to EcoTrack
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">Items Recycled</div>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl font-bold text-green-600 mb-2">50+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl font-bold text-green-600 mb-2">10+</div>
              <div className="text-gray-600">Recycling Partners</div>
            </div>
          </div>
        </div>

        {!currentUser ? (
          <div className="bg-green-50 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-green-800 mb-4">
              Join Our E-Waste Management Initiative
            </h2>
            <p className="text-green-600 mb-6">
              Create an account to start tracking your e-waste recycling journey
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/signup"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                Sign Up Now
              </Link>
              <Link
                to="/login"
                className="bg-white text-green-600 px-6 py-3 rounded-lg border border-green-600 hover:bg-green-50"
              >
                Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-green-800 mb-4">
              Welcome Back, {currentUser.displayName || currentUser.email}!
            </h2>
            <div className="flex justify-center gap-4">
              <Link
                to="/track"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                Track New E-Waste
              </Link>
              <Link
                to="/reports"
                className="bg-white text-green-600 px-6 py-3 rounded-lg border border-green-600 hover:bg-green-50"
              >
                View Reports
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Track Your Impact</h3>
            <p className="text-gray-600 mb-4">
              Monitor your contribution to reducing e-waste and environmental protection.
            </p>
            <Link
              to="/track"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Start Tracking →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Find Recyclers</h3>
            <p className="text-gray-600 mb-4">
              Connect with certified recycling partners in your area for responsible disposal.
            </p>
            <Link
              to="/vendors"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              View Partners →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Environmental Impact</h3>
            <p className="text-gray-600 mb-4">
              See how your recycling efforts contribute to environmental preservation.
            </p>
            <Link
              to="/reports"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              View Impact →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">1</div>
              <div className="font-medium mb-2">Sign Up</div>
              <p className="text-gray-600 text-sm">Create your free account</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">2</div>
              <div className="font-medium mb-2">Log E-Waste</div>
              <p className="text-gray-600 text-sm">Record your electronic waste</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">3</div>
              <div className="font-medium mb-2">Find Recyclers</div>
              <p className="text-gray-600 text-sm">Locate certified partners</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">4</div>
              <div className="font-medium mb-2">Track Impact</div>
              <p className="text-gray-600 text-sm">Monitor your contribution</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}