import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNetworkVariable } from "./networkConfig";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

export function Lock({ id }: { id: string }) {
  const lovelockPackageId = useNetworkVariable("lovelockPackageId");
  const bridgeObjectId = useNetworkVariable("bridgeObjectId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { data, isPending, error, refetch } = useSuiClientQuery("getObject", {
    id,
    options: {
      showContent: true,
      showOwner: true,
    },
  });

  const [waitingForTxn, setWaitingForTxn] = useState("");

  const executeMoveCall = (method: "accept" | "decline") => {
    setWaitingForTxn(method);

    const tx = new Transaction();

    tx.moveCall({
      arguments: [tx.object(id), tx.object(bridgeObjectId), tx.pure.bool(method === "accept")],
      target: `${lovelockPackageId}::lovelock::choose_fate_lock`,
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (tx) => {
          suiClient.waitForTransaction({ digest: tx.digest }).then(async () => {
            await refetch();
            setWaitingForTxn("");
          });
        },
      },
    );
  };

  if (isPending) return (
    <Alert>
      <AlertDescription className="text-muted-foreground">Loading...</AlertDescription>
    </Alert>
  );

  if (error) return (
    <Alert variant="destructive">
      <AlertDescription>Error: {error.message}</AlertDescription>
    </Alert>
  );

  if (!data.data) return (
    <Alert>
      <AlertDescription className="text-muted-foreground">Not found</AlertDescription>
    </Alert>
  );

  const lockFields = getLockFields(data.data);
  if (!lockFields) return (
    <Alert>
      <AlertDescription className="text-muted-foreground">Invalid lock object</AlertDescription>
    </Alert>
  );

  const isRecipient = lockFields?.p2 === currentAccount?.address;
  const isCreator = lockFields?.p1 === currentAccount?.address;
  const isClosed = lockFields?.closed;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="love-lock-text">Love Lock</CardTitle>
        <CardDescription className="love-lock-text-muted">
          {isClosed ? "🔒 Locked Forever" : "🔓 Pending Decision"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium love-lock-text">Creator:</span>
            <span className="text-sm love-lock-text-muted">
              {lockFields?.p1 ? `${lockFields.p1.slice(0, 8)}...${lockFields.p1.slice(-8)}` : 'Loading...'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium love-lock-text">Recipient:</span>
            <span className="text-sm love-lock-text-muted">
              {lockFields?.p2 ? `${lockFields.p2.slice(0, 8)}...${lockFields.p2.slice(-8)}` : 'Loading...'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium love-lock-text">Created:</span>
            <span className="text-sm love-lock-text-muted">
              {lockFields.creation_date?.day && lockFields.creation_date?.month && lockFields.creation_date?.year
                ? `${lockFields.creation_date.day}/${lockFields.creation_date.month}/${lockFields.creation_date.year}`
                : 'Date not available'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium love-lock-text">Status:</span>
            <span className="text-sm love-lock-text-muted">
              {isClosed ? "Locked" : "Pending"}
            </span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="space-y-2">
            <span className="text-sm font-medium love-lock-text">Message:</span>
            <div className="p-3 love-lock-accent rounded-md border border-pink-200">
              <p className="text-sm love-lock-text italic">"{lockFields?.message || 'Loading...'}"</p>
            </div>
          </div>
        </div>

        {!isClosed && isRecipient && (
          <div className="flex flex-row gap-2 pt-4">
            <Button
              onClick={() => executeMoveCall("accept")}
              disabled={waitingForTxn !== ""}
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-pink-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg text-white"
            >
              {waitingForTxn === "accept" ? (
                <ClipLoader size={20} color="white" />
              ) : (
                "Accept & Lock Forever"
              )}
            </Button>
            <Button
              onClick={() => executeMoveCall("decline")}
              disabled={waitingForTxn !== ""}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-pink-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg text-white"
            >
              {waitingForTxn === "decline" ? (
                <ClipLoader size={20} color="white" />
              ) : (
                "Decline"
              )}
            </Button>
          </div>
        )}

        {isClosed && (
          <div className="pt-4">
            <Alert>
              <AlertDescription className="text-center text-green-700">
                🔒 This lock has been accepted and is now permanently locked on the blockchain!
              </AlertDescription>
            </Alert>
          </div>
        )}

        {!isClosed && isCreator && (
          <div className="pt-4">
            <Alert>
              <AlertDescription className="text-center text-blue-700">
                ⏳ Waiting for {lockFields?.p2 ? `${lockFields.p2.slice(0, 8)}...${lockFields.p2.slice(-8)}` : 'Loading...'} to accept or decline this lock.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getLockFields(data: SuiObjectData) {
  if (data.content?.dataType !== "moveObject") {
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
    p1: fields.p1,
    p2: fields.p2,
    message: fields.message,
    creation_date: creationDate,
    closed: fields.closed,
  };
}
