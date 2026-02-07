"use client"

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RiSearchLine, RiQuestionLine, RiCloseLine } from "@remixicon/react";
import { QUERY_EXAMPLES } from "@/lib/query";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
  totalCount?: number;
}

export function SearchBar({ value, onChange, resultCount, totalCount }: SearchBarProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Buscar tareas... (ej: tag:react p:high)"
            className="pl-10 pr-10"
            aria-label="Buscar tareas con operadores"
            aria-describedby="search-help"
          />
          {value && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={handleClear}
              aria-label="Limpiar búsqueda"
            >
              <RiCloseLine className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Help Button */}
        <Popover open={isHelpOpen} onOpenChange={setIsHelpOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Ayuda de búsqueda"
            >
              <RiQuestionLine className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px]" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Operadores de búsqueda
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Usa estos operadores para filtrar tareas de forma avanzada
                </p>
              </div>

              <div className="space-y-2">
                {QUERY_EXAMPLES.map((example, idx) => (
                  <div
                    key={idx}
                    className="group cursor-pointer rounded-md border p-2 transition-colors hover:bg-muted"
                    onClick={() => {
                      onChange(example.query);
                      setIsHelpOpen(false);
                    }}
                  >
                    <code className="text-sm font-mono text-primary">
                      {example.query}
                    </code>
                    <p className="text-xs text-muted-foreground mt-1">
                      {example.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> Puedes combinar operadores con texto
                  libre. Ej: <code className="text-xs">tag:bug p:high urgente</code>
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Results Count */}
      {value && resultCount !== undefined && totalCount !== undefined && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="font-normal">
            {resultCount} de {totalCount} tareas
          </Badge>
          {resultCount === 0 && (
            <span>No se encontraron resultados</span>
          )}
        </div>
      )}
    </div>
  );
}
