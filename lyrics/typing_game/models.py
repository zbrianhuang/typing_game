from django.db import models

# Create your models here.
# typing_game/models.py
from django.db import models

class LyricSnippet(models.Model):
    song_title = models.CharField(max_length=200)
    artist = models.CharField(max_length=150)
    lyrics = models.TextField(unique=True) # Ensure lyrics are unique to avoid duplicates
    yt_id= models.CharField(
        max_length=255,     # Allow slightly longer URLs if needed
        blank=True,         # Allow the field to be empty in forms (like admin)
        null=True,          # Allow the database column to be NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'"{self.lyrics[:50]}..." - {self.artist} ({self.song_title})'

    class Meta:
        verbose_name_plural = "Lyric Snippets"