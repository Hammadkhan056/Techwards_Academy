from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from courses.models import Course
from tests.models import Test, TestAssignment

User = get_user_model()

@receiver(post_save, sender=User)
def assign_published_tests_to_new_student(sender, instance, created, **kwargs):
    """
    When a new student enrolls in a course, automatically assign them published tests for that course
    """
    if not created or instance.role != 'STUDENT':
        return
    
    # Get all courses the student is enrolled in
    enrolled_courses = instance.enrolled_courses.all()
    
    for course in enrolled_courses:
        # Get all published tests for this course
        published_tests = Test.objects.filter(
            course=course,
            is_published=True,
            is_active=True
        )
        
        # Create test assignments
        for test in published_tests:
            # Check if assignment already exists
            existing = TestAssignment.objects.filter(
                student=instance,
                test=test,
                status='assigned'
            ).first()
            
            if not existing:
                TestAssignment.objects.create(
                    student=instance,
                    test=test,
                    status='assigned'
                )


@receiver(post_save, sender=Course)
def handle_course_student_change(sender, instance, **kwargs):
    """
    When students are added to a course, assign them published tests
    """
    # This is a simplified approach - in production, you'd want to track the actual changes
    # For now, we'll check all enrolled students and ensure they have assignments for published tests
    published_tests = Test.objects.filter(
        course=instance,
        is_published=True,
        is_active=True
    )
    
    if published_tests.exists():
        students = instance.students.all()
        
        for student in students:
            if student.role == 'STUDENT':
                for test in published_tests:
                    existing = TestAssignment.objects.filter(
                        student=student,
                        test=test,
                        status='assigned'
                    ).first()
                    
                    if not existing:
                        TestAssignment.objects.create(
                            student=student,
                            test=test,
                            status='assigned'
                        )
