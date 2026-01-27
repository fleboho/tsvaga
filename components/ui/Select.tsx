'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  id?: string;
  name?: string;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ 
    value, 
    onChange, 
    options, 
    placeholder = "Select...", 
    disabled = false,
    loading = false,
    error,
    className,
    id,
    name,
    ...props 
  }, ref) => {
    const handleValueChange = (newValue: string) => {
      if (onChange) {
        onChange(newValue);
      }
    };

    return (
      <div className="w-full">
        <SelectPrimitive.Root 
          value={value} 
          onValueChange={handleValueChange}
          disabled={disabled || loading}
          name={name}
        >
          <SelectPrimitive.Trigger
            ref={ref}
            id={id}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error ? "border-red-500 focus:ring-red-500" : "",
              loading ? "opacity-70 cursor-wait" : "",
              className
            )}
            {...props}
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                loading ? "animate-spin" : ""
              )} />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
              position="popper"
              sideOffset={4}
            >
              <SelectPrimitive.Viewport className="p-1">
                {options
                  .filter((option) => option.value !== '') // Filter out empty string values
                  .map((option) => (
                    <SelectPrimitive.Item
                      key={option.value}
                      value={option.value}
                      className={cn(
                        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
                        "focus:bg-primary-50 focus:text-primary-900",
                        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      )}
                    >
                      <SelectPrimitive.ItemText>
                        {option.label}
                      </SelectPrimitive.ItemText>
                      <SelectPrimitive.ItemIndicator className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary-600" />
                      </SelectPrimitive.ItemIndicator>
                    </SelectPrimitive.Item>
                  ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;