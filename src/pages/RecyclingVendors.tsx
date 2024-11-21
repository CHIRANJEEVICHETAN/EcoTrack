import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Vendor {
  id: string;
  name: string;
  location: string;
  materials: string[];
  contact: string;
  purityRates?: {
    [key: string]: number;
  };
  resourceUsage?: {
    electricity: number;
    water: number;
    labor: number;
  };
}

interface ProcessingData {
  materialType: string;
  quantity: number;
  purityRate: number;
  electricity: number;
  water: number;
  labor: number;
}

export default function RecyclingVendors() {
  const { currentUser } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProcessingForm, setShowProcessingForm] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [processingData, setProcessingData] = useState<ProcessingData>({
    materialType: '',
    quantity: 0,
    purityRate: 0,
    electricity: 0,
    water: 0,
    labor: 0,
  });

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const vendorsQuery = query(collection(db, 'vendors'));
        const snapshot = await getDocs(vendorsQuery);
        const vendorsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Vendor[];
        setVendors(vendorsList);
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
      setLoading(false);
    };

    fetchVendors();
  }, []);

  const handleProcessingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;

    try {
      // Add processing record
      await addDoc(collection(db, 'recycleData'), {
        vendorId: selectedVendor,
        ...processingData,
        timestamp: new Date(),
      });

      // Update vendor's purity rates and resource usage
      const vendorRef = doc(db, 'vendors', selectedVendor);
      const vendor = vendors.find(v => v.id === selectedVendor);

      if (vendor) {
        const updatedPurityRates = {
          ...vendor.purityRates,
          [processingData.materialType]: processingData.purityRate,
        };

        const updatedResourceUsage = {
          electricity: (vendor.resourceUsage?.electricity || 0) + processingData.electricity,
          water: (vendor.resourceUsage?.water || 0) + processingData.water,
          labor: (vendor.resourceUsage?.labor || 0) + processingData.labor,
        };

        await updateDoc(vendorRef, {
          purityRates: updatedPurityRates,
          resourceUsage: updatedResourceUsage,
        });

        // Update local state
        setVendors(vendors.map(v =>
          v.id === selectedVendor
            ? { ...v, purityRates: updatedPurityRates, resourceUsage: updatedResourceUsage }
            : v
        ));
      }

      // Reset form
      setProcessingData({
        materialType: '',
        quantity: 0,
        purityRate: 0,
        electricity: 0,
        water: 0,
        labor: 0,
      });
      setShowProcessingForm(false);
    } catch (error) {
      console.error('Error submitting processing data:', error);
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Recycling Vendors</h2>
        {currentUser?.email?.endsWith('@vendor.ecotrack.com') && (
          <button
            onClick={() => setShowProcessingForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Submit Processing Data
          </button>
        )}
      </div>

      {showProcessingForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Submit Processing Data</h3>
            <form onSubmit={handleProcessingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vendor</label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Material Type</label>
                <input
                  type="text"
                  value={processingData.materialType}
                  onChange={(e) => setProcessingData({ ...processingData, materialType: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity (kg)</label>
                <input
                  type="number"
                  value={processingData.quantity}
                  onChange={(e) => setProcessingData({ ...processingData, quantity: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Purity Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={processingData.purityRate}
                  onChange={(e) => setProcessingData({ ...processingData, purityRate: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Electricity Used (kWh)</label>
                <input
                  type="number"
                  value={processingData.electricity}
                  onChange={(e) => setProcessingData({ ...processingData, electricity: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Water Used (liters)</label>
                <input
                  type="number"
                  value={processingData.water}
                  onChange={(e) => setProcessingData({ ...processingData, water: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Labor Hours</label>
                <input
                  type="number"
                  value={processingData.labor}
                  onChange={(e) => setProcessingData({ ...processingData, labor: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowProcessingForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{vendor.name}</h3>
            <p className="text-gray-600 mb-4">{vendor.location}</p>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Accepted Materials:</h4>
              <div className="flex flex-wrap gap-2">
                {vendor.materials.map((material, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {material}
                  </span>
                ))}
              </div>
            </div>

            {vendor.purityRates && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Material Purity Rates:</h4>
                <div className="space-y-2">
                  {Object.entries(vendor.purityRates).map(([material, rate]) => (
                    <div key={material} className="flex justify-between text-sm">
                      <span className="text-gray-600">{material}:</span>
                      <span className="font-medium">{rate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vendor.resourceUsage && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Resource Usage:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Electricity:</span>
                    <span className="font-medium">{vendor.resourceUsage.electricity} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Water:</span>
                    <span className="font-medium">{vendor.resourceUsage.water} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Labor:</span>
                    <span className="font-medium">{vendor.resourceUsage.labor} hrs</span>
                  </div>
                </div>
              </div>
            )}

            <a
              href={`mailto:${vendor.contact}`}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Contact Vendor
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}