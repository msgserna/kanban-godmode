"use client"

import { useState, useMemo } from "react";
import { useApp } from "@/lib/app-context";
import { Task, GodModeEval, GodModeSummary } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiStarFill, RiStarLine, RiCheckLine, RiEditLine } from "@remixicon/react";
import { RubricEvalDialog } from "./rubric-eval-dialog";

export function GodModePanel() {
  const { state, saveGodModeEval } = useApp();
  const [filter, setFilter] = useState<"all" | "evaluated" | "pending">("all");
  const [evalTask, setEvalTask] = useState<Task | null>(null);

  // Calculate summary
  const summary: GodModeSummary = useMemo(() => {
    const totalTasks = state.tasks.length;
    const evaluatedTasks = state.godModeEvals.length;
    const unevaluatedTasks = totalTasks - evaluatedTasks;

    const scores = state.godModeEvals.map((e) => e.rubrica);
    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

    return {
      totalTasks,
      evaluatedTasks,
      unevaluatedTasks,
      averageScore: Math.round(averageScore * 10) / 10,
    };
  }, [state.tasks, state.godModeEvals]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let tasks = state.tasks;

    if (filter === "evaluated") {
      const evaluatedIds = new Set(state.godModeEvals.map((e) => e.taskId));
      tasks = tasks.filter((t) => evaluatedIds.has(t.id));
    } else if (filter === "pending") {
      const evaluatedIds = new Set(state.godModeEvals.map((e) => e.taskId));
      tasks = tasks.filter((t) => !evaluatedIds.has(t.id));
    }

    return tasks;
  }, [state.tasks, state.godModeEvals, filter]);

  const handleSaveEval = (evalData: Omit<GodModeEval, "fechaEval">) => {
    saveGodModeEval(evalData);
  };

  const existingEvalForTask = evalTask
    ? state.godModeEvals.find((e) => e.taskId === evalTask.id)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="mx-auto max-w-2xl border-2 border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Total Tareas</p>
              <p className="text-2xl font-bold text-foreground/70">{summary.totalTasks}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Evaluadas</p>
              <p className="text-2xl font-bold text-foreground/70">
                {summary.evaluatedTasks}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Sin Evaluar</p>
              <p className="text-2xl font-bold text-foreground/70">
                {summary.unevaluatedTasks}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Media</p>
              <p className="text-2xl font-bold text-primary">
                {summary.averageScore.toFixed(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label htmlFor="filter">Filtrar:</Label>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger id="filter" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas ({state.tasks.length})</SelectItem>
            <SelectItem value="evaluated">
              Evaluadas ({summary.evaluatedTasks})
            </SelectItem>
            <SelectItem value="pending">
              Sin evaluar ({summary.unevaluatedTasks})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "No hay tareas para evaluar"
                  : filter === "evaluated"
                  ? "No hay tareas evaluadas todavia"
                  : "Todas las tareas han sido evaluadas"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const existing = state.godModeEvals.find((e) => e.taskId === task.id);
            return (
              <Card key={task.id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 py-4">
                  {/* Task info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">{task.titulo}</h4>
                      {existing && (
                        <Badge variant="default" className="shrink-0">
                          <RiCheckLine className="h-3 w-3 mr-1" />
                          Evaluada
                        </Badge>
                      )}
                    </div>
                    {existing && existing.criterios.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {existing.criterios.length} criterio{existing.criterios.length !== 1 ? "s" : ""} evaluado{existing.criterios.length !== 1 ? "s" : ""}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-auto">
                      <Badge variant="outline" className="text-xs">
                        {task.estado.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.prioridad}
                      </Badge>
                      {task.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {task.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{task.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment and Score */}
                  {existing && (
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Comment (truncated if long) */}
                      {existing.observaciones && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm text-muted-foreground max-w-[200px] truncate cursor-help">
                              {existing.observaciones}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-sm">
                            <p className="whitespace-pre-wrap">{existing.observaciones}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {/* Score */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl font-bold">{existing.rubrica.toFixed(1)}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            idx < Math.round(existing.rubrica / 2) ? (
                              <RiStarFill key={idx} className="h-3 w-3 text-primary" />
                            ) : (
                              <RiStarLine key={idx} className="h-3 w-3 text-gray-300" />
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Evaluate button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={existing ? "outline" : "default"}
                        size="sm"
                        onClick={() => setEvalTask(task)}
                        className="shrink-0 gap-2"
                      >
                        <RiEditLine className="h-4 w-4" />
                        {existing ? "Editar" : "Evaluar"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {existing ? "Editar evaluacion" : "Evaluar esta tarea"}
                    </TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Rubric Dialog */}
      {evalTask && (
        <RubricEvalDialog
          open={!!evalTask}
          onOpenChange={(open) => !open && setEvalTask(null)}
          task={evalTask}
          existingEval={existingEvalForTask}
          onSave={handleSaveEval}
        />
      )}
    </div>
  );
}
