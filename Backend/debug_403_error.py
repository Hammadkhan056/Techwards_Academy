#!/usr/bin/env python
"""
DEBUG 403 ERROR
Identify and fix the 403 error when starting tests
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

def debug_student_permissions():
    """Debug student permissions and profile"""
    print_section("DEBUGGING STUDENT PERMISSIONS")
    
    # Get student user
    try:
        student = User.objects.get(email='student@test.com')
        print(f"✅ Student found: {student.name}")
        print(f"   Email: {student.email}")
        print(f"   Role: {student.role}")
        print(f"   Is Active: {student.is_active}")
        print(f"   Profile Completed: {student.is_profile_completed}")
        print(f"   Age: {student.age}")
        
        if not student.is_profile_completed:
            print("❌ ISSUE: Student profile is not completed!")
            print("   Required: name, age >= 16")
            return None
            
        return student
    except User.DoesNotExist:
        print("❌ Student user not found")
        return None

def debug_test_assignments(student):
    """Debug test assignments for student"""
    print_section("DEBUGGING TEST ASSIGNMENTS")
    
    assignments = TestAssignment.objects.filter(student=student)
    print(f"✅ Found {assignments.count()} assignments for {student.name}")
    
    for assignment in assignments:
        print(f"\nAssignment {assignment.id}:")
        print(f"   Test: {assignment.test.title}")
        print(f"   Status: {assignment.status}")
        print(f"   Attempt: {assignment.attempt_number}")
        print(f"   Test Active: {assignment.test.is_active}")
        print(f"   Test Published: {assignment.test.is_published}")
        print(f"   Course: {assignment.test.course.title}")
        
        # Check enrollment
        is_enrolled = assignment.test.course.students.filter(id=student.id).exists()
        print(f"   Enrolled in course: {is_enrolled}")
        
        if not is_enrolled:
            print("❌ ISSUE: Student not enrolled in course!")
            # Fix enrollment
            assignment.test.course.students.add(student)
            print(f"✅ FIXED: Enrolled student in {assignment.test.course.title}")
            is_enrolled = True
        
        # Check if assignment can be started
        can_start = (
            assignment.status in ['assigned', 'started'] and
            assignment.test.is_active and
            assignment.test.is_published and
            is_enrolled
        )
        print(f"   Can start test: {can_start}")
        
        if can_start:
            print(f"   ✅ This assignment should work for test start")
            return assignment
    
    print("❌ No valid assignments found for starting test")
    return None

def debug_test_details(test_id):
    """Debug specific test details"""
    print_section(f"DEBUGGING TEST ID: {test_id}")
    
    try:
        test = Test.objects.get(id=test_id)
        print(f"✅ Test found: {test.title}")
        print(f"   Course: {test.course.title}")
        print(f"   Chapter: {test.chapter.title if test.chapter else 'None'}")
        print(f"   Is Active: {test.is_active}")
        print(f"   Is Published: {test.is_published}")
        print(f"   Questions: {test.questions.count()}")
        print(f"   Total Marks: {test.total_marks}")
        
        if not test.is_active:
            print("❌ ISSUE: Test is not active!")
            test.is_active = True
            test.save()
            print("✅ FIXED: Activated test")
            
        if not test.is_published:
            print("❌ ISSUE: Test is not published!")
            test.is_published = True
            test.save()
            print("✅ FIXED: Published test")
        
        return test
    except Test.DoesNotExist:
        print(f"❌ Test with ID {test_id} not found")
        return None

def create_test_assignment_if_needed(student, test):
    """Create test assignment if needed"""
    print_section("CREATING TEST ASSIGNMENT IF NEEDED")
    
    existing_assignment = TestAssignment.objects.filter(
        student=student,
        test=test,
        status__in=['assigned', 'started']
    ).first()
    
    if existing_assignment:
        print(f"✅ Valid assignment already exists: {existing_assignment.id}")
        return existing_assignment
    
    # Create new assignment
    assignment = TestAssignment.objects.create(
        student=student,
        test=test,
        status='assigned'
    )
    print(f"✅ Created new assignment: {assignment.id}")
    return assignment

def simulate_start_test(student, test):
    """Simulate the start test API call"""
    print_section("SIMULATING START TEST API")
    
    # Check all the conditions from StudentStartTestView
    print(f"1. Checking user role: {student.role}")
    if student.role != 'STUDENT':
        print("❌ ERROR: Only Students allowed")
        return False
    
    print(f"2. Checking profile completion: {student.is_profile_completed}")
    if not student.is_profile_completed:
        print("❌ ERROR: Complete profile before starting test")
        return False
    
    print(f"3. Checking test existence and active status")
    try:
        test_obj = Test.objects.get(id=test.id, is_active=True)
        print(f"✅ Test found and active: {test_obj.title}")
    except Test.DoesNotExist:
        print("❌ ERROR: Test not found or inactive")
        return False
    
    print(f"4. Checking enrollment in course")
    is_enrolled = test_obj.course.students.filter(id=student.id).exists()
    if not is_enrolled:
        print("❌ ERROR: You are not enrolled in the course for this test")
        return False
    print(f"✅ Student is enrolled in course")
    
    print(f"5. Checking test assignment")
    assignment = TestAssignment.objects.filter(
        student=student,
        test=test_obj,
        status__in=['assigned', 'started']
    ).order_by('-attempt_number').first()
    
    if not assignment:
        print("❌ ERROR: Test not assigned to you")
        return False
    print(f"✅ Found assignment: {assignment.id} (Status: {assignment.status})")
    
    print(f"6. All checks passed - test can be started!")
    return True

def main():
    """Main debug function"""
    print_section("DEBUGGING 403 ERROR - TEST START")
    
    try:
        # Step 1: Debug student permissions
        student = debug_student_permissions()
        if not student:
            print("❌ Cannot proceed without valid student")
            return False
        
        # Step 2: Debug test assignments
        assignment = debug_test_assignments(student)
        
        # Step 3: If no valid assignment, create one
        if not assignment:
            # Get a test to assign
            test = Test.objects.filter(is_active=True, is_published=True).first()
            if test:
                assignment = create_test_assignment_if_needed(student, test)
            else:
                print("❌ No active tests found")
                return False
        
        # Step 4: Debug test details
        test = debug_test_details(assignment.test.id)
        
        # Step 5: Simulate start test
        can_start = simulate_start_test(student, test)
        
        if can_start:
            print_section("✅ 403 ERROR RESOLVED")
            print("The test should now start successfully!")
            print(f"\nTest Details:")
            print(f"- Test: {test.title}")
            print(f"- Test ID: {test.id}")
            print(f"- Student: {student.name}")
            print(f"- Assignment ID: {assignment.id}")
            print(f"- Status: {assignment.status}")
            print(f"- URL: /tests/{test.id}/start")
            return True
        else:
            print_section("❌ 403 ERROR STILL EXISTS")
            print("Please check the issues identified above")
            return False
        
    except Exception as e:
        print(f"\n❌ DEBUG FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
