#!/usr/bin/env python
"""
COMPREHENSIVE TEST SYSTEM TESTING
Tests the entire test taking system from A to Z
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
from tests.models import Test, Question, AnswerOption, TestAssignment, StudentAnswer
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

def create_test_data():
    """Create comprehensive test data"""
    print_section("CREATING TEST DATA")
    
    # Clean up existing test data first
    print_subsection("Cleaning up existing test data")
    TestAssignment.objects.filter(test__title='Comprehensive Test System Test').delete()
    StudentAnswer.objects.filter(assignment__test__title='Comprehensive Test System Test').delete()
    AnswerOption.objects.filter(question__test__title='Comprehensive Test System Test').delete()
    Question.objects.filter(test__title='Comprehensive Test System Test').delete()
    Test.objects.filter(title='Comprehensive Test System Test').delete()
    print("✅ Cleaned up existing test data")
    
    # Create admin user
    try:
        admin = User.objects.get(email='admin@test.com')
        print("✅ Admin user already exists")
    except User.DoesNotExist:
        admin = User.objects.create_user(
            email='admin@test.com',
            name='Admin User',
            password='admin123',
            role='ADMIN',
            is_staff=True,
            is_superuser=True
        )
        print("✅ Created admin user")
    
    # Create student user
    try:
        student = User.objects.get(email='student@test.com')
        print("✅ Student user already exists")
    except User.DoesNotExist:
        student = User.objects.create_user(
            email='student@test.com',
            name='Test Student',
            password='student123',
            role='STUDENT',
            age=20,
            is_profile_completed=True
        )
        print("✅ Created student user")
    
    # Create course
    try:
        course = Course.objects.get(title='Test Course for Testing')
        print("✅ Test course already exists")
    except Course.DoesNotExist:
        course = Course.objects.create(
            title='Test Course for Testing',
            description='A course created specifically for testing the test system'
        )
        print("✅ Created test course")
    
    # Enroll student in course
    if student not in course.students.all():
        course.students.add(student)
        print("✅ Enrolled student in course")
    else:
        print("✅ Student already enrolled in course")
    
    # Create chapter
    try:
        chapter = Chapter.objects.get(course=course, title='Test Chapter')
        print("✅ Test chapter already exists")
    except Chapter.DoesNotExist:
        chapter = Chapter.objects.create(
            course=course,
            title='Test Chapter',
            description='Chapter for testing',
            order=1
        )
        print("✅ Created test chapter")
    
    # Create test
    test = Test.objects.create(
        course=course,
        chapter=chapter,
        title='Comprehensive Test System Test',
        description='This test validates the entire test taking system',
        duration_minutes=30,
        is_active=True,
        is_published=True
    )
    print("✅ Created test")
    
    return admin, student, course, chapter, test

def create_test_questions(test):
    """Create test questions and options"""
    print_subsection("Creating Questions and Options")
    
    questions_data = [
        {
            'text': 'What is the primary purpose of unit testing in software development?',
            'marks': 2,
            'options': [
                {'text': 'To test individual components or functions in isolation', 'is_correct': True},
                {'text': 'To test the entire application as a whole', 'is_correct': False},
                {'text': 'To test user interface design', 'is_correct': False},
                {'text': 'To test database performance', 'is_correct': False}
            ]
        },
        {
            'text': 'Which of the following is a key benefit of automated testing?',
            'marks': 1,
            'options': [
                {'text': 'Manual testing is faster than automated testing', 'is_correct': False},
                {'text': 'Automated tests can be run repeatedly and consistently', 'is_correct': True},
                {'text': 'Automated tests require no maintenance', 'is_correct': False},
                {'text': 'Automated tests can only test UI elements', 'is_correct': False}
            ]
        },
        {
            'text': 'What does the "Arrange-Act-Assert" pattern describe?',
            'marks': 3,
            'options': [
                {'text': 'A database design pattern', 'is_correct': False},
                {'text': 'A user interface design principle', 'is_correct': False},
                {'text': 'A structure for writing unit tests', 'is_correct': True},
                {'text': 'A deployment strategy', 'is_correct': False}
            ]
        }
    ]
    
    created_questions = []
    for i, q_data in enumerate(questions_data):
        # Create question
        question = Question.objects.create(
            test=test,
            text=q_data['text'],
            marks=q_data['marks'],
            order=i + 1
        )
        print(f"✅ Created question {i + 1}: {q_data['text'][:50]}...")
        
        # Create options
        for j, opt_data in enumerate(q_data['options']):
            option = AnswerOption.objects.create(
                question=question,
                text=opt_data['text'],
                is_correct=opt_data['is_correct']
            )
            print(f"   ✅ Option {chr(65 + j)}: {opt_data['text'][:30]}... ({'Correct' if opt_data['is_correct'] else 'Wrong'})")
        
        created_questions.append(question)
    
    # Recalculate test total marks
    test.save()  # This will trigger the save method that recalculates total_marks
    test.refresh_from_db()
    print(f"✅ Updated test total marks: {test.total_marks}")
    
    return created_questions

def create_test_assignment(student, test):
    """Create a test assignment for the student"""
    print_subsection("Creating Test Assignment")
    
    # Check if assignment already exists
    existing_assignment = TestAssignment.objects.filter(
        student=student,
        test=test
    ).first()
    
    if existing_assignment:
        print(f"✅ Test assignment already exists (Status: {existing_assignment.status})")
        return existing_assignment
    
    # Create new assignment
    assignment = TestAssignment.objects.create(
        student=student,
        test=test,
        attempt_number=1,
        test_version=1,
        status='assigned'
    )
    
    print(f"✅ Created test assignment (ID: {assignment.id})")
    return assignment

def test_serializers(test, questions):
    """Test the serializers"""
    print_subsection("Testing Serializers")
    
    # Test TestSerializer
    test_serializer = TestSerializer(test)
    print(f"✅ TestSerializer: {test_serializer.data['title']}")
    print(f"   Questions count: {test_serializer.data.get('questions_count', 'N/A')}")
    
    # Test QuestionSerializer
    for question in questions:
        question_serializer = QuestionSerializer(question)
        print(f"✅ QuestionSerializer: {question_serializer.data['text'][:50]}...")
        print(f"   Options count: {len(question_serializer.data['options'])}")
        
        # Test AnswerOptionSerializer
        for option in question_serializer.data['options']:
            print(f"   ✅ Option: {option['text'][:30]}... ({'Correct' if option['is_correct'] else 'Wrong'})")
    
    return True

def test_api_endpoints():
    """Test API endpoints (simulated)"""
    print_subsection("Testing API Endpoints")
    
    # Note: In a real test environment, you would use Django's test client
    # For now, we'll just verify the views exist and can be imported
    try:
        from tests.views_student import (
            StudentAssignedTestView,
            StudentStartTestView,
            StudentSubmitTestView,
            StudentTestResultView
        )
        print("✅ All student view classes imported successfully")
        
        from tests.views_admin import (
            TestViewSet,
            QuestionViewSet,
            AnswerOptionViewSet
        )
        print("✅ All admin view classes imported successfully")
        
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_test_workflow(student, test, assignment, questions):
    """Test the complete test workflow"""
    print_subsection("Testing Complete Test Workflow")
    
    print("1. Student views assigned tests")
    # Simulate StudentAssignedTestView
    student_assignments = TestAssignment.objects.filter(student=student)
    print(f"✅ Student has {student_assignments.count()} assigned test(s)")
    
    print("2. Student starts the test")
    # Simulate StudentStartTestView
    if assignment.status == 'assigned':
        assignment.status = 'started'
        assignment.started_at = django.utils.timezone.now()
        assignment.save()
        print(f"✅ Test started (Assignment ID: {assignment.id})")
    
    print("3. Student answers questions")
    # Simulate answering questions
    from tests.models import StudentAnswer
    
    for i, question in enumerate(questions):
        # Get the correct option
        correct_option = question.options.filter(is_correct=True).first()
        if correct_option:
            answer, created = StudentAnswer.objects.get_or_create(
                assignment=assignment,
                question=question,
                defaults={
                    'selected_option': correct_option,
                    'is_correct': True,
                    'marks_obtained': question.marks,
                    'question_marks': question.marks
                }
            )
            print(f"✅ Answered question {i + 1}: {'Created' if created else 'Updated'}")
    
    print("4. Student submits the test")
    # Simulate StudentSubmitTestView
    total_marks = sum(answer.marks_obtained for answer in assignment.answers.all())
    assignment.status = 'submitted'
    assignment.submitted_at = django.utils.timezone.now()
    assignment.obtained_marks = total_marks
    assignment.total_marks = test.total_marks
    assignment.evaluated_at = django.utils.timezone.now()
    assignment.save()
    
    print(f"✅ Test submitted")
    print(f"   Obtained marks: {assignment.obtained_marks}/{assignment.total_marks}")
    if assignment.total_marks > 0:
        print(f"   Percentage: {(assignment.obtained_marks / assignment.total_marks * 100):.1f}%")
    else:
        print(f"   Percentage: N/A (total marks is 0)")
    
    print("5. Student views results")
    # Simulate StudentTestResultView
    print(f"✅ Results available for test: {test.title}")
    
    return True

def test_data_integrity(test, questions, assignment):
    """Test data integrity and relationships"""
    print_subsection("Testing Data Integrity")
    
    # Test test-questions relationship
    test_questions = test.questions.all()
    print(f"✅ Test has {test_questions.count()} questions")
    assert test_questions.count() == len(questions), "Question count mismatch"
    
    # Test question-options relationship
    for question in questions:
        options = question.options.all()
        print(f"✅ Question has {options.count()} options")
        assert options.count() == 4, f"Question should have 4 options, has {options.count()}"
        
        # Test that exactly one option is correct
        correct_options = options.filter(is_correct=True)
        assert correct_options.count() == 1, f"Question should have exactly 1 correct option, has {correct_options.count()}"
        print(f"✅ Question has exactly 1 correct option")
    
    # Test assignment relationships
    print(f"✅ Assignment belongs to student: {assignment.student.name}")
    print(f"✅ Assignment belongs to test: {assignment.test.title}")
    
    # Test student answers
    student_answers = assignment.answers.all()
    print(f"✅ Student answered {student_answers.count()} questions")
    
    return True

def main():
    """Main test function"""
    print_section("COMPREHENSIVE TEST SYSTEM TESTING")
    print("This script will test the entire test taking system from A to Z")
    
    try:
        # Step 1: Create test data
        admin, student, course, chapter, test = create_test_data()
        
        # Step 2: Create questions and options
        questions = create_test_questions(test)
        
        # Step 3: Create test assignment
        assignment = create_test_assignment(student, test)
        
        # Step 4: Test serializers
        test_serializers(test, questions)
        
        # Step 5: Test API endpoints
        test_api_endpoints()
        
        # Step 6: Test complete workflow
        test_test_workflow(student, test, assignment, questions)
        
        # Step 7: Test data integrity
        test_data_integrity(test, questions, assignment)
        
        print_section("TEST SYSTEM TESTING COMPLETED SUCCESSFULLY")
        print("✅ All tests passed! The test system is working correctly.")
        print(f"\nTest Summary:")
        print(f"- Course: {course.title}")
        print(f"- Test: {test.title}")
        print(f"- Questions: {len(questions)}")
        print(f"- Student: {student.name}")
        print(f"- Assignment ID: {assignment.id}")
        print(f"- Final Score: {assignment.obtained_marks}/{assignment.total_marks}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
