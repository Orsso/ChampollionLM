"""
Factory Boy factories for generating test data.

These factories create realistic test objects for use in unit and integration tests.
"""
import factory
from datetime import datetime, UTC
from passlib.hash import argon2


class UserFactory(factory.Factory):
    """Factory for creating User test objects."""

    class Meta:
        model = dict  # We'll use dicts for flexibility

    id = factory.Sequence(lambda n: n + 1)
    email = factory.LazyAttribute(lambda obj: f"user{obj.id}@example.com")
    hashed_password = factory.LazyFunction(lambda: argon2.hash("TestPassword123!"))
    is_active = True
    is_superuser = False
    is_verified = False
    api_key_encrypted = None
    created_at = factory.LazyFunction(lambda: datetime.now(tz=UTC))

    @classmethod
    def build_credentials(cls, **kwargs) -> dict:
        """Build user registration credentials (email + plain password)."""
        user = cls.build(**kwargs)
        return {
            "email": user["email"],
            "password": "TestPassword123!",
        }


class ProjectFactory(factory.Factory):
    """Factory for creating Project test objects."""

    class Meta:
        model = dict

    id = factory.Sequence(lambda n: n + 1)
    user_id = factory.Sequence(lambda n: n + 1)
    title = factory.Sequence(lambda n: f"Test Project {n}")
    description = factory.LazyAttribute(lambda obj: f"Description for {obj.title}")
    created_at = factory.LazyFunction(lambda: datetime.now(tz=UTC))


class SourceFactory(factory.Factory):
    """Factory for creating Source test objects."""

    class Meta:
        model = dict

    id = factory.Sequence(lambda n: n + 1)
    project_id = factory.Sequence(lambda n: n + 1)
    type = "document"
    title = factory.Sequence(lambda n: f"Test Source {n}")
    status = "processed"
    file_path = None
    content = factory.LazyAttribute(lambda obj: f"# {obj.title}\n\nTest content for source.")
    processed_content = factory.LazyAttribute(lambda obj: obj.content)
    token_count = factory.LazyAttribute(lambda obj: len(obj.content.split()) if obj.content else 0)
    source_metadata = None
    created_at = factory.LazyFunction(lambda: datetime.now(tz=UTC))

    class Params:
        audio = factory.Trait(
            type="audio",
            content=None,
            file_path="/path/to/audio.mp3",
            source_metadata={
                "duration_seconds": 120.5,
                "file_size_bytes": 1024000,
                "audio_format": "mp3",
                "sample_rate": 44100,
                "channels": 2,
            },
        )
        youtube = factory.Trait(
            type="youtube",
            content=None,
            source_metadata={
                "video_id": "dQw4w9WgXcQ",
                "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "channel_name": "Test Channel",
                "video_title": "Test Video",
                "language": "en",
                "is_auto_generated": False,
            },
        )


class DocumentFactory(factory.Factory):
    """Factory for creating Document test objects."""

    class Meta:
        model = dict

    id = factory.Sequence(lambda n: n + 1)
    project_id = factory.Sequence(lambda n: n + 1)
    title = factory.Sequence(lambda n: f"Generated Document {n}")
    content = factory.LazyAttribute(
        lambda obj: f"# {obj.title}\n\n## Summary\n\nThis is generated content."
    )
    document_type = "notes"
    format = "markdown"
    created_at = factory.LazyFunction(lambda: datetime.now(tz=UTC))


class ChatMessageFactory(factory.Factory):
    """Factory for creating chat message test objects."""

    class Meta:
        model = dict

    id = factory.Sequence(lambda n: n + 1)
    document_id = factory.Sequence(lambda n: n + 1)
    role = "user"
    content = factory.Sequence(lambda n: f"Test message {n}")
    created_at = factory.LazyFunction(lambda: datetime.now(tz=UTC))

    class Params:
        assistant = factory.Trait(
            role="assistant",
            content="This is an assistant response.",
        )


class DemoAccessFactory(factory.Factory):
    """Factory for creating DemoAccess test objects."""

    class Meta:
        model = dict

    id = factory.Sequence(lambda n: n + 1)
    user_id = factory.Sequence(lambda n: n + 1)
    granted_at = factory.LazyFunction(lambda: datetime.now(tz=UTC))
    expires_at = None
    revoked_at = None
    notes = "Test demo access"
