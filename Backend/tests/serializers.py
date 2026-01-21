
from rest_framework import serializers
from .models import Test, TestAssignment, Question, AnswerOption, StudentAnswer


class StudentTestListSerializer(serializers.ModelSerializer):
    course = serializers.StringRelatedField()
    chapter = serializers.StringRelatedField()
    
    class Meta:
        model = Test
        fields = (
            'id',
            'title',
            'course',
            'chapter',
            'total_marks',
        )
        
class AnswerOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ('id','text')  
        
        
class QuestionSerializer(serializers.ModelSerializer):
     answers = AnswerOptionSerializer(many=True)
     
     class Meta:
         model = Question
         fields = ('id','text','answers')
         
         
         
class StudentAnswerSubmitSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_answer_id = serializers.IntegerField()
    


class AnswerReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ('id','text','is_correct')
        
        
        
class QuestionReviewSerializer(serializers.ModelSerializer):
    answers = AnswerReviewSerializer(many=True)
    
    class Meta:
        model = Question
        fields = ('id','text','answers')
        
    
    
class StudentAnswerReviewSerializers(serializers.ModelSerializer):
    question = serializers.StringRelatedField()
    selected_option = serializers.StringRelatedField()
    
    class Meta:
        model = StudentAnswer
        fields = ('question','selected_option','is_correct')
        
        