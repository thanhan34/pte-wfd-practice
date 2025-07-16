import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from './firebase';

const GLOBAL_PHRASES_DOC = 'global-phrases';

/**
 * Get global phrase list
 */
export async function getGlobalPhrases(): Promise<string[]> {
  try {
    const docRef = doc(db, 'app-data', GLOBAL_PHRASES_DOC);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().phrases || [];
    } else {
      // Initialize with default phrases
      const defaultPhrases = [
        "The lecture was about climate change",
        "Students should submit their assignments on time", 
        "The research findings were quite surprising",
        "Technology has revolutionized modern education",
        "Environmental protection is everyone's responsibility"
      ];
      
      await setDoc(docRef, { phrases: defaultPhrases });
      return defaultPhrases;
    }
  } catch (error) {
    console.error('Error getting global phrases:', error);
    return [];
  }
}

/**
 * Add phrases to global list
 */
export async function addGlobalPhrases(newPhrases: string[]): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, 'app-data', GLOBAL_PHRASES_DOC);
    const currentPhrases = await getGlobalPhrases();
    
    // Filter out duplicates
    const uniquePhrases = newPhrases.filter(phrase => !currentPhrases.includes(phrase));
    
    if (uniquePhrases.length > 0) {
      await updateDoc(docRef, {
        phrases: arrayUnion(...uniquePhrases)
      });
    }
  } catch (error) {
    console.error('Error adding global phrases:', error);
    throw error;
  }
}

/**
 * Remove phrase from global list
 */
export async function removeGlobalPhrase(phrase: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, 'app-data', GLOBAL_PHRASES_DOC);
    await updateDoc(docRef, {
      phrases: arrayRemove(phrase)
    });
  } catch (error) {
    console.error('Error removing global phrase:', error);
    throw error;
  }
}

/**
 * Update entire global phrase list
 */
export async function updateGlobalPhrases(phrases: string[]): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, 'app-data', GLOBAL_PHRASES_DOC);
    await updateDoc(docRef, { phrases });
  } catch (error) {
    console.error('Error updating global phrases:', error);
    throw error;
  }
}
