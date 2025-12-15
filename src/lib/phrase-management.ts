import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { getGlobalPhrases } from './global-phrases';

/**
 * Update phrase list for a room (host only)
 */
export async function updatePhraseList(roomId: string, phraseList: string[]): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    if (roomData.hostId !== user.uid) {
      throw new Error('Only host can update phrase list');
    }

    await updateDoc(roomRef, {
      phraseList: phraseList
    });
  } catch (error) {
    console.error('Error updating phrase list:', error);
    throw error;
  }
}

/**
 * Add phrases to existing list (host only)
 */
export async function addPhrasesToList(roomId: string, newPhrases: string[]): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    if (roomData.hostId !== user.uid) {
      throw new Error('Only host can add phrases');
    }

    const currentList = roomData.phraseList || [];
    const uniquePhrases = newPhrases.filter(phrase => !currentList.includes(phrase));
    const updatedList = [...currentList, ...uniquePhrases];

    await updateDoc(roomRef, {
      phraseList: updatedList
    });
  } catch (error) {
    console.error('Error adding phrases:', error);
    throw error;
  }
}

/**
 * Remove phrase from list (host only)
 */
export async function removePhraseFromList(roomId: string, phraseIndex: number): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    if (roomData.hostId !== user.uid) {
      throw new Error('Only host can remove phrases');
    }

    const currentList = roomData.phraseList || [];
    const updatedList = currentList.filter((_: string, index: number) => index !== phraseIndex);

    await updateDoc(roomRef, {
      phraseList: updatedList
    });
  } catch (error) {
    console.error('Error removing phrase:', error);
    throw error;
  }
}

/**
 * Set next phrase from global list (host only)
 */
export async function setNextPhrase(roomId: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    if (roomData.hostId !== user.uid) {
      throw new Error('Only host can set next phrase');
    }

    // Get global phrase list
    const phraseList = await getGlobalPhrases();
    if (phraseList.length === 0) {
      throw new Error('No phrases in global list');
    }

    const currentIndex = roomData.currentPhraseIndex || 0;
    const nextIndex = (currentIndex + 1) % phraseList.length; // Loop back to start
    const nextPhrase = phraseList[nextIndex];

    // Reset all participants' status when setting new phrase
    const resetParticipants: { [userId: string]: any } = {};
    
    Object.entries(roomData.participants).forEach(([userId, participant]: [string, any]) => {
      resetParticipants[userId] = {
        nickname: participant.nickname,
        status: 'waiting',
        isTyping: false,
        correctCount: participant.correctCount || 0,
        totalAttempts: participant.totalAttempts || 0
      };
    });

    // Update with countdown and new phrase (không phát âm thanh ngay lập tức)
    await updateDoc(roomRef, {
      targetPhrase: nextPhrase,
      currentPhraseIndex: nextIndex,
      participants: resetParticipants,
      isCountingDown: true,
      countdownStartedAt: new Date()
    });

    // After 3 seconds, stop countdown and allow input
    setTimeout(async () => {
      try {
        await updateDoc(roomRef, {
          isCountingDown: false,
          roundStartTime: new Date()
        });
      } catch (error) {
        console.error('Error stopping countdown:', error);
      }
    }, 3000);
  } catch (error) {
    console.error('Error setting next phrase:', error);
    throw error;
  }
}

/**
 * Trigger audio playback for participants (host only)
 */
export async function triggerAudioPlayback(roomId: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    if (roomData.hostId !== user.uid) {
      throw new Error('Only host can trigger audio playback');
    }

    // Set shouldPlayAudio to true temporarily
    await updateDoc(roomRef, {
      shouldPlayAudio: true
    });

    // Reset after 1 second
    setTimeout(async () => {
      try {
        await updateDoc(roomRef, {
          shouldPlayAudio: false
        });
      } catch (error) {
        console.error('Error resetting audio flag:', error);
      }
    }, 1000);
  } catch (error) {
    console.error('Error triggering audio playback:', error);
    throw error;
  }
}

/**
 * Remove participant from room (host only)
 */
export async function removeParticipant(roomId: string, participantId: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    if (roomData.hostId !== user.uid) {
      throw new Error('Only host can remove participants');
    }

    if (participantId === user.uid) {
      throw new Error('Host cannot remove themselves');
    }

    const updatedParticipants = { ...roomData.participants };
    delete updatedParticipants[participantId];

    await updateDoc(roomRef, {
      participants: updatedParticipants
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    throw error;
  }
}
