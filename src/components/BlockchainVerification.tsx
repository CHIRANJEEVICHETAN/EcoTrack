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
      setHistory(data);
    } catch (err) {
      setError('Failed to fetch blockchain history');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (itemId) {
      fetchHistory();
    }
  }, [itemId]);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-50 p-4 rounded-lg">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600">{error}</p>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Transaction Hash: {record.transactionHash}
                  </p>
                  <p className="text-sm text-gray-500">
                    Timestamp: {new Date(record.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Verified
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}