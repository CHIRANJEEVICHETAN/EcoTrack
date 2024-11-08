import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Vendor {
  id: string;
  name: string;
  location: string;
  materials: string[];
  contact: string;
}

export default function RecyclingVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Recycling Vendors</h2>
      {vendors.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">No recycling vendors available at the moment.</p>
        </div>
      ) : (
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
              <a
                href={`mailto:${vendor.contact}`}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Contact Vendor
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}