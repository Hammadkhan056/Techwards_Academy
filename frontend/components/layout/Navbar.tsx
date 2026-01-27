'use client';

// ============================================================================
// TECHWARDS ACADEMY - NAVBAR COMPONENT
// Main navigation bar with user menu
// ============================================================================

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { GraduationCap, BookOpen, FileText, LogOut, User, LayoutDashboard, ChevronDown, Edit, Eye, TestTube, Menu, X as CloseIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const pathname = usePathname();
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isAuthenticated) return null;

    const isAdmin = user?.role === 'ADMIN';

    const navLinks = isAdmin
        ? [
            { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/admin/courses', label: 'Courses', icon: BookOpen },
            { href: '/admin/tests', label: 'Tests', icon: TestTube },
            { href: '/admin/students', label: 'Students', icon: User },
        ]
        : [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/courses', label: 'Courses', icon: BookOpen },
            { href: '/tests', label: 'Tests', icon: TestTube },
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

                    {/* Desktop Nav Links */}
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
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            {isMobileMenuOpen ? (
                                <CloseIcon className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>

                        <div className="hidden sm:block text-right">
                            <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                            <div className="text-xs text-gray-500">{user?.role}</div>
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isProfileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    {/* Profile Header */}
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{user?.name}</div>
                                                <div className="text-sm text-gray-500">{user?.email}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dropdown Items */}
                                    <div className="py-1">
                                        <Link
                                            href="/profile"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            <Eye className="w-4 h-4 text-gray-400" />
                                            <span>View Profile</span>
                                        </Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsProfileDropdownOpen(false);
                                            }}
                                            className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
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
                    </div>
                )}
            </div>
        </nav>
    );
}
