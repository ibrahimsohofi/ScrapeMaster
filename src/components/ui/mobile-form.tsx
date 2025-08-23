"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface MobileFormProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const MobileForm = React.forwardRef<HTMLDivElement, MobileFormProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "space-y-6 p-4 sm:p-6 max-w-none sm:max-w-2xl mx-auto",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
MobileForm.displayName = "MobileForm"

interface MobileFormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  description?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

const MobileFormField = React.forwardRef<HTMLDivElement, MobileFormFieldProps>(
  ({ className, label, description, error, required, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      >
        {label && (
          <label className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <div className="space-y-1">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                className: cn(
                  "min-h-[48px] text-base sm:min-h-[40px] sm:text-sm touch-target mobile-focus",
                  child.props.className
                ),
              } as any)
            }
            return child
          })}
        </div>
        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}
      </div>
    )
  }
)
MobileFormField.displayName = "MobileFormField"

interface MobileFormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const MobileFormActions = React.forwardRef<HTMLDivElement, MobileFormActionsProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6",
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              className: cn(
                "min-h-[48px] text-base font-medium sm:min-h-[40px] sm:text-sm touch-target mobile-focus w-full sm:w-auto",
                child.props.className
              ),
            } as any)
          }
          return child
        })}
      </div>
    )
  }
)
MobileFormActions.displayName = "MobileFormActions"

export { MobileForm, MobileFormField, MobileFormActions }
