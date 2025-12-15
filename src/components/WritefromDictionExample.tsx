'use client';

import { useState, useEffect } from 'react';
import { 
  getWritefromDictionItems, 
  getRandomWritefromDictionItem, 
  subscribeToWritefromDiction,
  WritefromDictionItem 
} from '../lib/writefromdiction';

/**
 * Example component demonstrating how to use writefromdiction functions
 */
export default function WritefromDictionExample() {
  const [items, setItems] = useState<WritefromDictionItem[]>([]);
  const [randomItem, setRandomItem] = useState<WritefromDictionItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Example 1: Fetch all items on component mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getWritefromDictionItems();
        setItems(data);
      } catch (err) {
        setError('Failed to fetch writefromdiction items');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Example 2: Subscribe to real-time updates (optional)
  useEffect(() => {
    const unsubscribe = subscribeToWritefromDiction((updatedItems) => {
      setItems(updatedItems);
      console.log('Real-time update received:', updatedItems.length, 'items');
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Example 3: Get a random item
  const handleGetRandomItem = async () => {
    try {
      setLoading(true);
      setError(null);
      const item = await getRandomWritefromDictionItem();
      setRandomItem(item);
    } catch (err) {
      setError('Failed to get random item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#fc5d01' }}>
        Write from Dictation Example
      </h1>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#fc5d01' }}></div>
          <p className="mt-2">Loading...</p>
        </div>
      )}

      {/* Random Item Section */}
      <div className="mb-8 p-4 border rounded-lg" style={{ borderColor: '#fdbc94' }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: '#fd7f33' }}>
          Random Item
        </h2>
        <button
          onClick={handleGetRandomItem}
          disabled={loading}
          className="px-4 py-2 rounded text-white font-medium disabled:opacity-50"
          style={{ backgroundColor: '#fc5d01' }}
        >
          Get Random Item
        </button>
        {randomItem && (
          <div className="mt-4 p-4 rounded" style={{ backgroundColor: '#fedac2' }}>
            <p className="font-semibold">ID: {randomItem.id}</p>
            {randomItem.text && <p className="mt-2">Text: {randomItem.text}</p>}
            {randomItem.content && <p className="mt-2">Content: {randomItem.content}</p>}
            {randomItem.audio && (
              <div className="mt-2">
                <p className="font-medium">Audio voices available:</p>
                <ul className="list-disc list-inside text-sm">
                  {Object.entries(randomItem.audio).map(([voice, url]) => (
                    <li key={voice}>{voice}: {url ? '✅' : '❌'}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* All Items Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4" style={{ color: '#fd7f33' }}>
          All Items ({items.length})
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-lg border"
              style={{ 
                backgroundColor: '#ffffff',
                borderColor: '#ffac7b'
              }}
            >
              <p className="font-semibold text-sm mb-2" style={{ color: '#fd7f33' }}>
                {item.id}
              </p>
              {item.text && (
                <p className="text-sm text-gray-700 line-clamp-3">
                  {item.text}
                </p>
              )}
              {item.content && (
                <p className="text-sm text-gray-700 line-clamp-3">
                  {item.content}
                </p>
              )}
              {item.audio && (
                <p className="text-xs text-gray-500 mt-2">
                  🔊 Audio: {Object.keys(item.audio).join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
