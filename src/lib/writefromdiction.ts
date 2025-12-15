import { collection, query, where, getDocs, DocumentData, onSnapshot, QuerySnapshot } from 'firebase/firestore';
import { secondaryDb } from './firebase';

// Interface for WritefromDiction data
export interface WritefromDictionItem {
  id: string;
  text?: string; // Field name is "text" not "content"
  audio?: {
    Brian?: string;
    Joanna?: string;
    Olivia?: string;
    [key: string]: string | undefined;
  };
  isHidden?: boolean;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any; // Allow for additional fields
}

/**
 * Fetch all writefromdiction items where isHidden is false
 * Items with Brian audio are prioritized
 * @returns Promise with array of WritefromDiction items
 */
export async function getWritefromDictionItems(): Promise<WritefromDictionItem[]> {
  try {
    if (!secondaryDb) {
      throw new Error('Secondary Firebase database not initialized');
    }

    // Reference to the writefromdictation collection
    const writefromdictionRef = collection(secondaryDb, 'writefromdictation');
    
    // Query where isHidden is false
    const q = query(writefromdictionRef, where('isHidden', '==', false));
    
    // Execute the query
    const querySnapshot = await getDocs(q);
    
    // Map the documents to our interface
    const items: WritefromDictionItem[] = [];
    let itemsWithBrianAudio = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const item = {
        id: doc.id,
        ...data
      } as WritefromDictionItem;
      
      // Count items with Brian audio
      if (item.audio?.Brian) {
        itemsWithBrianAudio++;
      }
      
      items.push(item);
    });
    
    console.log(`✅ Fetched ${items.length} writefromdiction items from Firebase`);
    console.log(`🎤 ${itemsWithBrianAudio} items have Brian audio available`);
    
    // Log sample item for debugging
    if (items.length > 0 && items[0].audio?.Brian) {
      console.log(`📝 Sample item:`, {
        id: items[0].id,
        text: items[0].text?.substring(0, 50) + '...',
        hasBrianAudio: !!items[0].audio?.Brian,
        audioUrl: items[0].audio?.Brian?.substring(0, 60) + '...'
      });
    }
    
    return items;
  } catch (error) {
    console.error('❌ Error fetching writefromdiction items:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time updates for writefromdiction items where isHidden is false
 * @param callback Function to call when data changes
 * @returns Unsubscribe function
 */
export function subscribeToWritefromDiction(
  callback: (items: WritefromDictionItem[]) => void
): () => void {
  try {
    if (!secondaryDb) {
      throw new Error('Secondary Firebase database not initialized');
    }

    // Reference to the writefromdictation collection
    const writefromdictionRef = collection(secondaryDb, 'writefromdictation');
    
    // Query where isHidden is false
    const q = query(writefromdictionRef, where('isHidden', '==', false));
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        const items: WritefromDictionItem[] = [];
        querySnapshot.forEach((doc) => {
          items.push({
            id: doc.id,
            ...doc.data()
          } as WritefromDictionItem);
        });
        
        console.log(`✅ Real-time update: ${items.length} writefromdiction items`);
        callback(items);
      },
      (error) => {
        console.error('❌ Error in writefromdiction subscription:', error);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error subscribing to writefromdiction:', error);
    // Return a no-op unsubscribe function
    return () => {};
  }
}

/**
 * Get a random writefromdiction item where isHidden is false
 * @returns Promise with a random WritefromDiction item or null
 */
export async function getRandomWritefromDictionItem(): Promise<WritefromDictionItem | null> {
  try {
    const items = await getWritefromDictionItems();
    
    if (items.length === 0) {
      console.warn('⚠️ No writefromdiction items available');
      return null;
    }
    
    // Get a random item
    const randomIndex = Math.floor(Math.random() * items.length);
    return items[randomIndex];
  } catch (error) {
    console.error('❌ Error getting random writefromdiction item:', error);
    throw error;
  }
}
