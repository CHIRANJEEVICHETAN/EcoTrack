import React, { useEffect, useState } from 'react';
import { UserCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

interface UserStats {
  itemsRecycled: number;
  environmentalImpact: string;
  recyclingPoints: number;
}

interface WasteItem {
  itemType: string;
  createdAt: Date;
  status: string;
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
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        const environmentalImpact = (totalItems * 0.02).toFixed(2);
        const recyclingPoints = totalItems * 20;

        setUserStats({
          itemsRecycled: totalItems,
          environmentalImpact: `${environmentalImpact} tons`,
          recyclingPoints: recyclingPoints,
        });

        // Sort by date and get recent items
        const sortedItems = wasteItems
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5);
        setRecentActivity(sortedItems);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data');
      }
      setLoading(false);
    };

    fetchUserData();
  }, [currentUser]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const storage = getStorage();
      const photoRef = ref(storage, `profile-photos/${currentUser?.uid}`);
      await uploadBytes(photoRef, file);
      const photoURL = await getDownloadURL(photoRef);
      await updateProfile(currentUser!, { photoURL });
      setSuccess('Profile photo updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo');
    }
    setUploading(false);
  };

  const handlePhotoDelete = async () => {
    if (!currentUser?.photoURL) return;

    try {
      const storage = getStorage();
      const photoRef = ref(storage, `profile-photos/${currentUser.uid}`);
      await deleteObject(photoRef);
      await updateProfile(currentUser, { photoURL: null });
      setSuccess('Profile photo removed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting photo:', error);
      setError('Failed to delete photo');
    }
  };

  const handleNameUpdate = async () => {
    if (!displayName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    try {
      await updateProfile(currentUser!, { displayName: displayName.trim() });
      setIsEditingName(false);
      setSuccess('Name updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating name:', error);
      setError('Failed to update name');
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center">
            <div className="relative">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="h-24 w-24 text-gray-400" />
              )}
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 bg-green-600 rounded-full p-2 cursor-pointer hover:bg-green-700"
              >
                <PencilIcon className="h-4 w-4 text-white" />
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <div className="ml-6 flex-1">
              <div className="flex items-center justify-between">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    />
                    <button
                      onClick={handleNameUpdate}
                      className="text-green-600 hover:text-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {currentUser?.displayName || currentUser?.email}
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </h2>
                )}
                {currentUser?.photoURL && (
                  <button
                    onClick={handlePhotoDelete}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Member since{' '}
                {currentUser?.metadata.creationTime
                  ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                  : 'Recently'}
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
                    <li key={index} className="py-3 flex justify-between">
                      <span>
                        Recycled {item.itemType} - {item.createdAt.toLocaleDateString()}
                      </span>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'In Progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {item.status}
                      </span>
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
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Items Recycled
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {userStats.itemsRecycled}
              </dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Environmental Impact
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {userStats.environmentalImpact}
              </dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Recycling Points
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {userStats.recyclingPoints}
              </dd>
            </div>
          </dl>
        </div>

        {/* Achievement Badges */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Achievements</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {userStats.itemsRecycled >= 5 && (
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-full inline-block">
                  <span className="text-2xl">🌱</span>
                </div>
                <p className="mt-2 text-sm font-medium">Eco Starter</p>
              </div>
            )}
            {userStats.itemsRecycled >= 10 && (
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-full inline-block">
                  <span className="text-2xl">🌿</span>
                </div>
                <p className="mt-2 text-sm font-medium">Green Warrior</p>
              </div>
            )}
            {userStats.recyclingPoints >= 200 && (
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-full inline-block">
                  <span className="text-2xl">🌍</span>
                </div>
                <p className="mt-2 text-sm font-medium">Earth Protector</p>
              </div>
            )}
            {userStats.itemsRecycled >= 20 && (
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-full inline-block">
                  <span className="text-2xl">⭐</span>
                </div>
                <p className="mt-2 text-sm font-medium">Recycling Star</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}