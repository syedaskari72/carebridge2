"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function TestSessionPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log("[TestSession] Session status:", status);
    console.log("[TestSession] Session data:", session);
  }, [session, status]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Status:</strong> {status}
        </div>
        
        <div>
          <strong>Session:</strong>
          <pre className="bg-gray-100 p-4 rounded mt-2">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>User Info:</strong>
          {session?.user ? (
            <ul className="list-disc list-inside mt-2">
              <li>ID: {(session.user as any).id}</li>
              <li>Email: {session.user.email}</li>
              <li>Name: {session.user.name}</li>
              <li>User Type: {(session.user as any).userType}</li>
            </ul>
          ) : (
            <p>No user data</p>
          )}
        </div>
      </div>
    </div>
  );
}
