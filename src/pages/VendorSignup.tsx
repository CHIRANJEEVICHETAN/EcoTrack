import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { DocumentPlusIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface UploadedFile {
  file: File;
  name: string;
  type: 'certification' | 'achievement';
}

export default function VendorSignup() {
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const email = state?.email || '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'certification' | 'achievement') => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).filter(file => {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size should not exceed 5MB');
        return false;
      }
      return true;
    });

    if (uploadedFiles.length + newFiles.length > 5) {
      setError('Maximum 5 documents can be uploaded');
      return;
    }

    const newUploadedFiles: UploadedFile[] = newFiles.map(file => ({
      file,
      name: file.name,
      type
    }));

    setUploadedFiles([...uploadedFiles, ...newUploadedFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  async function uploadFile(file: File, type: string): Promise<string> {
    const storageRef = ref(storage, `vendor-documents/${email}/${type}/${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (uploadedFiles.length === 0) {
      setError('Please upload at least one document');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Upload all files and get their URLs
      const uploadPromises = uploadedFiles.map(file => 
        uploadFile(file.file, file.type)
      );

      const uploadedUrls = await Promise.all(uploadPromises);

      const documents = uploadedFiles.map((file, index) => ({
        name: file.name,
        type: file.type,
        url: uploadedUrls[index]
      }));

      // Add vendor details to Firestore
      await addDoc(collection(db, 'vendorRequests'), {
        email,
        businessName,
        businessAddress,
        documents,
        status: 'pending',
        createdAt: new Date(),
      });

      navigate('/login', { 
        state: { 
          message: 'Your vendor application has been submitted. Please wait for admin approval before logging in.' 
        } 
      });
    } catch (err) {
      console.error('Vendor signup error:', err);
      setError('Failed to submit vendor information');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Vendor Registration
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700">
                Business Address
              </label>
              <textarea
                id="businessAddress"
                required
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documents (PDF only, max 5 files, 5MB each)
              </label>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Certifications</label>
                  <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e, 'certification')}
                    className="hidden"
                    multiple
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <DocumentPlusIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Upload Certification
                  </button>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Achievements</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, 'achievement')}
                    className="hidden"
                    multiple
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <DocumentPlusIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Upload Achievement
                  </button>
                </div>
              </div>

              {/* Display uploaded files */}
              <div className="mt-4 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <DocumentPlusIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{file.name}</span>
                      <span className="ml-2 text-xs text-gray-500">({file.type})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
