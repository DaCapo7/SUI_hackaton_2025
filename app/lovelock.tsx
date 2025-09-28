import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

export function LoveLock({ bridgeId }: { bridgeId?: string }) {
  const loveLockPackageId = useNetworkVariable("loveLockPackageId");
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch task list data
  const { data: taskListData, refetch } = useSuiClientQuery(
    "getObject",
    {
      id: bridgeId!,
      options: { showContent: true },
    },
    { enabled: !!bridgeId }
  );



  // Add new task
  const addTask = () => {
    if (!newTaskTitle.trim() || !bridgeId) return;
    
    setIsLoading(true);
    const tx = new Transaction();

    tx.moveCall({
      arguments: [
        tx.object(bridgeId),
        tx.pure.address("0xADDE55E"),
        tx.pure.string(newTaskTitle),
        tx.pure.u8(9),
        tx.pure.u8(9),
        tx.pure.u16(2000),
        tx.object("0xCOINADDRESS")
      ],
      target: `${loveLockPackageId}::lovelock::create_lock`,
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async ({ digest }) => {
          await suiClient.waitForTransaction({ digest });
          await refetch();
          setNewTaskTitle("");
          setIsLoading(false);
        },
        onError: () => setIsLoading(false),
      }
    );
  };



  // Parse locks
  const getBridgeLocks = (data: any) => {
    if (data?.content?.dataType !== "moveObject") return null;
    return data.content.fields as {
      tasks: Array<{ id: string; title: string; completed: boolean }>;
      owner: string;
    };
  };

  //const taskListFields = taskListData ? getTaskListFields(taskListData) : null;

  if (!bridgeId) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Task Manager</h2>
        <Button onClick={console.log("Test1")} disabled={console.log("Test2")}>
          {true ? "Creating..." : "Create Task List"}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">My Tasks</h2>
      
      {/* Add new lock */}
      <div className="flex gap-2 mb-4">
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Enter lock title..."
          onKeyPress={(e) => e.key === "Enter" && addTask()}
        />
        <Button onClick={addTask} disabled={isLoading || !newTaskTitle.trim()}>
          Add Task
        </Button>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {taskListFields?.tasks.map((task, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 border rounded ${
              task.completed ? "bg-green-50 text-green-800" : "bg-white"
            }`}
          >
            <span className={task.completed ? "line-through" : ""}>
              {task.title}
            </span>
            {!task.completed && (
              <Button
                size="sm"
                onClick={() => completeTask(parseInt(task.id))}
                disabled={isLoading}
              >
                Complete
              </Button>
            )}
          </div>
        ))}
      </div>

      {taskListFields?.tasks.length === 0 && (
        <p className="love-lock-text-muted text-center py-8">
          No tasks yet. Add your first task above!
        </p>
      )}
    </div>
  );
}