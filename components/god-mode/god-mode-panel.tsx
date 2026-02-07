"use client"

import { useState, useMemo } from "react";
import { useApp } from "@/lib/app-context";
import { Task, GodModeEval, GodModeSummary } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiStarFill, RiStarLine, RiCheckLine } from "@remixicon/react";

interface TaskEvalFormProps {
  task: Task;
  existingEval?: GodModeEval;
  onSave: (taskId: string, observaciones: string, rubrica: number) => void;
}

function TaskEvalForm({ task, existingEval, onSave }: TaskEvalFormProps) {
  const [observaciones, setObservaciones] = useState(existingEval?.observaciones || "");
  const [rubrica, setRubrica] = useState(existingEval?.rubrica?.toString() || "");

  const handleSave = () => {
    const score = parseInt(rubrica, 10);
    if (isNaN(score) || score < 0 || score > 10) {
      return;
    }
    onSave(task.id, observaciones, score);
  };

  const isValid = rubrica && !isNaN(parseInt(rubrica, 10)) && parseInt(rubrica, 10) >= 0 && parseInt(rubrica, 10) <= 10;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{task.titulo}</CardTitle>
            <CardDescription className="mt-1">
              {task.descripcion || "Sin descripción"}
            </CardDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {task.estado.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {task.prioridad}
              </Badge>
              {task.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          {existingEval && (
            <Badge variant="default" className="ml-2">
              <RiCheckLine className="h-3 w-3 mr-1" />
              Evaluada
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`obs-${task.id}`}>Observaciones de Javi</Label>
          <Textarea
            id={`obs-${task.id}`}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Escribe tus observaciones sobre esta tarea..."
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor={`score-${task.id}`}>Rúbrica (0-10)</Label>
            <Input
              id={`score-${task.id}`}
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={rubrica}
              onChange={(e) => setRubrica(e.target.value)}
              placeholder="0-10"
              className="w-full"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="shrink-0"
          >
            Guardar Evaluación
          </Button>
        </div>

        {rubrica && isValid && (
          <div className="flex items-center gap-1">
            {Array.from({ length: 10 }).map((_, idx) => {
              const score = parseInt(rubrica, 10);
              return idx < score ? (
                <RiStarFill key={idx} className="h-4 w-4 text-yellow-500" />
              ) : (
                <RiStarLine key={idx} className="h-4 w-4 text-gray-300" />
              );
            })}
            <span className="ml-2 text-sm font-medium">{rubrica}/10</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function GodModePanel() {
  const { state, saveGodModeEval } = useApp();
  const [filter, setFilter] = useState<"all" | "evaluated" | "pending">("all");

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

  const handleSaveEval = (taskId: string, observaciones: string, rubrica: number) => {
    saveGodModeEval({
      taskId,
      observaciones,
      rubrica,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👑 Panel Resumen - Modo Dios
          </CardTitle>
          <CardDescription>
            Estadísticas de evaluación de tareas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Tareas</p>
              <p className="text-3xl font-bold">{summary.totalTasks}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Evaluadas</p>
              <p className="text-3xl font-bold text-green-600">
                {summary.evaluatedTasks}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sin Evaluar</p>
              <p className="text-3xl font-bold text-orange-600">
                {summary.unevaluatedTasks}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Media</p>
              <p className="text-3xl font-bold text-blue-600">
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
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "No hay tareas para evaluar"
                  : filter === "evaluated"
                  ? "No hay tareas evaluadas todavía"
                  : "Todas las tareas han sido evaluadas"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const existingEval = state.godModeEvals.find((e) => e.taskId === task.id);
            return (
              <TaskEvalForm
                key={task.id}
                task={task}
                existingEval={existingEval}
                onSave={handleSaveEval}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
