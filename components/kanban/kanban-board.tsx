"use client"

import { useState, useMemo } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { TaskStatus, Task } from "@/types";
import { useApp } from "@/lib/app-context";
import { DroppableColumn } from "./droppable-column";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskCard } from "./task-card";
import { SearchBar } from "./search-bar";
import { filterTasks } from "@/lib/query";

export function KanbanBoard() {
  const { state, deleteTask, moveTask } = useApp();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creatingInColumn, setCreatingInColumn] = useState<TaskStatus | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter tasks using advanced query parser
  const filteredTasks = useMemo(() => {
    return filterTasks(state.tasks, searchQuery);
  }, [state.tasks, searchQuery]);

  // Group filtered tasks by status
  const tasksByStatus = {
    todo: filteredTasks.filter((t) => t.estado === "todo"),
    doing: filteredTasks.filter((t) => t.estado === "doing"),
    done: filteredTasks.filter((t) => t.estado === "done"),
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
      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          resultCount={filteredTasks.length}
          totalCount={state.tasks.length}
        />
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <DroppableColumn
            title="📋 To Do"
            status="todo"
            tasks={tasksByStatus.todo}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
          <DroppableColumn
            title="🚀 Doing"
            status="doing"
            tasks={tasksByStatus.doing}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
          <DroppableColumn
            title="✅ Done"
            status="done"
            tasks={tasksByStatus.done}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
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
    </>
  );
}
