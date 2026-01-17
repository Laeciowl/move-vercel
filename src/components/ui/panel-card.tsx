import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface PanelCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "accent";
  hover?: boolean;
  glow?: boolean;
}

const variantStyles = {
  default: "bg-card border-border",
  success: "bg-card border-green-200 dark:border-green-800",
  warning: "bg-card border-amber-200 dark:border-amber-800",
  danger: "bg-card border-red-200 dark:border-red-800",
  accent: "bg-gradient-to-br from-primary/5 via-transparent to-accent/10 border-primary/20",
};

const PanelCard = React.forwardRef<HTMLDivElement, PanelCardProps>(
  ({ className, children, variant = "default", hover = true, glow = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "relative rounded-2xl border p-4 backdrop-blur-sm transition-all duration-300",
          variantStyles[variant],
          hover && "hover:shadow-card hover:border-primary/30 hover:-translate-y-0.5",
          glow && "shadow-soft",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
PanelCard.displayName = "PanelCard";

interface PanelCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  iconClassName?: string;
}

const PanelCardHeader = React.forwardRef<HTMLDivElement, PanelCardHeaderProps>(
  ({ className, children, icon, iconClassName, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-3 mb-4", className)}
        {...props}
      >
        {icon && (
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 transition-transform duration-300 group-hover:scale-110",
            iconClassName
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    );
  }
);
PanelCardHeader.displayName = "PanelCardHeader";

const PanelCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-bold text-foreground leading-tight", className)}
    {...props}
  />
));
PanelCardTitle.displayName = "PanelCardTitle";

const PanelCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
PanelCardDescription.displayName = "PanelCardDescription";

const PanelCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-4", className)}
    {...props}
  />
));
PanelCardContent.displayName = "PanelCardContent";

const PanelCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 pt-4 border-t border-border/50", className)}
    {...props}
  />
));
PanelCardFooter.displayName = "PanelCardFooter";

interface StatCardProps {
  value: string | number;
  label: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ value, label, trend = "neutral", className, ...props }, ref) => {
    const trendColors = {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-primary",
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "relative rounded-xl p-4 text-center bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 overflow-hidden group",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className={cn("text-2xl font-bold transition-transform duration-300 group-hover:scale-110", trendColors[trend])}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </motion.div>
    );
  }
);
StatCard.displayName = "StatCard";

export {
  PanelCard,
  PanelCardHeader,
  PanelCardTitle,
  PanelCardDescription,
  PanelCardContent,
  PanelCardFooter,
  StatCard,
};
