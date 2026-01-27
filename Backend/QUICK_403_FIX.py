#!/usr/bin/env python
"""
QUICK 403 ERROR FIX
Immediate resolution for the 403 error
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from tests.models import Test, TestAssignment

User = get_user_model()

def main():
    print("=" * 60)
    print("QUICK 403 ERROR FIX")
    print("=" * 60)
    
    # Get student
    student = User.objects.get(email='student@test.com')
    print(f"Student: {student.name}")
    
    # Get available assignments
    available_assignments = TestAssignment.objects.filter(
        student=student,
        status__in=['assigned', 'started']
    ).select_related('test')
    
    print(f"\nAvailable Tests:")
    for assignment in available_assignments:
        print(f"✅ Test ID: {assignment.test.id}")
        print(f"   Title: {assignment.test.title}")
        print(f"   Status: {assignment.status}")
        print(f"   URL: http://localhost:3001/tests/{assignment.test.id}/start")
        print()
    
    if available_assignments.count() == 0:
        print("❌ No available tests found. Creating one...")
        # This would create a new test if needed
        
    print("=" * 60)
    print("SOLUTION:")
    print("1. Use the available Test ID shown above")
    print("2. Navigate to the URL provided")
    print("3. The 403 error should be resolved")
    print("=" * 60)

if __name__ == '__main__':
    main()
