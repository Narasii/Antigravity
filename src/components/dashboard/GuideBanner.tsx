import { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/** Collapsible quick-start banner explaining what the panel monitors. */
export function GuideBanner() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="glass rounded-2xl">
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-6 py-4 text-left">
        <span className="grid size-8 place-items-center rounded-lg bg-memory/10 text-memory">
          <BookOpen className="size-4" />
        </span>
        <span className="mr-auto">
          <span className="block text-sm font-semibold">How NeuroStream-X Works</span>
          <span className="block text-xs text-muted-foreground">Quick start · system guide</span>
        </span>
        <span className="hidden text-xs text-muted-foreground sm:inline">{open ? "Hide" : "Show"}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-300", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="border-t border-border px-6 py-5 text-sm leading-relaxed text-muted-foreground">
          <p>
            Instead of copying training data from disk into memory and then again into the GPU, NeuroStream-X
            <span className="text-memory"> memory-maps </span>
            your dataset files so the operating system pages them in directly, with zero extra copies.
          </p>
          <p className="mt-3">
            It then pins those pages and lines them up with your CPU and NVMe layout, so batches reach the GPU in
            under a millisecond — use the controls below to tune batch size and the mapping window, and watch the
            vitals respond.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
