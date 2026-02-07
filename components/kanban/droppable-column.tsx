"use client"

import { useDroppable } from "@dnd-kit/core";
import { Task, TaskStatus } from "@/types";
import { DraggableTaskCard } from "./draggable-task-card";
import { Button } from "@/components/ui/button";
import { RiAddLine } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";

interface DroppableColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  icon?: React.ReactNode;
  onAddTask?: (status: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function DroppableColumn({
  title,
  status,
  tasks,
  icon,
  onAddTask,
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
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          <h3 className="font-semibold text-lg">{title}</h3>
          <Badge variant="secondary" className="font-normal">
            {tasks.length}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAddTask?.(status)}
          className="h-8 w-8 p-0"
          aria-label={`Añadir tarea a ${title}`}
        >
          <RiAddLine className="h-4 w-4" />
        </Button>
      </div>

      {/* Tasks List */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background/50 p-8">
            <p className="text-center text-sm text-muted-foreground">
              No hay tareas en esta columna
              <br />
              <Button
                variant="link"
                size="sm"
                onClick={() => onAddTask?.(status)}
                className="mt-2"
              >
                Añadir una tarea
              </Button>
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
