"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteTask, usePatchTask } from "@/hooks/meshwork/use-task-messages";
import type { TaskVM } from "@/lib/meshwork/types";

/**
 * Shared task action dialogs — rename (Input → PATCH name) and delete
 * (destructive confirm → DELETE /api/tasks/[id]). Used by the conversation
 * view header menu and the Tasks list row menus.
 */

/** Form body — mounted inside the dialog content, so it re-initialises its
 *  input state every time the dialog opens (Radix unmounts on close). */
function RenameForm({ task, onDone }: { task: TaskVM; onDone: () => void }) {
  const patch = usePatchTask();
  const [name, setName] = useState(task.name);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === task.name) {
      onDone();
      return;
    }
    patch.mutate(
      { id: task.id, name: trimmed },
      {
        onSuccess: () => {
          toast.success("Task renamed");
          onDone();
        },
      }
    );
  };

  return (
    <>
      <div className="grid gap-2 py-1">
        <Label htmlFor="task-name">Task name</Label>
        <Input
          id="task-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Site rollout — phase 2"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button className="mesh-action font-medium" onClick={submit} disabled={!name.trim() || patch.isPending}>
          Save name
        </Button>
      </DialogFooter>
    </>
  );
}

export function RenameTaskDialog({
  task,
  open,
  onOpenChange,
}: {
  task: TaskVM | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename task</DialogTitle>
          <DialogDescription>
            The new name applies everywhere — sidebar, tasks list and this conversation.
          </DialogDescription>
        </DialogHeader>
        {task && <RenameForm task={task} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

export function DeleteTaskDialog({
  task,
  open,
  onOpenChange,
  onDeleted,
}: {
  task: TaskVM | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** called after a successful delete (e.g. closeTask()) */
  onDeleted?: (id: string) => void;
}) {
  const remove = useDeleteTask();

  const confirmDelete = () => {
    if (!task) return;
    remove.mutate(task.id, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted?.(task.id);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this task?</AlertDialogTitle>
          <AlertDialogDescription>
            “{task?.name}” and its full conversation trace will be removed from the workspace. This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              confirmDelete();
            }}
            disabled={remove.isPending}
            className="bg-mesh-red text-white hover:bg-mesh-red/85"
          >
            {remove.isPending ? "Deleting…" : "Delete task"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
