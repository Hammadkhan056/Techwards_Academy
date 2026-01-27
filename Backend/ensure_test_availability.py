#!/usr/bin/env python
"""
ENSURE TEST AVAILABILITY
Make sure there are always available tests for students to take
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

User = get_user_model()

def print_section(title):
    """Print a section header"""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def ensure_student_has_available_test():
    """Ensure student has at least one available test"""
    print_section("ENSURING STUDENT HAS AVAILABLE TEST")
    
    # Get student
    try:
        student = User.objects.get(email='student@test.com')
        print(f"✅ Student found: {student.name}")
    except User.DoesNotExist:
        print("❌ Student not found")
        return False
    
    # Check for available assignments
    available_assignments = TestAssignment.objects.filter(
        student=student,
        status__in=['assigned', 'started']
    ).select_related('test').filter(
        test__is_active=True,
        test__is_published=True
    )
    
    print(f"✅ Found {available_assignments.count()} available assignments")
    
    if available_assignments.count() > 0:
        for assignment in available_assignments:
            print(f"   - {assignment.test.title} (Status: {assignment.status})")
        return True
    
    # Create a new test if none available
    print("No available assignments found, creating new test...")
    return create_fresh_test_for_student(student)

def create_fresh_test_for_student(student):
    """Create a fresh test for the student"""
    print_subsection("Creating Fresh Test")
    
    # Get course
    course = Course.objects.first()
    if not course:
        print("❌ No courses found")
        return False
    
    chapter = course.chapters.first()
    
    # Create test
    test = Test.objects.create(
        course=course,
        chapter=chapter,
        title='Practice Test - Always Available',
        description='This test is always available for practice',
        duration_minutes=30,
        is_active=True,
        is_published=True
    )
    print(f"✅ Created test: {test.title}")
    
    # Create simple questions
    questions_data = [
        {
            'text': 'What is 1 + 1?',
            'marks': 1,
            'options': [
                {'text': '1', 'is_correct': False},
                {'text': '2', 'is_correct': True},
                {'text': '3', 'is_correct': False},
                {'text': '4', 'is_correct': False}
            ]
        },
        {
            'text': 'What color is the sky?',
            'marks': 1,
            'options': [
                {'text': 'Red', 'is_correct': False},
                {'text': 'Green', 'is_correct': False},
                {'text': 'Blue', 'is_correct': True},
                {'text': 'Yellow', 'is_correct': False}
            ]
        }
    ]
    
    for i, q_data in enumerate(questions_data):
        question = Question.objects.create(
            test=test,
            text=q_data['text'],
            marks=q_data['marks'],
            order=i + 1
        )
        
        for opt_data in q_data['options']:
            AnswerOption.objects.create(
                question=question,
                text=opt_data['text'],
                is_correct=opt_data['is_correct']
            )
        
        print(f"✅ Created question {i + 1}: {q_data['text']}")
    
    # Update test total marks
    test.save()
    test.refresh_from_db()
    
    # Create assignment
    assignment = TestAssignment.objects.create(
        student=student,
        test=test,
        status='assigned'
    )
    print(f"✅ Created assignment: {assignment.id}")
    
    # Ensure enrollment
    if not course.students.filter(id=student.id).exists():
        course.students.add(student)
        print(f"✅ Enrolled student in course: {course.title}")
    
    return True

def print_subsection(title):
    """Print a subsection header"""
    print(f"\n--- {title} ---")

def main():
    """Main function"""
    print_section("ENSURING TEST AVAILABILITY FOR STUDENTS")
    
    try:
        success = ensure_student_has_available_test()
        
        if success:
            print_section("✅ TEST AVAILABILITY ENSURED")
            print("Students now have available tests to take!")
            
            # Show current status
            student = User.objects.get(email='student@test.com')
            available_assignments = TestAssignment.objects.filter(
                student=student,
                status__in=['assigned', 'started']
            ).select_related('test')
            
            print(f"\nCurrent Available Tests for {student.name}:")
            for assignment in available_assignments:
                print(f"   - Test ID: {assignment.test.id}")
                print(f"     Title: {assignment.test.title}")
                print(f"     Status: {assignment.status}")
                print(f"     URL: /tests/{assignment.test.id}/start")
            
            return True
        else:
            print_section("❌ FAILED TO ENSURE TEST AVAILABILITY")
            return False
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
