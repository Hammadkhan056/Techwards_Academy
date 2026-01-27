from django.db import models
from django.utils import timezone
from django.conf import settings
from django.core.validators import FileExtensionValidator
import os

User = settings.AUTH_USER_MODEL


class Course(models.Model): 
    title = models.CharField(max_length=200, unique=True)
    description = models.TextField()
    thumbnail = models.ImageField(upload_to='course_thumbnails/', blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='archived_courses'
    )
    
   
    students = models.ManyToManyField(
        User,
        related_name='enrolled_courses',
        blank=True,
        help_text='Students enrolled in this course'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
        indexes = [
            models.Index(fields=['is_active', 'created_at']),
        ]
    
    def __str__(self):
        return self.title
    
    def archive(self, user=None):
  
        self.is_active = False
        self.archived_at = timezone.now()
        self.archived_by = user
        self.save()


class Chapter(models.Model):
    
    
    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,  
        related_name='chapters'
    )
    
    title = models.CharField(max_length=150) 
    description = models.TextField(null=True, blank=True)
    order = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
        unique_together = ('course', 'order')
        verbose_name = 'Chapter'
        verbose_name_plural = 'Chapters'
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"
    
    


class VideoLecture(models.Model):

    chapter = models.ForeignKey(
        Chapter,
        on_delete=models.CASCADE,
        related_name='videos',
        help_text='Chapter this video belongs to'
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)

    youtube_url = models.URLField(
        help_text='YouTube video URL or embed URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)'
    )


    order = models.PositiveIntegerField()
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['chapter', 'order']
        unique_together = ('chapter', 'order')
        verbose_name = 'Video Lecture'
        verbose_name_plural = 'Video Lectures'
        indexes = [
            models.Index(fields=['chapter', 'order']),
            models.Index(fields=['is_published']),
        ]
    
    def __str__(self):
        return f"{self.chapter.title} - {self.title}"
    
    def get_youtube_id(self):
        import re
        # Handle different YouTube URL formats
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})',
        ]
        for pattern in patterns:
            match = re.search(pattern, self.youtube_url)
            if match:
                return match.group(1)
        return None
    
    def get_embed_url(self):
        video_id = self.get_youtube_id()
        if video_id:
            return f'https://www.youtube.com/embed/{video_id}'
        return self.youtube_url


class AdminNote(models.Model):
 
    NOTE_TYPE_CHOICES = (
        ('text', 'Text Note'),
        ('file', 'File Upload'),
    )
    
    chapter = models.ForeignKey(
        Chapter,
        on_delete=models.CASCADE,
        related_name='admin_notes',
        help_text='Chapter this note belongs to'
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_admin_notes',
        help_text='Admin who created this note'
    )
    
    title = models.CharField(max_length=200)
    
    note_type = models.CharField(
        max_length=10,
        choices=NOTE_TYPE_CHOICES,
        default='text'
    )
    

    content = models.TextField(
        null=True,
        blank=True,
        help_text='Text content of the note'
    )
    
 
    file = models.FileField(
        upload_to='admin_notes/%Y/%m/%d/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'txt', 'xlsx', 'pptx'])],
        help_text='PDF, Word, or other document files'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Admin Note'
        verbose_name_plural = 'Admin Notes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['chapter']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.chapter.title} - {self.title}"
    
    def get_file_name(self):
        if self.file:
            return os.path.basename(self.file.name)
        return None
    
    def get_file_size(self):
        if self.file:
            return self.file.size
        return None



class StudentNote(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='personal_notes',
        help_text='Student who created this note'
    )
    chapter = models.ForeignKey(
        Chapter,
        on_delete=models.CASCADE,
        related_name='student_notes',
        help_text='Chapter this note is for'
    )
    
    video = models.ForeignKey(
        VideoLecture,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='student_notes',
        help_text='Specific video this note is for (optional)'
    )
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Student Note'
        verbose_name_plural = 'Student Notes'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['student', 'chapter']),
            models.Index(fields=['student', 'video']),
            models.Index(fields=['updated_at']),
        ]
        unique_together = [] 
    
    def __str__(self):
        return f"{self.student.name} - {self.title}"
