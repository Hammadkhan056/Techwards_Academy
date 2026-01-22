// ============================================================================
// TECHWARDS ACADEMY - INPUT COMPONENT
// Reusable input field with error states
// ============================================================================

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export default function Input({
    label,
    error,
    helperText,
    className,
    id,
    ...props
}: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                    {label}
                </label>
            )}

            <input
                id={inputId}
                className={cn(
                    'w-full px-4 py-2.5 border rounded-lg transition-all duration-200',
                    'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'placeholder:text-gray-400',
                    error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300',
                    className
                )}
                {...props}
            />

            {error && (
                <p className="mt-1.5 text-sm text-red-600">{error}</p>
            )}

            {helperText && !error && (
                <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
}
