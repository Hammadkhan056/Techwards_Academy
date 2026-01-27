from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tests.models import Test, TestAssignment
from courses.models import Course

User = get_user_model()

class Command(BaseCommand):
    help = 'Assign a test to all students in a course'

    def add_arguments(self, parser):
        parser.add_argument('--test-id', type=int, required=True, help='Test ID to assign')
        parser.add_argument('--course-id', type=int, help='Course ID (assign to all enrolled students)')
        parser.add_argument('--student-email', type=str, help='Assign to specific student email')
        parser.add_argument('--due-hours', type=int, default=24, help='Due date in hours from now')

    def handle(self, *args, **options):
        test_id = options['test_id']
        course_id = options.get('course_id')
        student_email = options.get('student_email')
        due_hours = options['due_hours']

        try:
            test = Test.objects.get(id=test_id, is_published=True)
        except Test.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Test with ID {test_id} not found or not published')
            )
            return

        from django.utils import timezone
        from datetime import timedelta
        due_at = timezone.now() + timedelta(hours=due_hours)

        students = []
        
        if course_id:
            try:
                course = Course.objects.get(id=course_id)
                students = list(course.students.all())
                self.stdout.write(f'Found {len(students)} students in course: {course.title}')
            except Course.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Course with ID {course_id} not found')
                )
                return
        
        elif student_email:
            try:
                student = User.objects.get(email=student_email, role='STUDENT')
                students = [student]
                self.stdout.write(f'Found student: {student.name}')
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Student with email {student_email} not found')
                )
                return
        else:
            self.stdout.write(
                self.style.ERROR('Either --course-id or --student-email is required')
            )
            return

        # Create assignments
        created_count = 0
        for student in students:
            # Check if already assigned
            existing = TestAssignment.objects.filter(
                student=student,
                test=test,
                status='assigned'
            ).first()
            
            if not existing:
                TestAssignment.objects.create(
                    student=student,
                    test=test,
                    due_at=due_at
                )
                created_count += 1
                self.stdout.write(f'  Assigned to: {student.name} ({student.email})')
            else:
                self.stdout.write(f'  Already assigned: {student.name} ({student.email})')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully assigned test "{test.title}" to {created_count} students'
            )
        )
