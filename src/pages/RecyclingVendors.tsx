import React from 'react';

interface Vendor {
  id: number;
  name: string;
  location: string;
  materials: string[];
  contact: string;
}

const vendors: Vendor[] = [
  {
    id: 1,
    name: "EcoRecycle Solutions",
    location: "123 Green Street, Eco City",
    materials: ["Computers", "Mobile Phones", "Batteries"],
    contact: "contact@ecosolutions.com"
  },
  {
    id: 2,
    name: "TechWaste Recyclers",
    location: "456 Sustainability Ave, Green Town",
    materials: ["Laptops", "Printers", "Monitors"],
    contact: "info@techwaste.com"
  }
];

export default function RecyclingVendors() {
  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Recycling Vendors</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{vendor.name}</h3>
            <p className="text-gray-600 mb-4">{vendor.location}</p>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Accepted Materials:</h4>
              <div className="flex flex-wrap gap-2">
                {vendor.materials.map((material) => (
                  <span
                    key={material}
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
    </div>
  );
}