from rest_framework import serializers
from django.utils import timezone
from django.db.models import Max
from .models import Test, TestAssignment, Question, AnswerOption, StudentAnswer


class AnswerOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ('id', 'text', 'is_correct', 'created_at')
        read_only_fields = ('id', 'created_at')


class QuestionSerializer(serializers.ModelSerializer):
    options = AnswerOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'text', 'marks', 'test', 'options', 'created_at')
        read_only_fields = ('id', 'created_at')


class StudentTestListSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    chapter_title = serializers.CharField(source='chapter.title', read_only=True, allow_null=True)

    class Meta:
        model = Test
        fields = (
            'id', 'title', 'course', 'course_title',
            'chapter', 'chapter_title', 'total_marks', 'is_active', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class TestDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Test
        fields = (
            'id', 'title', 'course', 'course_title',
            'chapter', 'total_marks', 'is_active',
            'questions', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class TestAssignmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    test_title = serializers.CharField(source='test.title', read_only=True)
    test_total_marks = serializers.IntegerField(source='test.total_marks', read_only=True)

    class Meta:
        model = TestAssignment
        fields = [
            'id', 'student', 'student_name', 'student_email',
            'test', 'test_title', 'test_total_marks',
            'attempt_number', 'test_version', 'status',
            'obtained_marks', 'total_marks',
            'assigned_at', 'started_at', 'submitted_at', 'evaluated_at', 'due_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'student', 'test', 'attempt_number', 'test_version',
            'assigned_at', 'evaluated_at', 'created_at', 'updated_at'
        ]

    def validate(self, data):

        if data.get('due_at'):
            if data['due_at'] <= timezone.now():
                raise serializers.ValidationError({
                    'due_at': 'Due date must be in the future.'
                })
        return data

    def create(self, validated_data):

        student = validated_data['student']
        test = validated_data['test']

        # Get next attempt number
        max_attempt = TestAssignment.objects.filter(
            student=student,
            test=test
        ).aggregate(
            max_attempt=Max('attempt_number')
        )['max_attempt'] or 0

        validated_data['attempt_number'] = max_attempt + 1
        validated_data['test_version'] = 1 
        validated_data['total_marks'] = test.total_marks 

        return super().create(validated_data)


class TestAssignmentListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    test_title = serializers.CharField(source='test.title', read_only=True)

    class Meta:
        model = TestAssignment
        fields = [
            'id', 'student_name', 'test_title',
            'attempt_number', 'status', 'obtained_marks', 'total_marks',
            'assigned_at', 'evaluated_at'
        ]
        read_only_fields = fields




class StudentAnswerDetailSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    selected_option_text = serializers.CharField(source='selected_option.text', read_only=True)
    correct_option = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StudentAnswer
        fields = [
            'id', 'assignment', 'question', 'question_text',
            'selected_option', 'selected_option_text',
            'is_correct', 'marks_obtained', 'question_marks',
            'answered_at', 'evaluated_at'
        ]
        read_only_fields = [
            'id', 'is_correct', 'marks_obtained', 'question_marks',
            'answered_at', 'evaluated_at'
        ]

    def get_correct_option(self, obj):
        correct = obj.question.options.filter(is_correct=True).first()
        if correct:
            return {
                'id': correct.id,
                'text': correct.text
            }
        return None


class StudentAnswerSubmitSerializer(serializers.Serializer):
    """Serializer for submitting answers during test."""
    question_id = serializers.IntegerField()
    selected_option_id = serializers.IntegerField()

    def validate(self, data):
        """Validate question and option exist and are related."""
        question_id = data.get('question_id')
        option_id = data.get('selected_option_id')

        try:
            question = Question.objects.get(id=question_id)
            option = AnswerOption.objects.get(id=option_id)

            if option.question_id != question_id:
                raise serializers.ValidationError(
                    "Selected option doesn't belong to this question."
                )
        except (Question.DoesNotExist, AnswerOption.DoesNotExist):
            raise serializers.ValidationError(
                "Invalid question or option ID."
            )

        data['question'] = question
        data['option'] = option
        return data


class AnswerReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ('id', 'text', 'is_correct')


class QuestionReviewSerializer(serializers.ModelSerializer):
    options = AnswerReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'text', 'marks', 'options')


class StudentAnswerReviewSerializer(serializers.ModelSerializer):
    question = QuestionReviewSerializer(read_only=True)
    selected_option_text = serializers.CharField(source='selected_option.text', read_only=True)
    correct_option_text = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StudentAnswer
        fields = (
            'id', 'question', 'selected_option_text', 'correct_option_text',
            'is_correct', 'marks_obtained', 'question_marks', 'evaluated_at'
        )

    def get_correct_option_text(self, obj):
        correct = obj.question.options.filter(is_correct=True).first()
        return correct.text if correct else None
        
        