import React, { useEffect, useState } from 'react';
import { UserCircleIcon, PencilIcon, CameraIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../config/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

interface UserStats {
  itemsRecycled: number;
  environmentalImpact: string;
  recyclingPoints: number;
  carbonSaved: number;
  treesEquivalent: number;
}

interface WasteItem {
  itemType: string;
  createdAt: Date;
  status: string;
  weight: number;
}

interface CarbonFootprint {
  itemType: string;
  weight: number;
  carbonSaved: number;
  energySaved: number;
  waterSaved: number;
  materialsSaved: string[];
}

interface TotalImpact {
  carbonSaved: number;
  energySaved: number;
  waterSaved: number;
}

const calculateEnvironmentalImpact = (itemType: string, weight: number): CarbonFootprint => {
  // AI-based coefficients for different e-waste types
  const impactFactors: { [key: string]: { 
    carbonPerKg: number,
    energyPerKg: number,
    waterPerKg: number,
    materials: string[]
  }} = {
    'Smartphone': {
      carbonPerKg: 70,  // kg CO2 per kg
      energyPerKg: 150, // kWh per kg
      waterPerKg: 1200, // liters per kg
      materials: ['Gold', 'Silver', 'Palladium', 'Copper']
    },
    'Laptop': {
      carbonPerKg: 350,
      energyPerKg: 200,
      waterPerKg: 1500,
      materials: ['Aluminum', 'Copper', 'Gold', 'Lithium']
    },
    'Television': {
      carbonPerKg: 120,
      energyPerKg: 100,
      waterPerKg: 800,
      materials: ['Glass', 'Plastic', 'Copper', 'Lead']
    },
    'default': {
      carbonPerKg: 100,
      energyPerKg: 120,
      waterPerKg: 1000,
      materials: ['Metal', 'Plastic']
    }
  };

  const factor = impactFactors[itemType] || impactFactors.default;
  
  return {
    itemType,
    weight,
    carbonSaved: weight * factor.carbonPerKg,
    energySaved: weight * factor.energyPerKg,
    waterSaved: weight * factor.waterPerKg,
    materialsSaved: factor.materials
  };
};

export default function UserProfile() {
  const { currentUser } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    itemsRecycled: 0,
    environmentalImpact: '0',
    recyclingPoints: 0,
    carbonSaved: 0,
    treesEquivalent: 0
  });
  const [recentActivity, setRecentActivity] = useState<WasteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [totalImpact, setTotalImpact] = useState<TotalImpact>({
    carbonSaved: 0,
    energySaved: 0,
    waterSaved: 0
  });
  const [impacts, setImpacts] = useState<CarbonFootprint[]>([]);

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

        // Calculate environmental impact using AI
        const calculatedImpacts = wasteItems.map(item => 
          calculateEnvironmentalImpact(item.itemType, Number(item.weight))
        );
        setImpacts(calculatedImpacts);

        const calculatedTotalImpact = calculatedImpacts.reduce((acc, impact) => ({
          carbonSaved: acc.carbonSaved + impact.carbonSaved,
          energySaved: acc.energySaved + impact.energySaved,
          waterSaved: acc.waterSaved + impact.waterSaved
        }), { carbonSaved: 0, energySaved: 0, waterSaved: 0 });
        
        setTotalImpact(calculatedTotalImpact);

        setUserStats({
          itemsRecycled: wasteItems.length,
          environmentalImpact: `${(calculatedTotalImpact.carbonSaved / 1000).toFixed(2)} tons`,
          recyclingPoints: Math.min(wasteItems.length * 20, 10000),
          carbonSaved: calculatedTotalImpact.carbonSaved,
          treesEquivalent: Math.floor(calculatedTotalImpact.carbonSaved / 20)
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
      const photoRef = ref(storage, `profile-photos/${currentUser?.uid}`);
      await uploadBytes(photoRef, file);
      const photoURL = await getDownloadURL(photoRef);
      await updateProfile(currentUser!, { photoURL });
      setSuccess('Profile photo updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      setShowPhotoOptions(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo');
    }
    setUploading(false);
  };

  const handlePhotoDelete = async () => {
    if (!currentUser?.photoURL) return;

    try {
      const photoRef = ref(storage, `profile-photos/${currentUser.uid}`);
      await deleteObject(photoRef);
      await updateProfile(currentUser, { photoURL: null });
      setSuccess('Profile photo removed successfully');
      setTimeout(() => setSuccess(''), 3000);
      setShowPhotoOptions(false);
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
            <div className="relative group">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover"
                  onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                />
              ) : (
                  <UserCircleIcon
                    className="h-24 w-24 text-gray-400 cursor-pointer"
                    onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                  />
              )}
              <button
                onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                className="absolute bottom-0 right-0 bg-green-600 rounded-full p-2 text-white hover:bg-green-700"
              >
                <CameraIcon className="h-4 w-4" />
              </button>

              {showPhotoOptions && (
                <div className="absolute mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <label className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                      Upload New Photo
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={uploading}
                      />
                    </label>
                    {currentUser?.photoURL && (
                      <button
                        onClick={handlePhotoDelete}
                        className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              )}
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
          <h3 className="text-lg font-medium text-gray-900">Environmental Impact</h3>
          <dl className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="px-4 py-5 bg-green-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-green-600 truncate">
                Carbon Saved
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-green-900">
                {userStats.carbonSaved} kg CO₂
              </dd>
            </div>
            <div className="px-4 py-5 bg-green-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-green-600 truncate">
                Trees Equivalent
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-green-900">
                {userStats.treesEquivalent} trees
              </dd>
            </div>
            <div className="px-4 py-5 bg-green-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-green-600 truncate">
                Recycling Points
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-green-900">
                {userStats.recyclingPoints}
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivity.map((item, index) => (
                <li key={index}>
                  <div className="relative pb-8">
                    {index !== recentActivity.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${item.status === 'Completed' ? 'bg-green-500' : 'bg-gray-400'
                          }`}>
                          <TrashIcon className="h-5 w-5 text-white" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Recycled <span className="font-medium text-gray-900">{item.itemType}</span>
                            {item.weight && ` (${item.weight} kg)`}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={item.createdAt.toISOString()}>
                            {item.createdAt.toLocaleDateString()}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Achievements</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {userStats.itemsRecycled >= 5 && (
              <div className="text-center transform hover:scale-105 transition-transform">
                <div className="bg-green-100 p-4 rounded-full inline-block">
                  <span className="text-2xl">🌱</span>
                </div>
                <p className="mt-2 text-sm font-medium">Eco Starter</p>
                <p className="text-xs text-gray-500">Recycled 5+ items</p>
              </div>
            )}
            {userStats.itemsRecycled >= 10 && (
              <div className="text-center transform hover:scale-105 transition-transform">
                <div className="bg-green-100 p-4 rounded-full inline-block">
                  <span className="text-2xl">🌿</span>
                </div>
                <p className="mt-2 text-sm font-medium">Green Warrior</p>
                <p className="text-xs text-gray-500">Recycled 10+ items</p>
              </div>
            )}
            {userStats.carbonSaved >= 100 && (
              <div className="text-center transform hover:scale-105 transition-transform">
                <div className="bg-green-100 p-4 rounded-full
inline-block">
                  <span className="text-2xl">🌍</span>
                </div>
                <p className="mt-2 text-sm font-medium">Earth Protector</p>
                <p className="text-xs text-gray-500">Saved 100+ kg CO₂</p>
              </div>
            )}
            {userStats.treesEquivalent >= 5 && (
              <div className="text-center transform hover:scale-105 transition-transform">
                <div className="bg-green-100 p-4 rounded-full inline-block">
                  <span className="text-2xl">🌳</span>
                </div>
                <p className="mt-2 text-sm font-medium">Forest Guardian</p>
                <p className="text-xs text-gray-500">Equivalent to 5+ trees</p>
              </div>
            )}
          </div>
        </div>

        {/* Recycling Goals */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recycling Goals</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-medium">
                <span>Monthly Recycling Goal</span>
                <span>{Math.min(userStats.itemsRecycled, 10)}/10 items</span>
              </div>
              <div className="mt-2 relative">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-green-100">
                  <div
                    style={{ width: `${Math.min((userStats.itemsRecycled / 10) * 100, 100)}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                  ></div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium">
                <span>Carbon Saving Goal</span>
                <span>{Math.min(userStats.carbonSaved, 200)}/200 kg CO₂</span>
              </div>
              <div className="mt-2 relative">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-green-100">
                  <div
                    style={{ width: `${Math.min((userStats.carbonSaved / 200) * 100, 100)}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Environmental Impact Visualization */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Detailed Environmental Impact</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Carbon Impact */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">🌍</span>
                <span className="text-sm font-medium text-green-800 bg-green-200 px-3 py-1 rounded-full">
                  Carbon Saved
                </span>
              </div>
              <div className="text-3xl font-bold text-green-900 mb-2">
                {(userStats.carbonSaved / 1000).toFixed(2)}
                <span className="text-lg font-normal ml-1">tons CO₂</span>
              </div>
              <p className="text-sm text-green-700">
                Equivalent to {userStats.treesEquivalent} trees planted
              </p>
            </div>

            {/* Energy Savings */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">⚡</span>
                <span className="text-sm font-medium text-blue-800 bg-blue-200 px-3 py-1 rounded-full">
                  Energy Saved
                </span>
              </div>
              <div className="text-3xl font-bold text-blue-900 mb-2">
                {(totalImpact.energySaved).toFixed(0)}
                <span className="text-lg font-normal ml-1">kWh</span>
              </div>
              <p className="text-sm text-blue-700">
                Powers a home for {Math.floor(totalImpact.energySaved / 30)} days
              </p>
            </div>

            {/* Water Conservation */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">💧</span>
                <span className="text-sm font-medium text-purple-800 bg-purple-200 px-3 py-1 rounded-full">
                  Water Saved
                </span>
              </div>
              <div className="text-3xl font-bold text-purple-900 mb-2">
                {(totalImpact.waterSaved / 1000).toFixed(1)}
                <span className="text-lg font-normal ml-1">m³</span>
              </div>
              <p className="text-sm text-purple-700">
                {Math.floor(totalImpact.waterSaved / 150)} showers worth of water
              </p>
            </div>
          </div>

          {/* Materials Recovered Visualization */}
          <div className="mt-8">
            <h4 className="text-md font-medium text-gray-900 mb-4">Materials Recovered</h4>
            <div className="flex flex-wrap gap-3">
              {Array.from(new Set(impacts.flatMap(i => i.materialsSaved))).map((material, index) => (
                <span
                  key={material}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    index % 4 === 0 ? 'bg-green-100 text-green-800' :
                    index % 4 === 1 ? 'bg-blue-100 text-blue-800' :
                    index % 4 === 2 ? 'bg-purple-100 text-purple-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {material}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
