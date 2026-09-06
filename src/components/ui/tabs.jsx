import React from 'react';
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // ✅ Fondo elegante y sobrio para lista de tabs
      "inline-flex h-10 items-center justify-center rounded-sm bg-stone-50 border border-stone-200 text-stone-600",
      className
    )}
    {...props} />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // ✅ Aplicando paleta y transiciones suaves
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-4 py-2 text-sm font-light tracking-wide text-stone-600 transition-all duration-500",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 focus-visible:ring-offset-2",
      "data-[state=active]:bg-white data-[state=active]:text-neutral-800 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-stone-200",
      "hover:bg-neutral-100 hover:text-neutral-800",
      className
    )}
    {...props} />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 p-4 bg-white/80 border border-stone-100 rounded-sm transition-all duration-500",
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 focus-visible:ring-offset-2",
      className
    )}
    {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
