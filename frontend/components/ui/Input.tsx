// ============================================================================
// TECHWARDS ACADEMY - INPUT COMPONENT
// Reusable input field with error states
// ============================================================================

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

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
    type,
    value,
    ...props
}: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    // Ensure value is never undefined to prevent controlled/uncontrolled issues
    const inputValue = value || '';

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

            <div className="relative">
                <input
                    id={inputId}
                    type={isPassword && showPassword ? 'text' : (type || 'text')}
                    value={inputValue}
                    className={cn(
                        'w-full px-4 py-2.5 border rounded-lg transition-all duration-200',
                        'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                        'placeholder:text-gray-400',
                        isPassword && 'pr-12',
                        error
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300',
                        className
                    )}
                    {...props}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                )}
            </div>

            {error && (
                <p className="mt-1.5 text-sm text-red-600">{error}</p>
            )}

            {helperText && !error && (
                <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
}
