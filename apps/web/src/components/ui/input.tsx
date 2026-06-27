import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-[#c8d2cb] bg-white px-3 text-sm text-[#17201a] outline-none transition placeholder:text-[#8a978f] focus:border-[#3b6f6a] focus:ring-2 focus:ring-[#3b6f6a]/20 disabled:cursor-not-allowed disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
