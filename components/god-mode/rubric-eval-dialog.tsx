"use client"

import { useState, useEffect, useMemo } from "react";
import { Task, GodModeEval, RubricaCriterio } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RiAddLine, RiDeleteBinLine, RiStarFill, RiStarLine } from "@remixicon/react";

const MAX_CRITERIOS = 10;
const SCORES = Array.from({ length: 11 }, (_, i) => i); // 0-10

interface RubricEvalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  existingEval?: GodModeEval;
  onSave: (data: Omit<GodModeEval, "fechaEval">) => void;
}

function emptyCriterio(): RubricaCriterio {
  return { nombre: "", puntuacion: 0 };
}

export function RubricEvalDialog({
  open,
  onOpenChange,
  task,
  existingEval,
  onSave,
}: RubricEvalDialogProps) {
  const [criterios, setCriterios] = useState<RubricaCriterio[]>([emptyCriterio()]);
  const [observaciones, setObservaciones] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (existingEval && existingEval.criterios.length > 0) {
        setCriterios(existingEval.criterios.map((c) => ({ ...c })));
        setObservaciones(existingEval.observaciones);
      } else {
        setCriterios([emptyCriterio()]);
        setObservaciones(existingEval?.observaciones || "");
      }
    }
  }, [open, existingEval]);

  const media = useMemo(() => {
    const validCriterios = criterios.filter((c) => c.nombre.trim());
    if (validCriterios.length === 0) return 0;
    const sum = validCriterios.reduce((acc, c) => acc + c.puntuacion, 0);
    return Math.round((sum / validCriterios.length) * 10) / 10;
  }, [criterios]);

  const addCriterio = () => {
    if (criterios.length < MAX_CRITERIOS) {
      setCriterios([...criterios, emptyCriterio()]);
    }
  };

  const removeCriterio = (index: number) => {
    if (criterios.length > 1) {
      setCriterios(criterios.filter((_, i) => i !== index));
    }
  };

  const updateCriterioNombre = (index: number, nombre: string) => {
    const updated = [...criterios];
    updated[index] = { ...updated[index], nombre };
    setCriterios(updated);
  };

  const updateCriterioPuntuacion = (index: number, puntuacion: number) => {
    const updated = [...criterios];
    updated[index] = { ...updated[index], puntuacion };
    setCriterios(updated);
  };

  const validCriterios = criterios.filter((c) => c.nombre.trim());
  const canSave = validCriterios.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      taskId: task.id,
      observaciones,
      criterios: validCriterios,
      rubrica: media,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evaluar: {task.titulo}</DialogTitle>
          <DialogDescription>
            Agrega criterios de evaluacion (max. {MAX_CRITERIOS}) y asigna una nota del 0 al 10 a cada uno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Criterios list */}
          <div className="space-y-3">
            <Label>Criterios de evaluacion</Label>
            {criterios.map((criterio, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-5 shrink-0">
                  {index + 1}.
                </span>
                <Input
                  placeholder="Nombre del criterio..."
                  value={criterio.nombre}
                  onChange={(e) => updateCriterioNombre(index, e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={criterio.puntuacion.toString()}
                  onValueChange={(v) => updateCriterioPuntuacion(index, parseInt(v, 10))}
                >
                  <SelectTrigger className="w-20 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCORES.map((score) => (
                      <SelectItem key={score} value={score.toString()}>
                        {score}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeCriterio(index)}
                      disabled={criterios.length <= 1}
                    >
                      <RiDeleteBinLine className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Eliminar criterio</TooltipContent>
                </Tooltip>
              </div>
            ))}

            {criterios.length < MAX_CRITERIOS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCriterio}
                className="w-full gap-2"
              >
                <RiAddLine className="h-4 w-4" />
                Anadir criterio ({criterios.length}/{MAX_CRITERIOS})
              </Button>
            )}
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="obs">Observaciones</Label>
            <Textarea
              id="obs"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Escribe observaciones sobre esta tarea..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Media preview */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Media:</span>
              <span className="text-2xl font-bold">{media.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">/10</span>
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 10 }).map((_, idx) => (
                idx < Math.round(media) ? (
                  <RiStarFill key={idx} className="h-4 w-4 text-primary" />
                ) : (
                  <RiStarLine key={idx} className="h-4 w-4 text-gray-300" />
                )
              ))}
            </div>
          </div>
          {validCriterios.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {validCriterios.length} criterio{validCriterios.length !== 1 ? "s" : ""} evaluado{validCriterios.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Guardar Evaluacion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
