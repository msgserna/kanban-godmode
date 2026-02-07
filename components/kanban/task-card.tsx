"use client"

import { Task } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiCalendarLine, RiTimeLine, RiMoreLine, RiEditLine, RiDeleteBinLine } from "@remixicon/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const priorityColors = {
  low: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  high: "bg-red-100 text-red-800 hover:bg-red-200",
};

const priorityLabels = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const isOverdue = task.fechaLimite && new Date(task.fechaLimite) < new Date() && task.estado !== "done";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight">
            {task.titulo}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Opciones de tarea"
              >
                <RiMoreLine className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(task)}>
                <RiEditLine className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(task.id)}
                className="text-destructive focus:text-destructive"
              >
                <RiDeleteBinLine className="h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.descripcion && (
          <CardDescription className="mt-1 text-sm">
            {task.descripcion}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className={priorityColors[task.prioridad]}
          >
            {priorityLabels[task.prioridad]}
          </Badge>
          {task.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 pt-0 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <RiTimeLine className="h-3.5 w-3.5" />
          <span>{task.estimacionMin}min</span>
        </div>
        {task.fechaLimite && (
          <div className={`flex items-center gap-1 ${isOverdue ? "font-medium text-red-600" : ""}`}>
            <RiCalendarLine className="h-3.5 w-3.5" />
            <span>{formatDate(task.fechaLimite)}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
