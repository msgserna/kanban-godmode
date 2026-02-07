"use client"

import { Task, TaskStatus } from "@/types";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { RiAddLine } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onAddTask?: (status: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

const statusColors = {
  todo: "bg-slate-100 border-slate-300",
  doing: "bg-blue-50 border-blue-300",
  done: "bg-green-50 border-green-300",
};

export function KanbanColumn({
  title,
  status,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: KanbanColumnProps) {
  return (
    <div className="flex min-h-[600px] w-full flex-col rounded-lg border-2 bg-muted/30 p-4">
      {/* Column Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
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
            <TaskCard
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
