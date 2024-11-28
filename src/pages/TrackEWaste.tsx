import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getRecyclingRecommendations } from '../services/aiService';
import { blockchainService } from '../services/blockchainService';
import AIRecommendations from "../components/AIRecommendation";
import ImageAnalyzer from '../components/ImageAnalyzer';
import BlockchainVerification from '../components/BlockchainVerification';
import { Link } from 'react-router-dom';

interface FormData {
  itemType: string;
  brand: string;
  model: string;
  weight: string;
  condition: string;
  location: string;
  description: string;
  imageAnalysis?: string;
  imageUrl?: string;
}

const initialFormData: FormData = {
  itemType: 'Computer/Laptop',
  brand: '',
  model: '',
  weight: '',
  condition: 'Working',
  location: '',
  description: '',
  imageAnalysis: '',
  imageUrl: ''
};

export default function TrackEWaste() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submittedItemId, setSubmittedItemId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageAnalysis = (analysis: string, imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      imageAnalysis: analysis,
      imageUrl: imageUrl,
      description: prev.description ? `${prev.description}\n\nImage Analysis:\n${analysis}` : analysis
    }));
    setSelectedImage(imageUrl);
  };

  useEffect(() => {
    const getAIRecommendations = async () => {
      if (formData.itemType && formData.condition) {
        setAiLoading(true);
        try {
          const recommendations = await getRecyclingRecommendations(
            formData.itemType,
            formData.condition,
            formData.description
          );
          setAiRecommendations(recommendations);
        } catch (error) {
          console.error('Error getting AI recommendations:', error);
        }
        setAiLoading(false);
      }
    };

    getAIRecommendations();
  }, [formData.itemType, formData.condition, formData.description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'e-waste'), {
        ...formData,
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        status: 'Pending',
        createdAt: serverTimestamp(),
        imageUrl: formData.imageUrl || null
      });

      // Try blockchain recording separately
      try {
        await blockchainService.recordWasteItem({
          id: docRef.id,
          itemType: formData.itemType,
          weight: parseFloat(formData.weight),
          timestamp: Date.now(),
          userId: currentUser?.uid || ''
        });
      } catch (blockchainError) {
        console.error('Blockchain recording failed:', blockchainError);
      }

      setSubmittedItemId(docRef.id);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        setFormData(initialFormData);
        setSelectedImage(null);
        setSuccess(false);
      }, 5000);

    } catch (error) {
      console.error('Error submitting to Firestore:', error);
      alert('Error saving your submission. Please try again.');
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Track E-Waste</h2>
      
      {success && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center justify-between sticky top-0 z-50">
          <div>
            <span className="text-lg font-medium">E-waste item submitted successfully!</span>
            <div className="mt-2">
              <Link
                to={`/track-submission/${submittedItemId}`}
                className="text-green-600 hover:text-green-800 underline"
              >
                Track your submission
              </Link>
            </div>
          </div>
          <svg className="h-6 w-6 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6">
        <ImageAnalyzer onAnalysisComplete={handleImageAnalysis} />

        {selectedImage && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Image:</h4>
            <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={selectedImage}
                alt="Uploaded e-waste"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {formData.imageAnalysis && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Image Analysis Results
            </h3>
            <p className="text-blue-600 whitespace-pre-line">{formData.imageAnalysis}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="itemType" className="block text-sm font-medium text-gray-700">
                Item Type *
              </label>
              <select
                id="itemType"
                name="itemType"
                value={formData.itemType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              >
                <option>Computer/Laptop</option>
                <option>Mobile Phone</option>
                <option>Tablet</option>
                <option>Printer</option>
                <option>Monitor</option>
                <option>Television</option>
                <option>Gaming Console</option>
                <option>Other Electronics</option>
              </select>
            </div>

            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                Condition *
              </label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              >
                <option>Working</option>
                <option>Not Working</option>
                <option>Partially Working</option>
                <option>Damaged</option>
              </select>
            </div>
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                id="brand"
                value={formData.brand}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                Model
              </label>
              <input
                type="text"
                name="model"
                id="model"
                value={formData.model}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (isNaN(value) || value < 0 || value > 1000) {
                    return; // Don't update if invalid
                  }
                  setFormData({ ...formData, weight: e.target.value });
                }}
                min="0"
                max="1000"
                step="0.1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">Maximum weight: 1000 kg</p>
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Drop-off Location *
              </label>
              <input
                type="text"
                name="location"
                id="location"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Additional Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="Any additional details about the item..."
              />
            </div>
          </div>

          <AIRecommendations
            recommendations={aiRecommendations}
            loading={aiLoading}
          />

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </div>
              ) : (
                  'Submit E-Waste'
              )}
            </button>
          </div>
        </form>
      </div>

      {submittedItemId && (
        <div className="mt-6">
          <BlockchainVerification itemId={submittedItemId} />
        </div>
      )}
    </div>
  );
}