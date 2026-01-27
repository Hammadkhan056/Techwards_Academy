from rest_framework import serializers
from .models import Chapter, Course, VideoLecture, AdminNote, StudentNote
from accounts.models import User


class StudentDetailSerializer(serializers.Serializer):
    """Simple student detail for course view"""
    id = serializers.UUIDField()
    name = serializers.CharField()
    email = serializers.EmailField()


class CourseSerializer(serializers.ModelSerializer):
    archived_by_name = serializers.CharField(
        source='archived_by.name',
        read_only=True,
        allow_null=True
    )
    archived_by_email = serializers.CharField(
        source='archived_by.email',
        read_only=True,
        allow_null=True
    )
    students_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            'id', 'title', 'description', 'thumbnail', 'is_active',
            'students_count', 'is_enrolled',
            'created_at', 'updated_at',
            'archived_at', 'archived_by', 'archived_by_name', 'archived_by_email'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'archived_at', 'archived_by')

    def get_students_count(self, obj):
        """Count of enrolled students"""
        return obj.students.count()
    
    def get_is_enrolled(self, obj):
        """Check if current user is enrolled"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.students.filter(id=request.user.id).exists()
        return False

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Course title cannot be empty.")
        return value


class ChapterSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Chapter
        fields = ('id', 'title', 'course', 'course_title', 'order', 'description', 'created_at')
        read_only_fields = ('id', 'created_at')

    def validate_order(self, value):
        if value < 1:
            raise serializers.ValidationError("Chapter order must be greater than 0.")
        return value
        
        
class CourseDetailSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)
    students = StudentDetailSerializer(many=True, read_only=True)
    students_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    archived_by_name = serializers.CharField(
        source='archived_by.name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Course
        fields = (
            'id', 'title', 'description', 'thumbnail', 'is_active',
            'chapters', 'students', 'students_count', 'is_enrolled',
            'created_at', 'updated_at',
            'archived_at', 'archived_by', 'archived_by_name'
        )
        read_only_fields = (
            'id', 'chapters', 'students', 'created_at', 'updated_at',
            'archived_at', 'archived_by'
        )
    
    def get_students_count(self, obj):
        """Count of enrolled students"""
        return obj.students.count()
    
    def get_is_enrolled(self, obj):
        """Check if current user is enrolled"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.students.filter(id=request.user.id).exists()
        return False
        
        


class VideoLectureSerializer(serializers.ModelSerializer):
    """
    Serializer for video lectures.
    Includes embedded URL generation for YouTube videos.
    """
    chapter_title = serializers.CharField(source='chapter.title', read_only=True)
    embed_url = serializers.SerializerMethodField()
    
    class Meta:
        model = VideoLecture
        fields = (
            'id', 'chapter', 'chapter_title', 'title', 'description',
            'youtube_url', 'embed_url', 'order',
            'is_published', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'chapter', 'embed_url', 'created_at', 'updated_at')
    
    def get_embed_url(self, obj):
        """Generate embed URL from YouTube URL"""
        return obj.get_embed_url()
    
    def validate_order(self, value):
        if value < 1:
            raise serializers.ValidationError("Video order must be greater than 0.")
        return value


class VideoListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing videos in a chapter.
    """
    embed_url = serializers.SerializerMethodField()
    
    class Meta:
        model = VideoLecture
        fields = (
            'id', 'title', 'order', 'is_published', 'embed_url'
        )
    
    def get_embed_url(self, obj):
        return obj.get_embed_url()




class AdminNoteSerializer(serializers.ModelSerializer):
    """
    Serializer for official notes created by admins.
    Includes file metadata for file-based notes.
    """
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    chapter_title = serializers.CharField(source='chapter.title', read_only=True)
    file_name = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminNote
        fields = (
            'id', 'chapter', 'chapter_title', 'title', 'note_type',
            'content', 'file', 'file_name', 'file_size',
            'created_by', 'created_by_name',
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'chapter', 'created_by', 'created_by_name', 'file_name', 'file_size',
            'created_at', 'updated_at'
        )
    
    def get_file_name(self, obj):
        """Get file name if file exists"""
        return obj.get_file_name()
    
    def get_file_size(self, obj):
        """Get file size if file exists"""
        return obj.get_file_size()
    
    def validate(self, data):
        """Ensure text notes have content and file notes have file"""
        note_type = data.get('note_type', self.instance.note_type if self.instance else 'text')
        
        if note_type == 'text' and not data.get('content'):
            raise serializers.ValidationError(
                {'content': 'Text notes must have content.'}
            )
        
        if note_type == 'file' and not data.get('file') and not (self.instance and self.instance.file):
            raise serializers.ValidationError(
                {'file': 'File notes must have a file attached.'}
            )
        
        return data


class AdminNoteListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing admin notes.
    """
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = AdminNote
        fields = (
            'id', 'title', 'note_type', 'created_by_name', 'created_at'
        )



class StudentNoteSerializer(serializers.ModelSerializer):
    """
    Serializer for personal notes created by students.
    Only the student owner can view/edit their notes.
    """
    student_name = serializers.CharField(source='student.name', read_only=True)
    chapter_title = serializers.CharField(source='chapter.title', read_only=True)
    course = serializers.CharField(source='chapter.course.id', read_only=True)
    course_title = serializers.CharField(source='chapter.course.title', read_only=True)
    video_title = serializers.CharField(source='video.title', read_only=True, allow_null=True)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = StudentNote
        fields = (
            'id', 'chapter', 'chapter_title', 'course', 'course_title', 'video', 'video_title',
            'title', 'content', 'student_name', 'is_owner',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'student', 'student_name', 'is_owner', 'created_at')
    
    def get_is_owner(self, obj):
        """Check if current user is the note owner"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.student_id == request.user.id
        return False
    
    def validate_chapter(self, value):
        """Ensure student is enrolled in the chapter's course"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if not value.course.students.filter(id=request.user.id).exists():
                raise serializers.ValidationError(
                    "You must be enrolled in this course to create notes."
                )
        return value


class StudentNoteListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing student notes.
    """
    chapter_title = serializers.CharField(source='chapter.title', read_only=True)
    course = serializers.CharField(source='chapter.course.id', read_only=True)
    course_title = serializers.CharField(source='chapter.course.title', read_only=True)
    video_title = serializers.CharField(source='video.title', read_only=True, allow_null=True)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = StudentNote
        fields = (
            'id', 'title', 'content', 'chapter', 'chapter_title', 'course', 'course_title', 'video', 'video_title', 'is_owner', 'updated_at'
        )

    def get_is_owner(self, obj):
        """Check if current user is the note owner"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.student_id == request.user.id
        return False



class ChapterWithContentSerializer(serializers.ModelSerializer):
    """
    Serializer for chapter with all its learning content:
    - Videos
    - Admin notes
    - Student personal notes
    """
    videos = VideoListSerializer(many=True, read_only=True)
    admin_notes = AdminNoteListSerializer(many=True, read_only=True)
    student_notes = serializers.SerializerMethodField()
    course_title = serializers.CharField(source='course.title', read_only=True)
    
    class Meta:
        model = Chapter
        fields = (
            'id', 'title', 'description', 'order',
            'course', 'course_title',
            'videos', 'admin_notes', 'student_notes',
            'created_at'
        )
        read_only_fields = ('id', 'created_at')
    
    def get_student_notes(self, obj):
        """Get student notes for current user only"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            notes = obj.student_notes.filter(student=request.user)
            return StudentNoteListSerializer(notes, many=True).data
        return []


        
        