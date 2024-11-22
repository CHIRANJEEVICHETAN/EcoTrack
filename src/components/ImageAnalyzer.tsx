import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { analyzeWasteImage } from '../services/aiService';

interface ImageAnalyzerProps {
  onAnalysisComplete: (analysis: string) => void;
}

export default function ImageAnalyzer({ onAnalysisComplete }: ImageAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setAnalyzing(true);
    setError(null);

    try {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;
          const analysis = await analyzeWasteImage(base64Image);
          onAnalysisComplete(analysis);
        } catch (err) {
          setError('Failed to analyze image. Please try again.');
        } finally {
          setAnalyzing(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image. Please try again.');
      setAnalyzing(false);
    }
  }, [onAnalysisComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1
  });

  return (
    <div className="mt-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-500'}
        `}
      >
        <input {...getInputProps()} />
        {analyzing ? (
          <div className="text-gray-600">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing image...
          </div>
        ) : (
          <div>
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-1">Drag and drop an image here, or click to select</p>
            <p className="text-sm text-gray-500">PNG, JPG, JPEG up to 10MB</p>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}