'use client'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface LockData {
  objectId: string;
  p1: string;
  p2: string;
  message: string;
  creation_date: {
    day: number;
    month: number;
    year: number;
  };
  closed: boolean;
}

function getLockFields(data: any): LockData | null {
  if (data?.content?.dataType !== "moveObject") {
    return null;
  }
  
  const fields = data.content.fields as any;
  
  // Parse creation_date properly - it's nested in fields.day/month/year
  let creationDate = fields.creation_date;
  
  // Check if creation_date has a fields property (nested structure)
  if (creationDate && typeof creationDate === 'object' && creationDate.fields) {
    creationDate = {
      day: creationDate.fields.day || 1,
      month: creationDate.fields.month || 1,
      year: creationDate.fields.year || 2024
    };
  } else if (typeof creationDate === 'string') {
    // If it's a string, try to parse it
    try {
      const dateParts = creationDate.split('/');
      if (dateParts.length === 3) {
        creationDate = {
          day: parseInt(dateParts[0]),
          month: parseInt(dateParts[1]),
          year: parseInt(dateParts[2])
        };
      }
    } catch (e) {
      console.warn('Failed to parse date string:', creationDate);
      creationDate = { day: 1, month: 1, year: 2024 }; // fallback
    }
  } else if (!creationDate || typeof creationDate !== 'object') {
    // Fallback if creation_date is missing or not an object
    creationDate = { day: 1, month: 1, year: 2024 };
  }
  
  return {
    objectId: data.objectId,
    p1: fields.p1,
    p2: fields.p2,
    message: fields.message,
    creation_date: creationDate,
    closed: fields.closed,
  } as LockData;
}

export function LockList({ onSelectLock }: { onSelectLock: (id: string) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LockData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchLocks = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Search by object ID if it's a valid Sui object ID
      if (searchQuery.startsWith("0x") && searchQuery.length === 66) {
        // Create Sui client and query directly
        const client = new SuiClient({ url: getFullnodeUrl("testnet") });
        
        const object = await client.getObject({
          id: searchQuery,
          options: {
            showContent: true,
            showOwner: true,
            showType: true,
          },
        });

        if (object.data && object.data.content?.dataType === "moveObject") {
          const fields = getLockFields(object.data);
          if (fields) {
            setSearchResults([{
              objectId: searchQuery,
              ...fields
            }]);
          } else {
            setError("Object found but is not a lock");
          }
        } else {
          setError("Object not found or invalid");
        }
      } else {
        setError("Please enter a valid Sui object ID (starts with 0x and is 66 characters long)");
      }
    } catch (err) {
      setError("Error searching for locks");
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold love-lock-text mb-4">Find Existing Love Locks</h2>
        <p className="love-lock-text-muted mb-6">
          Search for existing love lock objects by their Object ID
        </p>
      </div>

      {/* Search by Object ID */}
      <Card>
        <CardHeader>
          <CardTitle className="love-lock-text">Search by Object ID</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter lock object ID (0x...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 love-lock-text"
            />
            <Button 
              onClick={searchLocks}
              disabled={isSearching}
              className="love-lock-button text-white"
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="love-lock-text">
              Search Results ({searchResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((lock) => (
                <div key={lock.objectId} className="flex items-center justify-between p-4 border border-pink-200 rounded-lg love-lock-accent">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold love-lock-text">
                        {lock.closed ? "🔒 Locked" : "🔓 Pending"}
                      </span>
                      <span className="text-xs love-lock-text-muted">
                        {lock.creation_date?.day && lock.creation_date?.month && lock.creation_date?.year
                          ? `${lock.creation_date.day}/${lock.creation_date.month}/${lock.creation_date.year}`
                          : 'Date not available'}
                      </span>
                    </div>
                    <p className="text-sm love-lock-text mb-1">
                      <strong>Creator:</strong> {lock.p1.slice(0, 8)}...{lock.p1.slice(-8)}
                    </p>
                    <p className="text-sm love-lock-text mb-1">
                      <strong>Recipient:</strong> {lock.p2.slice(0, 8)}...{lock.p2.slice(-8)}
                    </p>
                    <p className="text-sm love-lock-text-muted italic">
                      "{lock.message.length > 50 ? lock.message.substring(0, 50) + '...' : lock.message}"
                    </p>
                    <p className="text-xs love-lock-text-muted mt-1">
                      ID: {lock.objectId.slice(0, 8)}...{lock.objectId.slice(-8)}
                    </p>
                  </div>
                  <Button 
                    onClick={() => onSelectLock(lock.objectId)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    View Lock
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm love-lock-text-muted">
            <h3 className="font-semibold mb-2 love-lock-text">How to find love lock object IDs:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Create a love lock first to get its object ID</li>
              <li>Copy the object ID from the URL hash after creating a lock</li>
              <li>Or check the Sui Explorer for your package transactions</li>
              <li>Look for objects of type: <code className="love-lock-accent px-1 rounded love-lock-text">Lock</code></li>
              <li>Object IDs are 66 characters long and start with "0x"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
