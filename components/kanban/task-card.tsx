"use client"

import { Task, Priority } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RiCalendarLine, RiEditLine, RiDeleteBinLine, RiAlarmWarningLine, RiFlashlightLine, RiUserLine, RiDraggable, RiTimeLine } from "@remixicon/react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  dragHandleProps?: Record<string, unknown>;
}

const priorityColors: Record<Priority, string> = {
  low: "bg-blue-500 text-white",
  medium: "bg-yellow-500 text-white",
  high: "bg-red-500 text-white",
};

const priorityBorderColors: Record<Priority, string> = {
  low: "border-l-blue-500",
  medium: "border-l-yellow-500",
  high: "border-l-red-500",
};

const priorityLabels: Record<Priority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

/** Generate a consistent color from a string hash */
function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
    "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
    "bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800",
    "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
    "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
    "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
  ];

  return colors[Math.abs(hash) % colors.length];
}

/** Get estimation color based on minutes */
function getEstimationColor(min: number): string {
  if (min <= 30) return "bg-emerald-500";
  if (min <= 60) return "bg-sky-500";
  if (min <= 120) return "bg-amber-500";
  return "bg-red-500";
}

export function TaskCard({ task, onEdit, onDelete, dragHandleProps }: TaskCardProps) {
  const isOverdue = task.fechaLimite && new Date(task.fechaLimite) < new Date() && task.estado !== "done";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  const relativeCreation = (() => {
    try {
      return formatDistanceToNow(new Date(task.fechaCreacion), { locale: es });
    } catch {
      return null;
    }
  })();

  // Estimation bar width (capped at 240min for visual purposes)
  const estimationPercent = Math.min((task.estimacionMin / 240) * 100, 100);

  return (
    <Card className={`group relative border-l-4 transition-shadow hover:shadow-md ${priorityBorderColors[task.prioridad]}`}>
      {/* Drag Handle */}
      <div
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-40 active:cursor-grabbing"
        {...dragHandleProps}
      >
        <RiDraggable className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Action Buttons - top right */}
      <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit?.(task)}
              aria-label="Editar tarea"
            >
              <RiEditLine className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editar</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete?.(task.id)}
              aria-label="Eliminar tarea"
            >
              <RiDeleteBinLine className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Eliminar</TooltipContent>
        </Tooltip>
      </div>

      <CardHeader className="pb-3 pl-6 pr-16">
        <CardTitle className="text-base font-semibold leading-tight">
          {task.titulo}
        </CardTitle>
        {task.descripcion && (
          <CardDescription className="mt-1 line-clamp-2 text-sm">
            {task.descripcion}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-3 pl-6">
        <div className="flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <Badge key={tag} variant="outline" className={getTagColor(tag)}>
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="mt-1 flex flex-col gap-2 border-t border-border/50 pl-6 pt-3 text-xs">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm">
                  <RiUserLine className="h-3.5 w-3.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Alumno/a</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-1 text-muted-foreground">
                  <RiFlashlightLine className="h-3.5 w-3.5 text-violet-500" />
                  <span className="font-medium">{task.estimacionMin}min</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Estimacion: {task.estimacionMin} minutos</span>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${getEstimationColor(task.estimacionMin)}`}
                      style={{ width: `${estimationPercent}%` }}
                    />
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          {task.fechaLimite && (
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
              isOverdue
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                : "bg-muted/80 text-muted-foreground"
            }`}>
              {isOverdue ? (
                <RiAlarmWarningLine className="h-3.5 w-3.5 animate-pulse" />
              ) : (
                <RiCalendarLine className="h-3.5 w-3.5 text-emerald-500" />
              )}
              <span>{formatDate(task.fechaLimite)}</span>
            </div>
          )}
        </div>

        {/* Creation date */}
        {relativeCreation && (
          <div className="flex w-full items-center gap-1 text-[10px] text-muted-foreground/60">
            <RiTimeLine className="h-3 w-3" />
            <span>creada hace {relativeCreation}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
