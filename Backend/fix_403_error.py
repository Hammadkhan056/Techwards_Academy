#!/usr/bin/env python
"""
FIX 403 ERROR
Create test and assignment to resolve the 403 error
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

def create_sample_test():
    """Create a sample test for testing"""
    print_section("CREATING SAMPLE TEST")
    
    # Get course and chapter
    course = Course.objects.first()
    if not course:
        print("❌ No courses found")
        return None
    
    chapter = course.chapters.first()
    
    # Create test
    test = Test.objects.create(
        course=course,
        chapter=chapter,
        title='Sample Test for 403 Fix',
        description='This test is created to fix the 403 error',
        duration_minutes=30,
        is_active=True,
        is_published=True
    )
    print(f"✅ Created test: {test.title}")
    
    # Create questions
    questions_data = [
        {
            'text': 'What is 2 + 2?',
            'marks': 1,
            'options': [
                {'text': '3', 'is_correct': False},
                {'text': '4', 'is_correct': True},
                {'text': '5', 'is_correct': False},
                {'text': '6', 'is_correct': False}
            ]
        },
        {
            'text': 'What is the capital of France?',
            'marks': 2,
            'options': [
                {'text': 'London', 'is_correct': False},
                {'text': 'Berlin', 'is_correct': False},
                {'text': 'Paris', 'is_correct': True},
                {'text': 'Madrid', 'is_correct': False}
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
    print(f"✅ Test total marks: {test.total_marks}")
    
    return test

def assign_test_to_student(student, test):
    """Assign test to student"""
    print_section("ASSIGNING TEST TO STUDENT")
    
    # Check if assignment already exists
    existing = TestAssignment.objects.filter(
        student=student,
        test=test,
        status__in=['assigned', 'started']
    ).first()
    
    if existing:
        print(f"✅ Assignment already exists: {existing.id}")
        return existing
    
    # Create new assignment
    assignment = TestAssignment.objects.create(
        student=student,
        test=test,
        status='assigned'
    )
    print(f"✅ Created assignment: {assignment.id}")
    print(f"   Student: {student.name}")
    print(f"   Test: {test.title}")
    print(f"   Status: {assignment.status}")
    
    return assignment

def verify_fix(student, test, assignment):
    """Verify the fix works"""
    print_section("VERIFYING FIX")
    
    print(f"Student: {student.name}")
    print(f"Role: {student.role}")
    print(f"Profile Completed: {student.is_profile_completed}")
    print(f"Test: {test.title}")
    print(f"Test Active: {test.is_active}")
    print(f"Test Published: {test.is_published}")
    print(f"Assignment: {assignment.id}")
    print(f"Assignment Status: {assignment.status}")
    
    # Check enrollment
    is_enrolled = test.course.students.filter(id=student.id).exists()
    if not is_enrolled:
        test.course.students.add(student)
        print(f"✅ Enrolled student in course: {test.course.title}")
        is_enrolled = True
    
    print(f"Enrolled in course: {is_enrolled}")
    
    # Simulate the API checks
    checks = [
        student.role == 'STUDENT',
        student.is_profile_completed,
        test.is_active,
        test.is_published,
        is_enrolled,
        assignment.status in ['assigned', 'started']
    ]
    
    print(f"\nAPI Checks:")
    print(f"1. User is STUDENT: {checks[0]}")
    print(f"2. Profile completed: {checks[1]}")
    print(f"3. Test is active: {checks[2]}")
    print(f"4. Test is published: {checks[3]}")
    print(f"5. Student enrolled: {checks[4]}")
    print(f"6. Assignment valid: {checks[5]}")
    
    all_passed = all(checks)
    print(f"\n✅ All checks passed: {all_passed}")
    
    if all_passed:
        print(f"\n🎉 403 ERROR FIXED!")
        print(f"Student can now start the test at: /tests/{test.id}/start")
    
    return all_passed

def main():
    """Main fix function"""
    print_section("FIXING 403 ERROR")
    
    try:
        # Get student
        try:
            student = User.objects.get(email='student@test.com')
        except User.DoesNotExist:
            print("❌ Student not found")
            return False
        
        # Create test
        test = create_sample_test()
        if not test:
            return False
        
        # Assign test to student
        assignment = assign_test_to_student(student, test)
        
        # Verify fix
        success = verify_fix(student, test, assignment)
        
        if success:
            print_section("✅ 403 ERROR SUCCESSFULLY FIXED")
            print("The student can now access the test!")
            return True
        else:
            print_section("❌ 403 ERROR NOT FIXED")
            return False
        
    except Exception as e:
        print(f"\n❌ FIX FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
