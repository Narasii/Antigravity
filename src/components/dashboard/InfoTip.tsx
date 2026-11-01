import { useRef, useState } from "react";
import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** A small (?) icon that opens an explanation card on hover or click/tap. */
export function InfoTip({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`What is ${title}?`}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <HelpCircle className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={8}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="glass w-72 rounded-xl border-border p-4"
      >
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{children}</p>
      </PopoverContent>
    </Popover>
  );
}
