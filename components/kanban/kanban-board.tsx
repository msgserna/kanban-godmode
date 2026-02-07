"use client"

import { useState } from "react";
import { TaskStatus, Task } from "@/types";
import { useApp } from "@/lib/app-context";
import { KanbanColumn } from "./kanban-column";
import { TaskFormDialog } from "./task-form-dialog";

export function KanbanBoard() {
  const { state, deleteTask } = useApp();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creatingInColumn, setCreatingInColumn] = useState<TaskStatus | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Group tasks by status
  const tasksByStatus = {
    todo: state.tasks.filter((t) => t.estado === "todo"),
    doing: state.tasks.filter((t) => t.estado === "doing"),
    done: state.tasks.filter((t) => t.estado === "done"),
  };

  const handleAddTask = (status: TaskStatus) => {
    setCreatingInColumn(status);
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setCreatingInColumn(null);
    setIsFormOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
      deleteTask(taskId);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(null);
    setCreatingInColumn(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <KanbanColumn
          title="📋 To Do"
          status="todo"
          tasks={tasksByStatus.todo}
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
        <KanbanColumn
          title="🚀 Doing"
          status="doing"
          tasks={tasksByStatus.doing}
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
        <KanbanColumn
          title="✅ Done"
          status="done"
          tasks={tasksByStatus.done}
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
      </div>

      <TaskFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        task={editingTask || undefined}
        defaultStatus={creatingInColumn || "todo"}
      />
    </>
  );
}
