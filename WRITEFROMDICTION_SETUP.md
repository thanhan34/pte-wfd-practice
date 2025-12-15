# Write from Dictation - Firebase Setup Guide

This document explains how to use the secondary Firebase connection to fetch data from the PTE Shadowing database.

## Overview

Your application now supports **two Firebase connections simultaneously**:

1. **Primary Firebase** (wfdpracticeroom) - Used for the main practice room functionality
2. **Secondary Firebase** (pteshadowing) - Used for fetching writefromdiction content

## Configuration

### Environment Variables

The following environment variables have been added to `.env`:

```env
# Secondary Firebase Configuration
NEXT_PUBLIC_FIREBASE_SECONDARY_API_KEY=AIzaSyBdDDNRvAwiOz9gjQtyv5yGdjUKQ8cd7bs
NEXT_PUBLIC_FIREBASE_SECONDARY_AUTH_DOMAIN=pteshadowing.firebaseapp.com
NEXT_PUBLIC_FIREBASE_SECONDARY_PROJECT_ID=pteshadowing
NEXT_PUBLIC_FIREBASE_SECONDARY_STORAGE_BUCKET=pteshadowing.appspot.com
NEXT_PUBLIC_FIREBASE_SECONDARY_MESSAGING_SENDER_ID=1030709369202
NEXT_PUBLIC_FIREBASE_SECONDARY_APP_ID=1:1030709369202:web:f5c029e87f836c013ba5eb
```

### Firebase Initialization

Both Firebase instances are initialized in `src/lib/firebase.ts`:

- **Primary DB**: `db` (from wfdpracticeroom)
- **Secondary DB**: `secondaryDb` (from pteshadowing)

## Available Functions

The `src/lib/writefromdiction.ts` file provides the following functions:

### 1. `getWritefromDictionItems()`

Fetches all writefromdiction items where `isHidden` is `false`.

**Usage:**
```typescript
import { getWritefromDictionItems } from '@/lib/writefromdiction';

const items = await getWritefromDictionItems();
console.log(items); // Array of WritefromDictionItem
```

### 2. `subscribeToWritefromDiction(callback)`

Subscribes to real-time updates for writefromdiction items.

**Usage:**
```typescript
import { subscribeToWritefromDiction } from '@/lib/writefromdiction';

useEffect(() => {
  const unsubscribe = subscribeToWritefromDiction((items) => {
    console.log('Updated items:', items);
    setItems(items);
  });

  return () => unsubscribe(); // Cleanup on unmount
}, []);
```

### 3. `getRandomWritefromDictionItem()`

Gets a random writefromdiction item from the available items.

**Usage:**
```typescript
import { getRandomWritefromDictionItem } from '@/lib/writefromdiction';

const randomItem = await getRandomWritefromDictionItem();
console.log(randomItem); // Single WritefromDictionItem or null
```

## Data Structure

### WritefromDictionItem Interface

```typescript
interface WritefromDictionItem {
  id: string;              // Document ID
  content?: string;        // The dictation text content
  audio?: string;          // Audio file URL
  isHidden?: boolean;      // Visibility flag
  createdAt?: any;         // Creation timestamp
  updatedAt?: any;         // Update timestamp
  [key: string]: any;      // Additional fields
}
```

## Example Component

See `src/components/WritefromDictionExample.tsx` for a complete example of how to use all three functions.

The example demonstrates:
- Fetching all items on component mount
- Subscribing to real-time updates
- Getting a random item on button click
- Displaying items with the app's color scheme

## Integration with Your App

To integrate writefromdiction data into your existing components:

### Option 1: Direct Import
```typescript
import { getWritefromDictionItems } from '@/lib/writefromdiction';

const MyComponent = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    getWritefromDictionItems().then(setItems);
  }, []);

  // Use items...
};
```

### Option 2: Real-time Subscription
```typescript
import { subscribeToWritefromDiction } from '@/lib/writefromdiction';

const MyComponent = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToWritefromDiction(setItems);
    return () => unsubscribe();
  }, []);

  // Use items...
};
```

### Option 3: Random Item
```typescript
import { getRandomWritefromDictionItem } from '@/lib/writefromdiction';

const MyComponent = () => {
  const loadRandomPhrase = async () => {
    const item = await getRandomWritefromDictionItem();
    if (item) {
      // Use the random item
      console.log(item.content);
    }
  };
};
```

## Color Scheme Integration

The example component uses your app's color scheme:

- `#ffffff` - White (background)
- `#fc5d01` - Primary orange (buttons, headings)
- `#fedac2` - Light orange (backgrounds)
- `#fdbc94` - Medium light orange (borders)
- `#ffac7b` - Bright orange (accents)
- `#fd7f33` - Vibrant orange (secondary text)

## Notes

- All queries automatically filter for `isHidden === false`
- Functions include error handling and logging
- Real-time subscriptions automatically clean up when components unmount
- Both Firebase instances run independently without conflicts

## Testing

To test the setup, you can:

1. Import and use the example component in a page
2. Check browser console for connection logs
3. Verify data is fetched from the pteshadowing database

Example test page:
```typescript
// app/test-wfd/page.tsx
import WritefromDictionExample from '@/components/WritefromDictionExample';

export default function TestPage() {
  return <WritefromDictionExample />;
}
```

## Troubleshooting

If you encounter issues:

1. **Check environment variables**: Ensure all `NEXT_PUBLIC_FIREBASE_SECONDARY_*` variables are set
2. **Check browser console**: Look for Firebase initialization logs
3. **Verify Firestore rules**: Ensure the pteshadowing database allows reads
4. **Check network tab**: Verify requests are going to the correct Firebase project

## Security Note

Make sure the Firestore security rules on the pteshadowing project allow read access to the writefromdiction collection for your use case.
