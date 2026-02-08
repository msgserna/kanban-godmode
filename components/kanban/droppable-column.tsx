"use client"

import { useDroppable } from "@dnd-kit/core";
import { Task, TaskStatus } from "@/types";
import { DraggableTaskCard } from "./draggable-task-card";

interface DroppableColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  icon?: React.ReactNode;
  headerColor?: string;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function DroppableColumn({
  title,
  status,
  tasks,
  icon,
  headerColor = "bg-muted",
  onEditTask,
  onDeleteTask,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[600px] w-full flex-col rounded-lg border-2 bg-muted/30 p-4 transition-colors ${
        isOver ? "border-primary bg-primary/5" : ""
      }`}
    >
      {/* Column Header */}
      <div className={`-m-4 mb-4 flex items-center justify-between rounded-t-lg p-4 text-white ${headerColor}`}>
        <div className="flex items-center gap-2">
          {icon && <span className="text-white">{icon}</span>}
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <span className="text-base font-semibold text-white/90">
          {tasks.length}
        </span>
      </div>

      {/* Tasks List */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background/50 p-8">
            <p className="text-center text-sm text-muted-foreground">
              No hay tareas en esta columna
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
