"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateTARProgress, updateTARStatus } from "@/app/actions/tars";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface ActiveTar {
  id: string;
  description: string;
  progress: number;
  status: string;
  bigRockId: string;
  bigRockTitle: string;
}

interface ActiveTarsPanelProps {
  tars: ActiveTar[];
  translations: {
    title: string;
    markComplete: string;
    noActiveTars: string;
    collapse: string;
    expand: string;
  };
}

function TarRow({
  tar,
  translations: t,
}: {
  tar: ActiveTar;
  translations: ActiveTarsPanelProps["translations"];
}) {
  const [progress, setProgress] = useState(tar.progress);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleProgressChange = useCallback(
    (newProgress: number) => {
      setProgress(newProgress);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        startTransition(async () => {
          await updateTARProgress(tar.id, newProgress);
        });
      }, 500);
    },
    [tar.id]
  );

  const handleComplete = useCallback(() => {
    startTransition(async () => {
      const result = await updateTARStatus(tar.id, "COMPLETADA");
      if (result.success) {
        setIsCompleted(true);
        setProgress(100);
      }
    });
  }, [tar.id]);

  if (isCompleted) {
    return (
      <div className="flex items-center gap-3 py-2 px-1 opacity-60">
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        <span className="text-sm line-through flex-1 truncate">
          {tar.description}
        </span>
        <span className="text-xs text-green-600 font-medium">100%</span>
      </div>
    );
  }

  return (
    <div className="py-2 px-1 space-y-1.5">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <Badge variant="outline" className="text-[10px] font-normal mb-1">
            {tar.bigRockTitle}
          </Badge>
          <p className="text-sm truncate">{tar.description}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs shrink-0"
          onClick={handleComplete}
          disabled={isPending}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          <span className="hidden sm:inline">{t.markComplete}</span>
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(e) => handleProgressChange(Number(e.target.value))}
          className="flex-1 h-2 accent-blue-600 cursor-pointer"
          disabled={isPending}
        />
        <span className="text-xs font-medium w-8 text-right">{progress}%</span>
      </div>
    </div>
  );
}

export function ActiveTarsPanel({ tars, translations: t }: ActiveTarsPanelProps) {
  const [expanded, setExpanded] = useState(true);

  // Group TARs by Big Rock
  const grouped = tars.reduce<Record<string, ActiveTar[]>>((acc, tar) => {
    if (!acc[tar.bigRockId]) acc[tar.bigRockId] = [];
    acc[tar.bigRockId].push(tar);
    return acc;
  }, {});

  if (tars.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">{t.title}</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 mr-1" />
                {t.collapse}
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                {t.expand}
              </>
            )}
          </Button>
        </div>
        {expanded && (
          <div className="space-y-1 divide-y">
            {Object.values(grouped)
              .flat()
              .map((tar) => (
                <TarRow key={tar.id} tar={tar} translations={t} />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
