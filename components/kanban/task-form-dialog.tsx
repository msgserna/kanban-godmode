"use client"

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Task, TaskStatus, Priority } from "@/types";
import { taskSchema, TaskFormValues, parseTags } from "@/lib/validations";
import { useApp } from "@/lib/app-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RiCalendarLine } from "@remixicon/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  defaultStatus?: TaskStatus;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultStatus = "todo",
}: TaskFormDialogProps) {
  const { createTask, updateTask } = useApp();
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      prioridad: "medium",
      tags: "",
      estimacionMin: 30,
      fechaLimite: "",
    },
  });

  const prioridad = watch("prioridad");
  const fechaLimite = watch("fechaLimite");

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (open && task) {
      reset({
        titulo: task.titulo,
        descripcion: task.descripcion || "",
        prioridad: task.prioridad,
        tags: task.tags.join(", "),
        estimacionMin: task.estimacionMin,
        fechaLimite: task.fechaLimite?.split("T")[0] || "",
      });
    } else if (open && !task) {
      reset({
        titulo: "",
        descripcion: "",
        prioridad: "medium",
        tags: "",
        estimacionMin: 30,
        fechaLimite: "",
      });
    }
  }, [open, task, reset]);

  const onSubmit = async (data: TaskFormValues) => {
    try {
      const tags = parseTags(data.tags);
      if (isEditing) {
        updateTask(task.id, {
          ...data,
          tags,
          fechaLimite: data.fechaLimite || undefined,
        });
      } else {
        createTask(
          {
            ...data,
            tags,
            fechaLimite: data.fechaLimite || undefined,
          },
          defaultStatus
        );
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Tarea" : "Crear Nueva Tarea"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los detalles de la tarea"
              : "Completa los campos para crear una nueva tarea"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="titulo"
              placeholder="Ej: Implementar autenticación"
              {...register("titulo")}
              aria-invalid={!!errors.titulo}
              aria-describedby={errors.titulo ? "titulo-error" : undefined}
            />
            {errors.titulo && (
              <p id="titulo-error" className="text-sm text-destructive">
                {errors.titulo.message}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Describe los detalles de la tarea..."
              rows={3}
              {...register("descripcion")}
              aria-invalid={!!errors.descripcion}
            />
            {errors.descripcion && (
              <p className="text-sm text-destructive">
                {errors.descripcion.message}
              </p>
            )}
          </div>

          {/* Prioridad */}
          <div className="space-y-2">
            <Label htmlFor="prioridad">
              Prioridad <span className="text-destructive">*</span>
            </Label>
            <Select
              value={prioridad}
              onValueChange={(value) => setValue("prioridad", value as Priority)}
            >
              <SelectTrigger id="prioridad" aria-label="Seleccionar prioridad">
                <SelectValue placeholder="Selecciona prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-blue-500" />
                    Baja
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-yellow-500" />
                    Media
                  </span>
                </SelectItem>
                <SelectItem value="high">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-red-500" />
                    Alta
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.prioridad && (
              <p className="text-sm text-destructive">
                {errors.prioridad.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Estimación */}
            <div className="space-y-2">
              <Label htmlFor="estimacionMin">
                Estimación (min) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="estimacionMin"
                type="number"
                min={1}
                {...register("estimacionMin", { valueAsNumber: true })}
                aria-invalid={!!errors.estimacionMin}
              />
              {errors.estimacionMin && (
                <p className="text-sm text-destructive">
                  {errors.estimacionMin.message}
                </p>
              )}
            </div>

            {/* Fecha Límite */}
            <div className="space-y-2">
              <Label>Fecha Límite</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !fechaLimite ? "text-muted-foreground" : ""
                    }`}
                  >
                    <RiCalendarLine className="mr-2 h-4 w-4" />
                    {fechaLimite
                      ? format(new Date(fechaLimite), "dd/MM/yyyy", { locale: es })
                      : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaLimite ? new Date(fechaLimite) : undefined}
                    onSelect={(date) => {
                      setValue("fechaLimite", date ? format(date, "yyyy-MM-dd") : "");
                    }}
                    locale={es}
                  />
                  {fechaLimite && (
                    <div className="border-t p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground"
                        onClick={() => setValue("fechaLimite", "")}
                      >
                        Quitar fecha
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separados por comas)</Label>
            <Input
              id="tags"
              placeholder="react, bug, frontend"
              {...register("tags")}
              aria-invalid={!!errors.tags}
              aria-describedby="tags-help"
            />
            <p id="tags-help" className="text-xs text-muted-foreground">
              Máximo 10 tags
            </p>
            {errors.tags && (
              <p className="text-sm text-destructive">{errors.tags.message}</p>
            )}
          </div>

          <DialogFooter>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cerrar sin guardar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Guardando..."
                    : isEditing
                    ? "Actualizar"
                    : "Crear Tarea"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isEditing ? "Guardar cambios" : "Crear la tarea"}
              </TooltipContent>
            </Tooltip>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
