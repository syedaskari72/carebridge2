export function createChatId(userId1: string, userId2: string): string {
  // Always sort user IDs alphabetically to ensure consistent chat ID
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}-${sortedIds[1]}`;
}
