import * as React from "react"

import { cn } from "~/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  status?: "SUCCESS" | "ERROR" | "WARNING"
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, status, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full font-semibold border border-transparent rounded-md placeholder:text-grayMain border-grayMain text-blackMain bg-whiteLigth px-3 py-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          {
            "border-red-500": status === 'ERROR',
            "border-green-500": status === 'SUCCESS',
            "border-yellow-500": status === 'WARNING'
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
