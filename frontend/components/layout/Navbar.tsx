'use client';

// ============================================================================
// TECHWARDS ACADEMY - NAVBAR COMPONENT
// Main navigation bar with user menu
// ============================================================================

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { GraduationCap, BookOpen, FileText, LogOut, User, LayoutDashboard } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const pathname = usePathname();

    if (!isAuthenticated) return null;

    const isAdmin = user?.role === 'ADMIN';

    const navLinks = isAdmin
        ? [
            { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/admin/courses', label: 'Courses', icon: BookOpen },
            { href: '/admin/students', label: 'Students', icon: User },
        ]
        : [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/courses', label: 'Courses', icon: BookOpen },
            { href: '/notes', label: 'My Notes', icon: FileText },
        ];

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">Techwards Academy</span>
                    </Link>

                    {/* Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                                        isActive
                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                            <div className="text-xs text-gray-500">{user?.role}</div>
                        </div>

                        <button
                            onClick={() => logout()}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
