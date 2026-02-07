"use client"

import { useState } from "react";
import { TaskStatus, Task } from "@/types";
import { useApp } from "@/lib/app-context";
import { KanbanColumn } from "./kanban-column";

export function KanbanBoard() {
  const { state, deleteTask } = useApp();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creatingInColumn, setCreatingInColumn] = useState<TaskStatus | null>(null);

  // Group tasks by status
  const tasksByStatus = {
    todo: state.tasks.filter((t) => t.estado === "todo"),
    doing: state.tasks.filter((t) => t.estado === "doing"),
    done: state.tasks.filter((t) => t.estado === "done"),
  };

  const handleAddTask = (status: TaskStatus) => {
    setCreatingInColumn(status);
    // TODO: Open create task dialog
    console.log("Add task to", status);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    // TODO: Open edit task dialog
    console.log("Edit task", task);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
      deleteTask(taskId);
    }
  };

  return (
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
  );
}
