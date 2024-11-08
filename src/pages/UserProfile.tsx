import React, { useEffect, useState } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';

interface UserStats {
  itemsRecycled: number;
  environmentalImpact: string;
  recyclingPoints: number;
}

interface WasteItem extends DocumentData {
  itemType: string;
  createdAt: Date;
}

export default function UserProfile() {
  const { currentUser } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    itemsRecycled: 0,
    environmentalImpact: '0',
    recyclingPoints: 0,
  });
  const [recentActivity, setRecentActivity] = useState<WasteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        const wasteQuery = query(
          collection(db, 'e-waste'),
          where('userId', '==', currentUser.uid)
        );
        const wasteSnapshot = await getDocs(wasteQuery);
        const wasteItems = wasteSnapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        })) as WasteItem[];

        // Calculate stats
        const totalItems = wasteItems.length;
        const environmentalImpact = (totalItems * 0.02).toFixed(2); // Simplified calculation
        const recyclingPoints = totalItems * 20;

        setUserStats({
          itemsRecycled: totalItems,
          environmentalImpact: `${environmentalImpact} tons`,
          recyclingPoints: recyclingPoints,
        });

        // Sort by date and get recent items
        const sortedItems = wasteItems.sort((a, b) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        ).slice(0, 5);
        setRecentActivity(sortedItems);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
      setLoading(false);
    };

    fetchUserData();
  }, [currentUser]);

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow-md rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <UserCircleIcon className="h-16 w-16 text-gray-400" />
            )}
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentUser?.displayName || currentUser?.email}
              </h2>
              <p className="text-sm text-gray-500">
                Joined {currentUser?.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'Recently'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{currentUser?.email}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Recent Activity</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <ul className="divide-y divide-gray-200">
                  {recentActivity.map((item, index) => (
                    <li key={index} className="py-3">
                      Recycled {item.itemType} - {item.createdAt.toLocaleDateString()}
                    </li>
                  ))}
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
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{userStats.itemsRecycled}</dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Environmental Impact</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{userStats.environmentalImpact}</dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Recycling Points</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{userStats.recyclingPoints}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}