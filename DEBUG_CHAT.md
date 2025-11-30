# Chat Debug Guide

## Steps to Debug:

1. **Open browser console** (F12)
2. **Send a message** from patient to nurse
3. **Check console logs** for:
   - `[Chat] Sending message to chatId: xxx-yyy`
   - `[Messages API] Saving message to chatId: xxx-yyy`
   - `[Messages API] Message saved: {id}`

4. **Open chat from different location** (e.g., assignments page)
5. **Check console logs** for:
   - `[Chat] Loading chat details for: xxx-yyy`
   - `[Chat API] Raw chat ID: xxx-yyy`
   - `[Chat API] Normalized chat ID: xxx-yyy`
   - `[Chat API] Found messages: {count}`

## What to Look For:

- **Chat ID consistency**: All chat IDs should be in alphabetical order (e.g., "abc-xyz" not "xyz-abc")
- **Message count**: Should match what you sent
- **User IDs**: Should be correct for both users

## Common Issues:

1. **Different chat IDs**: If sending uses "user1-user2" but loading uses "user2-user1", messages won't load
2. **Undefined user IDs**: Check if `patientId` or `nurseId` is undefined when creating chat links
3. **Database mismatch**: Messages saved with one chat ID but queried with another

## Quick Fix Test:

Run this in browser console on chat page:
```javascript
console.log('Current chat ID:', window.location.pathname.split('/').pop());
```

Then check database for messages with that exact chatId.
