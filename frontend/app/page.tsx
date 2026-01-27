// ============================================================================
// TECHWARDS ACADEMY - LANDING PAGE
// Public homepage
// ============================================================================

import Link from 'next/link';
import { GraduationCap, BookOpen, Video, FileText, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-6 animate-scale-in">
            <GraduationCap className="w-10 h-10 text-blue-600" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Welcome to Techwards Academy
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto animate-slide-up">
            Unlock your potential with our comprehensive learning platform.
            Access courses, watch video lectures, and take notes—all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link href="/register">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white text-white hover:bg-white/20">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Everything You Need to Learn
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card hover className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Structured Courses
              </h3>
              <p className="text-gray-600">
                Well-organized courses with chapters and progressive learning paths
              </p>
            </Card>

            <Card hover className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Video className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Video Lectures
              </h3>
              <p className="text-gray-600">
                High-quality video content from expert instructors
              </p>
            </Card>

            <Card hover className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Smart Notes
              </h3>
              <p className="text-gray-600">
                Take personal notes and access official course materials
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-blue-600 mb-2">1000+</div>
              <div className="text-gray-600">Active Students</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-600">Courses Available</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-gray-600">Completion Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-green-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of students already learning on Techwards Academy
          </p>
          <Link href="/register">
            <Button variant="secondary" size="lg">
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Techwards Academy</h3>
              <p className="text-gray-400">
                Empowering learners with comprehensive courses and resources to achieve their goals.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/courses" className="text-gray-400 hover:text-white">Courses</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-white">Register</Link></li>
                <li><Link href="/login" className="text-gray-400 hover:text-white">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="/notes" className="text-gray-400 hover:text-white">Notes</Link></li>
                <li><Link href="/tests" className="text-gray-400 hover:text-white">Tests</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
              <p className="text-gray-400">Email: support@techwards.com</p>
              <p className="text-gray-400">Phone: +1 (123) 456-7890</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2026 Techwards Academy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
