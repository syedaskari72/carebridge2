# Chat Implementation Summary

## Overview
The chat system uses normalized chat IDs to ensure both users access the same chat room regardless of who initiates the conversation.

## Key Components

### 1. Chat ID Normalization (`src/lib/chatUtils.ts`)
```typescript
export function createChatId(userId1: string, userId2: string): string {
  // Always sort user IDs alphabetically to ensure consistent chat ID
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}-${sortedIds[1]}`;
}
```

### 2. Chat Page (`src/app/chat/[id]/page.tsx`)
- Normalizes incoming chat ID on load
- Fetches messages from database via `/api/chat/[id]`
- Saves messages via `/api/chat/messages` POST endpoint
- Uses Socket.io for real-time message broadcasting

### 3. Message Persistence
- Messages are saved to `ChatMessage` table in database
- API endpoint: `/api/chat/messages` (POST)
- Messages persist across page refreshes

### 4. All Chat Link Locations (Using `createChatId`)

#### Nurse Dashboard (`src/app/dashboard/nurse/page.tsx`)
- Today's assignments chat buttons
- Patient details modal chat button

#### Nurse Assignments (`src/app/dashboard/nurse/assignments/page.tsx`)
- Chat button for each assignment

#### Patient Bookings (`src/app/bookings/page.tsx`)
- Chat button to contact assigned nurse

#### Notifications (`src/app/api/notifications/route.ts`)
- Message notifications link to normalized chat ID

## Database Schema

### ChatMessage Model
```prisma
model ChatMessage {
  id         String   @id @default(cuid())
  chatId     String
  senderId   String
  senderName String
  message    String   @db.Text
  timestamp  DateTime @default(now())

  @@index([chatId, timestamp])
  @@map("chat_messages")
}
```

## How It Works

1. **Creating Chat Link**: When a user clicks "Chat", `createChatId(userId1, userId2)` is called
2. **Normalization**: User IDs are sorted alphabetically (e.g., "abc-xyz" always, never "xyz-abc")
3. **Chat Page**: Receives chat ID, normalizes it again for consistency
4. **Loading Messages**: Fetches all messages with matching `chatId` from database
5. **Sending Messages**: Saves to database first, then broadcasts via Socket.io
6. **Real-time Updates**: Socket.io notifies other user in the same chat room

## Benefits

✅ Both users always access the same chat room
✅ Messages persist in database
✅ Real-time updates via Socket.io
✅ Works across page refreshes
✅ Consistent chat IDs regardless of who initiates

## Testing

To verify chat works correctly:
1. Patient sends message to nurse
2. Nurse opens chat from assignments page
3. Both should see the same messages
4. Messages should persist after page refresh
