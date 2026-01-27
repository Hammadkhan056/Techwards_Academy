'use client';

// ============================================================================
// TECHWARDS ACADEMY - STUDENT PROFILE
// View and update student profile information
// ============================================================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import type { User } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar, 
  BookOpen,
  Edit2,
  Save,
  X,
  CheckCircle,
  Camera,
  MapPin,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';

export default function StudentProfilePage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editMode = searchParams.get('edit') === 'true';
    
    const [profile, setProfile] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(editMode);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        age: '',
        father_name: '',
        city: '',
        address: '',
        education: '',
        bio: ''
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            loadProfile();
        }
    }, [user, authLoading, router]);

    const loadProfile = async () => {
        try {
            const data = await authApi.getCurrentUser();
            console.log('Initial profile data loaded:', data);
            console.log('Initial profile completion status:', data.is_profile_completed);
            console.log('Initial profile active status:', data.is_active);
            setProfile(data);
            setFormData({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                age: data.age?.toString() || '',
                father_name: data.father_name || '',
                city: data.city || '',
                address: data.address || '',
                education: data.education || '',
                bio: data.bio || ''
            });
        } catch (error) {
            console.error('Failed to load profile:', error);
            setError('Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        setError('');
        setSuccess('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (profile) {
            setFormData({
                name: profile.name || '',
                email: profile.email || '',
                phone: profile.phone || '',
                age: profile.age?.toString() || '',
                father_name: profile.father_name || '',
                city: profile.city || '',
                address: profile.address || '',
                education: profile.education || '',
                bio: profile.bio || ''
            });
        }
        setError('');
        setSuccess('');
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            // Store the old completion status before updating
            const wasCompleted = profile?.is_profile_completed || false;
            console.log('Before update - Profile completion status:', wasCompleted);

            const updateData = {
                name: formData.name,
                phone: formData.phone,
                age: formData.age ? parseInt(formData.age) : undefined,
                father_name: formData.father_name,
                city: formData.city,
                address: formData.address,
                education: formData.education,
                bio: formData.bio
            };

            console.log('Sending update data:', updateData);
            const response = await authApi.updateProfile(updateData);
            
            // Get fresh profile data - either from response or fresh API call
            let updatedProfile;
            if (response.profile) {
                updatedProfile = response.profile;
            } else {
                updatedProfile = await authApi.getCurrentUser();
            }
            
            console.log('Fresh profile data from API:', updatedProfile);
            console.log('After update - Profile completion status:', updatedProfile.is_profile_completed);
            console.log('After update - Profile active status:', updatedProfile.is_active);
            console.log('After update - Enrolled courses count:', updatedProfile.enrolled_courses_count);
            
            setProfile(updatedProfile); // Update the profile state immediately
            
            // Update form data with fresh data
            setFormData({
                name: updatedProfile.name || '',
                email: updatedProfile.email || '',
                phone: updatedProfile.phone || '',
                age: updatedProfile.age?.toString() || '',
                father_name: updatedProfile.father_name || '',
                city: updatedProfile.city || '',
                address: updatedProfile.address || '',
                education: updatedProfile.education || '',
                bio: updatedProfile.bio || ''
            });
            
            setIsEditing(false);
            
            // Check if profile was completed after this update
            const isNowCompleted = updatedProfile.is_profile_completed;
            
            if (!wasCompleted && isNowCompleted) {
                setSuccess('🎉 Congratulations! Your profile is now complete and you can enroll in courses!');
                setShowCompletionAnimation(true);
                // Hide animation after 3 seconds
                setTimeout(() => setShowCompletionAnimation(false), 3000);
            } else {
                setSuccess('Profile updated successfully!');
            }
            
            // Remove edit parameter from URL
            router.replace('/profile', { scroll: false });
        } catch (error: any) {
            console.error('Profile update error:', error);
            setError(error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
                        <p className="text-gray-600">Manage your personal information and preferences</p>
                    </div>
                    
                    {!isEditing && (
                        <Button variant="primary" onClick={handleEdit}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Profile
                        </Button>
                    )}
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className={`mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg ${
                        showCompletionAnimation ? 'animate-bounce' : ''
                    }`}>
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Profile Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Card */}
                        <Card>
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                                            <UserIcon className="w-10 h-10 text-blue-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">
                                                {profile?.name || 'Student'}
                                            </h2>
                                            <p className="text-gray-600">{profile?.email}</p>
                                            {profile?.is_profile_completed && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm text-green-600">Profile Complete</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {isEditing && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={handleSave}
                                                isLoading={isSaving}
                                            >
                                                <Save className="w-4 h-4 mr-1" />
                                                Save
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleCancel}
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Full Name
                                        </label>
                                        {isEditing ? (
                                            <Input
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                placeholder="Enter your full name"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-900">
                                                <UserIcon className="w-4 h-4 text-gray-400" />
                                                <span>{profile?.name || 'Not set'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Email Address
                                        </label>
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span>{profile?.email}</span>
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Phone Number
                                        </label>
                                        {isEditing ? (
                                            <Input
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                placeholder="Enter your phone number"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-900">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span>{profile?.phone || 'Not set'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Age */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Age
                                        </label>
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={formData.age}
                                                onChange={(e) => handleInputChange('age', e.target.value)}
                                                placeholder="Enter your age"
                                                min="16"
                                                max="100"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-900">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span>{profile?.age ? `${profile.age} years` : 'Not set'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Father Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Father's Name
                                        </label>
                                        {isEditing ? (
                                            <Input
                                                value={formData.father_name}
                                                onChange={(e) => handleInputChange('father_name', e.target.value)}
                                                placeholder="Enter father's name"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-900">
                                                <UserIcon className="w-4 h-4 text-gray-400" />
                                                <span>{profile?.father_name || 'Not set'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            City
                                        </label>
                                        {isEditing ? (
                                            <Input
                                                value={formData.city}
                                                onChange={(e) => handleInputChange('city', e.target.value)}
                                                placeholder="Enter your city"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-900">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span>{profile?.city || 'Not set'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Address */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Address
                                        </label>
                                        {isEditing ? (
                                            <textarea
                                                value={formData.address}
                                                onChange={(e) => handleInputChange('address', e.target.value)}
                                                placeholder="Enter your address"
                                                rows={2}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-900">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span>{profile?.address || 'Not set'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Education */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Education
                                        </label>
                                        {isEditing ? (
                                            <Input
                                                value={formData.education}
                                                onChange={(e) => handleInputChange('education', e.target.value)}
                                                placeholder="e.g., High School, Bachelor's Degree"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-900">
                                                <GraduationCap className="w-4 h-4 text-gray-400" />
                                                <span>{profile?.education || 'Not set'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bio */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Bio
                                        </label>
                                        {isEditing ? (
                                            <textarea
                                                value={formData.bio}
                                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                                placeholder="Tell us about yourself..."
                                                rows={4}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        ) : (
                                            <div className="text-gray-900">
                                                {profile?.bio || 'No bio added yet'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <Card>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Learning Progress</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Enrolled Courses</span>
                                        <span className="font-medium text-gray-900">
                                            {profile?.enrolled_courses_count || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Tests Taken</span>
                                        <span className="font-medium text-gray-900">
                                            {profile?.tests_taken_count || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Notes Created</span>
                                        <span className="font-medium text-gray-900">
                                            {profile?.notes_count || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Account Information */}
                        <Card>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Account Status</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            profile?.is_active 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {profile?.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Profile Status</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-500 ${
                                            profile?.is_profile_completed 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        } ${showCompletionAnimation ? 'animate-pulse ring-2 ring-green-400 ring-opacity-50' : ''}`}>
                                            {profile?.is_profile_completed ? 'Complete ✓' : 'Incomplete'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Member Since</span>
                                        <span className="font-medium text-gray-900">
                                            {profile?.created_at 
                                                ? new Date(profile.created_at).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                  })
                                                : 'N/A'
                                            }
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Last Updated</span>
                                        <span className="font-medium text-gray-900">
                                            {profile?.updated_at 
                                                ? new Date(profile.updated_at).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                  })
                                                : 'N/A'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <Link href="/dashboard">
                                        <Button variant="outline" className="w-full">
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            My Dashboard
                                        </Button>
                                    </Link>
                                    <Link href="/courses">
                                        <Button variant="outline" className="w-full">
                                            Browse Courses
                                        </Button>
                                    </Link>
                                    <Link href="/tests">
                                        <Button variant="outline" className="w-full">
                                            My Tests
                                        </Button>
                                    </Link>
                                    <Link href="/notes">
                                        <Button variant="outline" className="w-full">
                                            My Notes
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>

                        {/* Account Info */}
                        <Card>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Role</p>
                                        <p className="font-medium text-gray-900 capitalize">
                                            {profile?.role || 'Student'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Member Since</p>
                                        <p className="font-medium text-gray-900">
                                            {profile?.created_at 
                                                ? new Date(profile.created_at).toLocaleDateString()
                                                : 'Unknown'
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Profile Status</p>
                                        <div className="flex items-center gap-1">
                                            {profile?.is_profile_completed ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm font-medium text-green-600">Complete</span>
                                                </>
                                            ) : (
                                                <>
                                                    <X className="w-4 h-4 text-red-600" />
                                                    <span className="text-sm font-medium text-red-600">Incomplete</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
