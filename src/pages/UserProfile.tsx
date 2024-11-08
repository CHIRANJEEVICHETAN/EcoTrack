import React from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function UserProfile() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow-md rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center">
            <UserCircleIcon className="h-16 w-16 text-gray-400" />
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">John Doe</h2>
              <p className="text-sm text-gray-500">Joined January 2023</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">john.doe@example.com</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900">San Francisco, CA</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Recent Activity</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <ul className="divide-y divide-gray-200">
                  <li className="py-3">Recycled 2 laptops - August 15, 2023</li>
                  <li className="py-3">Recycled 3 mobile phones - August 10, 2023</li>
                  <li className="py-3">Recycled 1 printer - August 5, 2023</li>
                </ul>
              </dd>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Recycling Statistics</h3>
          <dl className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Items Recycled</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">24</dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Environmental Impact</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">0.5 tons</dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Recycling Points</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">450</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}