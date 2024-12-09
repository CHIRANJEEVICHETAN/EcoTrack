import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase'; // Ensure Firestore is correctly configured
import { collection, getDocs } from 'firebase/firestore';
import { addDoc } from 'firebase/firestore';

export default function Feedback() {
  const [vendors, setVendors] = useState<string[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Fetch vendor names from Firestore
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const vendorCollection = collection(db, 'vendors');
        const vendorSnapshot = await getDocs(vendorCollection);
        const vendorList = vendorSnapshot.docs.map((doc) => doc.data().name); // Retrieve 'name' field from each vendor document
        setVendors(vendorList);
        if (vendorList.length > 0) {
          setSelectedVendor(vendorList[0]); // Default to the first vendor in the list
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    };
    fetchVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) {
      alert('Please select a vendor.');
      return;
    }

    try {
      // Submit the feedback (you can modify this to save feedback in Firestore or another service)
      console.log('Submitting feedback for vendor:', selectedVendor);
      console.log('Feedback:', feedback);

      // Assuming feedback is stored to Firestore
      await addDoc(collection(db, 'feedback'), {
        vendor: selectedVendor,
        feedback,
        timestamp: new Date(),
      });

      // Set state after submission
      setSubmitted(true);
      setFeedback(''); // Clear the feedback input
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-green-600 mb-4 text-center">
        Provide Feedback for a Vendor
      </h2>
      {submitted ? (
        <div className="text-center">
          <p className="text-green-700 text-lg font-medium">
            Thank you for your feedback!
          </p>
          <button
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
            onClick={() => setSubmitted(false)}
          >
            Submit More Feedback
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Vendor Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="vendor">
              Select Vendor
            </label>
            <select
              id="vendor"
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-green-600"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              required
            >
              {vendors.map((vendor) => (
                <option key={vendor} value={vendor}>
                  {vendor}
                </option>
              ))}
            </select>
          </div>

          {/* Feedback Box */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="feedback">
              Your Feedback
            </label>
            <textarea
              id="feedback"
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-green-600"
              rows={5}
              placeholder="Share your feedback about the vendor..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            Submit Feedback
          </button>
        </form>
      )}
    </div>
  );
}






