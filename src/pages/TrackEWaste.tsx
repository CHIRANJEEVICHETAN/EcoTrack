import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { getRecyclingRecommendations } from '../services/aiService';
import { blockchainService } from '../services/blockchainService';
import AIRecommendations from "../components/AIRecommendation";
import ImageAnalyzer from '../components/ImageAnalyzer';
import BlockchainVerification from '../components/BlockchainVerification';

interface FormData {
  itemType: string;
  brand: string;
  model: string;
  weight: string;
  condition: string;
  location: string;
  description: string;
  imageAnalysis?: string; // Added to store image analysis results
}

const initialFormData: FormData = {
  itemType: 'Computer/Laptop',
  brand: '',
  model: '',
  weight: '',
  condition: 'Working',
  location: '',
  description: '',
  imageAnalysis: '' // Initialize the new field
};

export default function TrackEWaste() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submittedItemId, setSubmittedItemId] = useState<string | null>(null);

  const handleImageAnalysis = (analysis: string) => {
    // Update the form data with the image analysis results
    setFormData(prev => ({
      ...prev,
      imageAnalysis: analysis,
      // Optionally update description with analysis results
      description: prev.description ? `${prev.description}\n\nImage Analysis:\n${analysis}` : analysis
    }));
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
      // Add to Firestore with image analysis
      const docRef = await addDoc(collection(db, 'e-waste'), {
        ...formData,
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        status: 'Pending',
        createdAt: serverTimestamp()
      });

      // Record on Blockchain
      await blockchainService.recordWasteItem({
        id: docRef.id,
        itemType: formData.itemType,
        weight: parseFloat(formData.weight),
        timestamp: Date.now(),
        userId: currentUser?.uid || ''
      });

      setSubmittedItemId(docRef.id);
      setSuccess(true);
      setFormData(initialFormData);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting e-waste:', error);
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
      <h2 className="text-3xl font-bold text-gray-900 mb-8">{t('track.title')}</h2>
      
      {success && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
          {t('track.successMessage')}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6">
        <ImageAnalyzer onAnalysisComplete={handleImageAnalysis} />

        {formData.imageAnalysis && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Image Analysis Results
            </h3>
            <p className="text-blue-600">{formData.imageAnalysis}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="itemType" className="block text-sm font-medium text-gray-700">
                {t('track.itemType')} *
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
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                Weight (kg) *
              </label>
              <input
                type="number"
                name="weight"
                id="weight"
                step="0.1"
                value={formData.weight}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              />
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
            <div>
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
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? t('track.submitting') : t('track.submit')}
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