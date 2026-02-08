"use client"

import { useState, useMemo } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { TaskStatus, Task } from "@/types";
import { useApp } from "@/lib/app-context";
import { DroppableColumn } from "./droppable-column";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskCard } from "./task-card";
import { SearchBar } from "./search-bar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { filterTasks } from "@/lib/query";
import { ImportExportButtons } from "@/components/import-export-buttons";
import { Separator } from "@/components/ui/separator";
import { RiTodoLine, RiLoaderLine, RiCheckboxCircleLine, RiEyeLine, RiAddLine } from "@remixicon/react";

export function KanbanBoard() {
  const { state, deleteTask, moveTask } = useApp();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creatingInColumn, setCreatingInColumn] = useState<TaskStatus | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Filter tasks using advanced query parser
  const filteredTasks = useMemo(() => {
    return filterTasks(state.tasks, searchQuery);
  }, [state.tasks, searchQuery]);

  // Group filtered tasks by status
  const tasksByStatus = {
    todo: filteredTasks.filter((t) => t.estado === "todo"),
    doing: filteredTasks.filter((t) => t.estado === "doing"),
    review: filteredTasks.filter((t) => t.estado === "review"),
    done: filteredTasks.filter((t) => t.estado === "done"),
  };

  const handleAddTask = () => {
    setCreatingInColumn("todo"); // Siempre crea en To Do
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setCreatingInColumn(null);
    setIsFormOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setDeletingTaskId(taskId);
  };

  const confirmDelete = () => {
    if (deletingTaskId) {
      deleteTask(deletingTaskId);
      setDeletingTaskId(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(null);
    setCreatingInColumn(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task;
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Find the task
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Only move if status changed
    if (task.estado !== newStatus) {
      moveTask(taskId, newStatus);
    }
  };

  return (
    <>
      {/* Search Bar & New Task Button */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="w-full max-w-[520px]">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            resultCount={filteredTasks.length}
            totalCount={state.tasks.length}
          />
        </div>
        <div className="flex items-center gap-3">
          <ImportExportButtons />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleAddTask} className="gap-2 shrink-0">
                <RiAddLine className="h-4 w-4" />
                New Task
              </Button>
            </TooltipTrigger>
            <TooltipContent>Crear una tarea nueva</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <Separator className="mb-6" />

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DroppableColumn
            title="To Do"
            status="todo"
            icon={<RiTodoLine className="h-5 w-5" />}
            tasks={tasksByStatus.todo}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            headerColor="bg-blue-600"
          />
          <DroppableColumn
            title="Doing"
            status="doing"
            icon={<RiLoaderLine className="h-5 w-5" />}
            tasks={tasksByStatus.doing}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            headerColor="bg-yellow-500"
          />
          <DroppableColumn
            title="Review"
            status="review"
            icon={<RiEyeLine className="h-5 w-5" />}
            tasks={tasksByStatus.review}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            headerColor="bg-orange-500"
          />
          <DroppableColumn
            title="Done"
            status="done"
            icon={<RiCheckboxCircleLine className="h-5 w-5" />}
            tasks={tasksByStatus.done}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            headerColor="bg-green-600"
          />
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      <TaskFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        task={editingTask || undefined}
        defaultStatus={creatingInColumn || "todo"}
      />

      <AlertDialog open={!!deletingTaskId} onOpenChange={(open) => !open && setDeletingTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar tarea</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
