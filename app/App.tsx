'use client'
import { useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { useState, useEffect } from "react";
import { Lock } from "./Lock";
import { CreateLock } from "./CreateLock";
import { LockList } from "./components/LockList";
import { BridgeLocks } from "./components/BridgeLocks";
import { PendingLocks } from "./components/PendingLocks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function App() {
  const currentAccount = useCurrentAccount();
  const [lockId, setLock] = useState<string | null>(null);
  const [view, setView] = useState<'create' | 'search' | 'bridge' | 'pending' | 'lock'>('create');
  const [previousView, setPreviousView] = useState<'create' | 'search' | 'bridge' | 'pending'>('create');

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (isValidSuiObjectId(hash)) {
      setLock(hash);
      setView('lock');
    }
  }, []);

  const handleLockCreated = (id: string) => {
    window.location.hash = id;
    setLock(id);
    setView('lock');
  };

  const handleLockSelected = (id: string) => {
    setPreviousView(view); // Remember the current view before switching to lock
    window.location.hash = id;
    setLock(id);
    setView('lock');
  };

  const goBackToSelection = () => {
    setLock(null);
    setView(previousView); // Go back to the previous view
    window.location.hash = '';
  };

  const handleViewChange = (newView: 'create' | 'search' | 'bridge' | 'pending') => {
    setView(newView);
    setPreviousView(newView); // Update previous view when manually changing views
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="love-lock-card">
        <CardContent className="pt-6">
          {currentAccount ? (
            lockId ? (
              <div className="space-y-4">
                {/* Back button when viewing a lock */}
                <div className="flex justify-between items-center">
                  <Button 
                    onClick={goBackToSelection}
                    variant="outline"
                    className="border-pink-300 text-pink-700 hover:bg-pink-50"
                  >
                    ← Back to Lock Selection
                  </Button>
                  <div className="text-sm text-pink-600">
                    Lock ID: {lockId.slice(0, 8)}...{lockId.slice(-8)}
                  </div>
                </div>
                
                {/* Lock component */}
                <Lock id={lockId} />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Navigation with proper styling */}
                <div className="flex justify-center space-x-2 flex-wrap gap-2">
                  <Button
                    variant={view === 'create' ? 'default' : 'outline'}
                    onClick={() => handleViewChange('create')}
                    className={view === 'create' 
                      ? 'love-lock-button text-white' 
                      : 'border-pink-300 text-pink-700 hover:bg-pink-50'
                    }
                  >
                    Create New Love Lock
                  </Button>
                  <Button
                    variant={view === 'pending' ? 'default' : 'outline'}
                    onClick={() => handleViewChange('pending')}
                    className={view === 'pending' 
                      ? 'love-lock-button text-white' 
                      : 'border-pink-300 text-pink-700 hover:bg-pink-50'
                    }
                  >
                    My Pending Locks
                  </Button>
                  <Button
                    variant={view === 'search' ? 'default' : 'outline'}
                    onClick={() => handleViewChange('search')}
                    className={view === 'search' 
                      ? 'love-lock-button text-white' 
                      : 'border-pink-300 text-pink-700 hover:bg-pink-50'
                    }
                  >
                    Find Existing Love Lock
                  </Button>
                  <Button
                    variant={view === 'bridge' ? 'default' : 'outline'}
                    onClick={() => handleViewChange('bridge')}
                    className={view === 'bridge' 
                      ? 'love-lock-button text-white' 
                      : 'border-pink-300 text-pink-700 hover:bg-pink-50'
                    }
                  >
                    View Bridge Locks
                  </Button>
                </div>

                {/* Content based on view */}
                {view === 'create' && (
                  <CreateLock onCreated={handleLockCreated} />
                )}

                {view === 'pending' && (
                  <PendingLocks onSelectLock={handleLockSelected} />
                )}
                
                {view === 'search' && (
                  <LockList onSelectLock={handleLockSelected} />
                )}

                {view === 'bridge' && (
                  <BridgeLocks onSelectLock={handleLockSelected} />
                )}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold love-lock-text mb-2">Welcome to Love Lock App</h2>
              <p className="love-lock-text-muted">Please connect your wallet to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
