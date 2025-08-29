import * as React from "react"
import { CheckIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'checked'> {
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  checked?: boolean | 'indeterminate';
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(event.target.checked);
      }
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="absolute w-0 h-0 opacity-0"
          ref={ref}
          checked={checked === 'indeterminate' ? false : checked}
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-slate-300 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            checked
              ? "bg-pink-500 text-white border-pink-500"
              : "bg-white",
            className
          )}
        >
          {checked && (
            <CheckIcon className="h-3 w-3 text-white" />
          )}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox } 