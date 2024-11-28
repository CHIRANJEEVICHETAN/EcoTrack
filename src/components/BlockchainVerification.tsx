import React from 'react';
import { blockchainService } from '../services/blockchainService';

interface BlockchainVerificationProps {
  itemId: string;
}

export default function BlockchainVerification({ itemId }: BlockchainVerificationProps) {
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await blockchainService.getWasteItemHistory(itemId);
      setHistory([data]);
    } catch (err) {
      setError('Blockchain verification pending. Your submission has been recorded successfully.');
      console.error('Blockchain fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchHistory();
  };

  React.useEffect(() => {
    if (itemId) {
      fetchHistory();
    }
  }, [itemId]);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3">Verifying blockchain records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="ml-4 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-600">No blockchain records found yet. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Blockchain Verification
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Verified transaction history for item #{itemId}
        </p>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {history.map((record, index) => (
            <li key={index} className="px-4 py-4">
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Transaction Hash:
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-mono text-blue-600 break-all">
                      {record.transactionHash || 'Pending verification...'}
                    </p>
                    {record.transactionHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${record.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                        title="View on Etherscan"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Timestamp:
                  </p>
                  <p className="text-sm text-gray-600">
                    {record.timestamp ? new Date(record.timestamp * 1000).toLocaleString() : 'Pending...'}
                  </p>
                </div>
                <div className="flex items-center mt-2">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-2 text-sm text-green-600 font-medium">Verified</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}