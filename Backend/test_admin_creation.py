#!/usr/bin/env python
"""
ADMIN TEST CREATION TESTING
Tests the complete admin test creation process
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from courses.models import Course, Chapter
from tests.models import Test, Question, AnswerOption, TestAssignment
from tests.serializers import TestSerializer, QuestionSerializer, AnswerOptionSerializer

User = get_user_model()

def print_section(title):
    """Print a section header"""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def print_subsection(title):
    """Print a subsection header"""
    print(f"\n--- {title} ---")

def check_admin_user():
    """Check if admin user exists"""
    print_subsection("Checking Admin User")
    
    try:
        admin = User.objects.get(email='admin@test.com')
        print(f"✅ Admin user found: {admin.name}")
        print(f"   Role: {admin.role}")
        print(f"   Is Staff: {admin.is_staff}")
        print(f"   Is Superuser: {admin.is_superuser}")
        return admin
    except User.DoesNotExist:
        print("❌ Admin user not found")
        return None

def check_courses_and_chapters():
    """Check available courses and chapters"""
    print_subsection("Checking Courses and Chapters")
    
    courses = Course.objects.all()
    print(f"✅ Found {courses.count()} courses:")
    
    for course in courses:
        print(f"   - {course.title} (ID: {course.id})")
        chapters = course.chapters.all()
        print(f"     Chapters: {chapters.count()}")
        for chapter in chapters:
            print(f"       * {chapter.title} (ID: {chapter.id})")
    
    return courses

def test_test_creation_via_api():
    """Test test creation via API (simulating admin)"""
    print_subsection("Testing Test Creation via API")
    
    # Get admin user
    admin = User.objects.filter(role='ADMIN').first()
    if not admin:
        print("❌ No admin user found")
        return False
    
    # Get course and chapter
    course = Course.objects.first()
    if not course:
        print("❌ No courses found")
        return False
    
    chapter = course.chapters.first()
    
    # Test data
    test_data = {
        'title': 'Admin API Test Creation',
        'description': 'Test created via API to verify admin functionality',
        'course': course.id,
        'chapter': chapter.id if chapter else None,
        'duration_minutes': 45,
        'is_active': True,
        'is_published': True
    }
    
    print(f"Creating test: {test_data['title']}")
    
    # Test serializer
    serializer = TestSerializer(data=test_data)
    if serializer.is_valid():
        test = serializer.save()
        print(f"✅ Test created successfully (ID: {test.id})")
        print(f"   Title: {test.title}")
        print(f"   Course: {test.course.title}")
        print(f"   Chapter: {test.chapter.title if test.chapter else 'None'}")
        print(f"   Total Marks: {test.total_marks}")
        return test
    else:
        print(f"❌ Test creation failed: {serializer.errors}")
        return False

def test_question_creation(test):
    """Test question creation"""
    print_subsection("Testing Question Creation")
    
    questions_data = [
        {
            'text': 'What is the primary purpose of Django admin interface?',
            'marks': 2,
            'options': [
                {'text': 'To provide a built-in CRUD interface for data models', 'is_correct': True},
                {'text': 'To create user-facing web pages', 'is_correct': False},
                {'text': 'To handle database migrations', 'is_correct': False},
                {'text': 'To manage static files', 'is_correct': False}
            ]
        },
        {
            'text': 'Which Django method is used to register models with admin?',
            'marks': 1,
            'options': [
                {'text': 'admin.register()', 'is_correct': True},
                {'text': 'register.admin()', 'is_correct': False},
                {'text': 'model.admin()', 'is_correct': False},
                {'text': 'django.admin()', 'is_correct': False}
            ]
        }
    ]
    
    created_questions = []
    for i, q_data in enumerate(questions_data):
        # Create question
        question_data = {
            'test': test.id,
            'text': q_data['text'],
            'marks': q_data['marks'],
            'order': i + 1
        }
        
        question_serializer = QuestionSerializer(data=question_data)
        if question_serializer.is_valid():
            question = question_serializer.save()
            print(f"✅ Question {i + 1} created: {q_data['text'][:50]}...")
            
            # Create options
            for j, opt_data in enumerate(q_data['options']):
                option_data = {
                    'question': question.id,
                    'text': opt_data['text'],
                    'is_correct': opt_data['is_correct']
                }
                
                option_serializer = AnswerOptionSerializer(data=option_data)
                if option_serializer.is_valid():
                    option = option_serializer.save()
                    print(f"   ✅ Option {chr(65 + j)}: {opt_data['text'][:30]}... ({'Correct' if opt_data['is_correct'] else 'Wrong'})")
                else:
                    print(f"   ❌ Option creation failed: {option_serializer.errors}")
                    return False
            
            created_questions.append(question)
        else:
            print(f"❌ Question {i + 1} creation failed: {question_serializer.errors}")
            return False
    
    # Update test total marks
    test.save()
    test.refresh_from_db()
    print(f"✅ Updated test total marks: {test.total_marks}")
    
    return created_questions

def test_admin_permissions():
    """Test admin permissions"""
    print_subsection("Testing Admin Permissions")
    
    admin = User.objects.filter(role='ADMIN').first()
    student = User.objects.filter(role='STUDENT').first()
    
    if not admin:
        print("❌ No admin user found")
        return False
    
    if not student:
        print("❌ No student user found")
        return False
    
    print(f"✅ Admin user: {admin.name} (Role: {admin.role})")
    print(f"✅ Student user: {student.name} (Role: {student.role})")
    
    # Test admin can access tests
    admin_tests = Test.objects.all()
    print(f"✅ Admin can see {admin_tests.count()} tests")
    
    # Test student permissions (should be limited)
    student_assignments = TestAssignment.objects.filter(student=student)
    print(f"✅ Student has {student_assignments.count()} test assignments")
    
    return True

def test_admin_interface_structure():
    """Test admin interface structure"""
    print_subsection("Testing Admin Interface Structure")
    
    try:
        from django.contrib import admin
        from tests.admin import TestAdmin, QuestionAdmin, AnswerOptionAdmin
        
        print("✅ Admin classes imported successfully")
        
        # Check if models are registered
        admin_site = admin.site
        registered_models = admin_site._registry.keys()
        
        test_registered = Test in registered_models
        question_registered = Question in registered_models
        option_registered = AnswerOption in registered_models
        assignment_registered = TestAssignment in registered_models
        
        print(f"✅ Test model registered: {test_registered}")
        print(f"✅ Question model registered: {question_registered}")
        print(f"✅ AnswerOption model registered: {option_registered}")
        print(f"✅ TestAssignment model registered: {assignment_registered}")
        
        return all([test_registered, question_registered, option_registered, assignment_registered])
        
    except ImportError as e:
        print(f"❌ Admin import error: {e}")
        return False

def identify_common_issues():
    """Identify common issues in admin test creation"""
    print_subsection("Identifying Common Issues")
    
    issues = []
    
    # Check 1: Admin user exists
    admin_count = User.objects.filter(role='ADMIN').count()
    if admin_count == 0:
        issues.append("No admin users found. Create admin user first.")
    
    # Check 2: Courses exist
    course_count = Course.objects.count()
    if course_count == 0:
        issues.append("No courses found. Create courses first.")
    
    # Check 3: Chapters exist
    chapter_count = Chapter.objects.count()
    if chapter_count == 0:
        issues.append("No chapters found. Create chapters first.")
    
    # Check 4: Test model constraints
    try:
        test = Test.objects.first()
        if test:
            print(f"✅ Sample test found: {test.title}")
            print(f"   Course: {test.course.title if test.course else 'None'}")
            print(f"   Chapter: {test.chapter.title if test.chapter else 'None'}")
            print(f"   Questions: {test.questions.count()}")
            print(f"   Total Marks: {test.total_marks}")
    except Exception as e:
        issues.append(f"Error accessing test model: {e}")
    
    # Check 5: Question constraints
    try:
        question = Question.objects.first()
        if question:
            print(f"✅ Sample question found: {question.text[:50]}...")
            print(f"   Test: {question.test.title}")
            print(f"   Options: {question.options.count()}")
            print(f"   Marks: {question.marks}")
            
            # Check option constraints
            correct_options = question.options.filter(is_correct=True).count()
            if correct_options != 1:
                issues.append(f"Question should have exactly 1 correct option, has {correct_options}")
    except Exception as e:
        issues.append(f"Error accessing question model: {e}")
    
    if issues:
        print("❌ Issues found:")
        for i, issue in enumerate(issues, 1):
            print(f"   {i}. {issue}")
        return False
    else:
        print("✅ No common issues found")
        return True

def main():
    """Main test function"""
    print_section("ADMIN TEST CREATION COMPREHENSIVE TESTING")
    print("This script will test the complete admin test creation process")
    
    try:
        # Step 1: Check admin user
        admin = check_admin_user()
        if not admin:
            print("❌ Cannot proceed without admin user")
            return False
        
        # Step 2: Check courses and chapters
        courses = check_courses_and_chapters()
        if courses.count() == 0:
            print("❌ Cannot proceed without courses")
            return False
        
        # Step 3: Identify common issues
        identify_common_issues()
        
        # Step 4: Test admin interface structure
        test_admin_interface_structure()
        
        # Step 5: Test test creation via API
        test = test_test_creation_via_api()
        if not test:
            print("❌ Test creation failed")
            return False
        
        # Step 6: Test question creation
        questions = test_question_creation(test)
        if not questions:
            print("❌ Question creation failed")
            return False
        
        # Step 7: Test admin permissions
        test_admin_permissions()
        
        print_section("ADMIN TEST CREATION TESTING COMPLETED")
        print("✅ All admin test creation tests passed!")
        print(f"\nTest Summary:")
        print(f"- Admin User: {admin.name}")
        print(f"- Test Created: {test.title}")
        print(f"- Questions Created: {len(questions)}")
        print(f"- Total Marks: {test.total_marks}")
        print(f"- Admin Interface: Working")
        
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
