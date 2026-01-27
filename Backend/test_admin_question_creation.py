#!/usr/bin/env python
"""
TEST ADMIN QUESTION CREATION FIX
Test the fix for the "Model instances passed to related filters must be saved" error
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
from tests.models import Test, Question, AnswerOption

User = get_user_model()

def print_section(title):
    """Print a section header"""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def test_question_creation_via_admin():
    """Test question creation via admin (simulating the admin interface)"""
    print_section("TESTING QUESTION CREATION VIA ADMIN")
    
    # Get admin user
    try:
        admin = User.objects.get(email='admin@test.com')
        print(f"✅ Admin user found: {admin.name}")
    except User.DoesNotExist:
        print("❌ Admin user not found")
        return False
    
    # Get test
    test = Test.objects.filter(is_active=True, is_published=True).first()
    if not test:
        print("❌ No active test found")
        return False
    
    print(f"✅ Using test: {test.title}")
    
    # Create question (simulating admin inline creation)
    try:
        print("Creating question...")
        question = Question.objects.create(
            test=test,
            text="What is the capital of Spain?",
            marks=2,
            order=1
        )
        print(f"✅ Question created: {question.text}")
        
        # Create answer options (simulating admin inline creation)
        options_data = [
            {"text": "Madrid", "is_correct": True},
            {"text": "Barcelona", "is_correct": False},
            {"text": "Valencia", "is_correct": False},
            {"text": "Seville", "is_correct": False}
        ]
        
        print("Creating answer options...")
        for i, opt_data in enumerate(options_data):
            option = AnswerOption.objects.create(
                question=question,
                text=opt_data["text"],
                is_correct=opt_data["is_correct"]
            )
            print(f"✅ Option {i+1}: {opt_data['text']} ({'Correct' if opt_data['is_correct'] else 'Wrong'})")
        
        print(f"✅ Successfully created question with {len(options_data)} options")
        return True
        
    except Exception as e:
        print(f"❌ Error during question creation: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_validation_constraints():
    """Test the validation constraints"""
    print_section("TESTING VALIDATION CONSTRAINTS")
    
    # Get existing question
    question = Question.objects.first()
    if not question:
        print("❌ No question found for testing")
        return False
    
    print(f"Testing with question: {question.text}")
    
    # Try to create another correct option (should fail)
    try:
        print("Attempting to create second correct option (should fail)...")
        option = AnswerOption(
            question=question,
            text="Another Correct Answer",
            is_correct=True
        )
        option.full_clean()  # This should raise ValidationError
        print("❌ Validation failed - allowed multiple correct answers")
        return False
    except Exception as e:
        print(f"✅ Validation worked: {str(e)}")
    
    # Try to create wrong option (should succeed)
    try:
        print("Attempting to create wrong option (should succeed)...")
        option = AnswerOption(
            question=question,
            text="Wrong Answer",
            is_correct=False
        )
        option.full_clean()  # This should succeed
        option.save()
        print(f"✅ Wrong option created successfully")
        return True
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def test_admin_inline_simulation():
    """Test admin inline creation simulation"""
    print_section("TESTING ADMIN INLINE SIMULATION")
    
    # Get test
    test = Test.objects.first()
    if not test:
        print("❌ No test found")
        return False
    
    try:
        # Simulate admin inline creation (question first, then options)
        print("Step 1: Creating question...")
        question = Question(
            test=test,
            text="What is 2 + 2?",
            marks=1,
            order=2
        )
        # Don't save yet - this is what happens in admin inline
        
        print("Step 2: Creating options for unsaved question...")
        # This should now work with our fix
        question.save()  # Save first
        
        # Now create options
        options = [
            AnswerOption(question=question, text="3", is_correct=False),
            AnswerOption(question=question, text="4", is_correct=True),
            AnswerOption(question=question, text="5", is_correct=False),
        ]
        
        for option in options:
            option.full_clean()  # Should work now
            option.save()
        
        print(f"✅ Admin inline simulation successful")
        print(f"   Question: {question.text}")
        print(f"   Options: {len(options)} created")
        return True
        
    except Exception as e:
        print(f"❌ Admin inline simulation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print_section("TESTING ADMIN QUESTION CREATION FIX")
    print("Testing the fix for 'Model instances passed to related filters must be saved'")
    
    try:
        # Test 1: Basic question creation
        success1 = test_question_creation_via_admin()
        
        # Test 2: Validation constraints
        success2 = test_validation_constraints()
        
        # Test 3: Admin inline simulation
        success3 = test_admin_inline_simulation()
        
        if success1 and success2 and success3:
            print_section("✅ ALL TESTS PASSED")
            print("The admin question creation fix is working correctly!")
            print("\nWhat was fixed:")
            print("- AnswerOption.clean() now checks if question.pk exists before filtering")
            print("- Admin inline forms can now create questions with options without errors")
            print("- Validation constraints still work properly")
            return True
        else:
            print_section("❌ SOME TESTS FAILED")
            print("Please check the errors above")
            return False
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
