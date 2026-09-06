import React from 'react';
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // ✅ Estilos refinados para Ese Accesorios
        "flex min-h-[100px] w-full rounded-sm border border-stone-200 bg-white/80 px-4 py-3 text-base text-neutral-800 leading-relaxed",
        "placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-500",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
