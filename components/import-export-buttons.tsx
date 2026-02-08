"use client"

import { useRef } from "react";
import { useApp } from "@/lib/app-context";
import { importFromJSON } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RiDownloadLine, RiUploadLine } from "@remixicon/react";
import { toast } from "sonner";
import { useState } from "react";

export function ImportExportButtons() {
  const { exportData, importData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const handleExport = () => {
    try {
      exportData();
      toast.success("Datos exportados correctamente");
    } catch (error) {
      toast.error("Error al exportar datos");
      console.error(error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importFromJSON(text);

      if (!result.success) {
        // Show validation errors
        const errorMessages = result.errors.map(
          (err) => `${err.field}: ${err.message}`
        );
        setImportErrors(errorMessages);
        setShowErrorDialog(true);
        toast.error("Error al importar: archivo JSON inválido");
        return;
      }

      // Import successful
      if (result.data) {
        importData(result.data);

        if (result.duplicateIdsResolved && result.duplicateIdsResolved > 0) {
          toast.success(
            `Datos importados (${result.duplicateIdsResolved} IDs duplicados regenerados)`
          );
        } else {
          toast.success("Datos importados correctamente");
        }
      }
    } catch (error) {
      toast.error("Error al leer el archivo");
      console.error(error);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="default"
              onClick={handleExport}
              className="gap-2 hover:bg-primary/20 hover:text-foreground"
              aria-label="Exportar datos"
            >
              <RiDownloadLine className="h-4 w-4" />
              Exportar
            </Button>
          </TooltipTrigger>
          <TooltipContent>Descarga todas las tareas en JSON</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="default"
              onClick={handleImportClick}
              className="gap-2 hover:bg-primary/20 hover:text-foreground"
              aria-label="Importar datos"
            >
              <RiUploadLine className="h-4 w-4" />
              Importar
            </Button>
          </TooltipTrigger>
          <TooltipContent>Carga tareas desde un archivo JSON</TooltipContent>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error al importar datos</AlertDialogTitle>
            <AlertDialogDescription>
              El archivo JSON contiene errores de validación:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[300px] overflow-y-auto rounded-md border bg-muted p-4">
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {importErrors.map((error, idx) => (
                <li key={idx} className="text-destructive">
                  {error}
                </li>
              ))}
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
