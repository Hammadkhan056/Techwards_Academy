// ============================================================================
// TECHWARDS ACADEMY - CARD COMPONENT
// Reusable card container
// ============================================================================

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

export default function Card({ children, className, hover = false, onClick }: CardProps) {
    return (
        <div
            className={cn(
                'bg-white rounded-xl shadow-md p-6 transition-all duration-300',
                hover && 'hover:shadow-xl hover:-translate-y-1 cursor-pointer',
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
