"""
Mock implementations for Mistral AI API.

These mocks simulate Mistral API responses for testing without making real API calls.
"""
from dataclasses import dataclass, field
from typing import Any, Optional
from unittest.mock import AsyncMock, MagicMock


@dataclass
class MockChatMessage:
    """Mock chat message response."""
    content: str
    role: str = "assistant"


@dataclass
class MockChatChoice:
    """Mock chat completion choice."""
    message: MockChatMessage
    index: int = 0
    finish_reason: str = "stop"


@dataclass
class MockChatCompletionResponse:
    """Mock chat completion response."""
    id: str = "mock-completion-id"
    model: str = "mistral-large-latest"
    choices: list = field(default_factory=list)
    usage: dict = field(default_factory=lambda: {"prompt_tokens": 100, "completion_tokens": 50, "total_tokens": 150})

    @classmethod
    def create(cls, content: str = "This is a mock response from Mistral."):
        """Create a mock response with the given content."""
        return cls(
            choices=[MockChatChoice(message=MockChatMessage(content=content))]
        )


@dataclass
class MockEmbeddingData:
    """Mock embedding data."""
    embedding: list = field(default_factory=lambda: [0.1] * 1024)
    index: int = 0


@dataclass
class MockEmbeddingResponse:
    """Mock embedding response."""
    data: list = field(default_factory=list)
    model: str = "mistral-embed"
    usage: dict = field(default_factory=lambda: {"prompt_tokens": 10, "total_tokens": 10})

    @classmethod
    def create(cls, num_embeddings: int = 1):
        """Create a mock response with the specified number of embeddings."""
        return cls(
            data=[MockEmbeddingData(index=i) for i in range(num_embeddings)]
        )


@dataclass
class MockTranscriptionResponse:
    """Mock audio transcription response."""
    text: str = "This is the transcribed text from the audio."


class MockMistralClient:
    """
    Mock Mistral API client for testing.

    Usage:
        mock_client = MockMistralClient()
        mock_client.set_chat_response("Custom response")
        # Use mock_client in place of real Mistral client
    """

    def __init__(self, api_key: str = "test-api-key"):
        self.api_key = api_key
        self._chat_response = MockChatCompletionResponse.create()
        self._embedding_response = MockEmbeddingResponse.create()
        self._transcription_response = MockTranscriptionResponse()
        self._should_fail = False
        self._failure_message = "Mock API error"
        self.calls: list[dict] = []

    def set_chat_response(self, content: str):
        """Set the response content for chat completions."""
        self._chat_response = MockChatCompletionResponse.create(content)

    def set_embedding_response(self, num_embeddings: int = 1):
        """Set the number of embeddings to return."""
        self._embedding_response = MockEmbeddingResponse.create(num_embeddings)

    def set_transcription_response(self, text: str):
        """Set the transcription text to return."""
        self._transcription_response = MockTranscriptionResponse(text=text)

    def set_failure(self, message: str = "Mock API error"):
        """Configure the mock to raise an error on next call."""
        self._should_fail = True
        self._failure_message = message

    def clear_failure(self):
        """Clear failure mode."""
        self._should_fail = False

    def _check_failure(self):
        """Check if mock should raise an error."""
        if self._should_fail:
            raise Exception(self._failure_message)

    async def chat_complete_async(
        self,
        model: str,
        messages: list,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> MockChatCompletionResponse:
        """Mock async chat completion."""
        self._check_failure()
        self.calls.append({
            "method": "chat_complete_async",
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            **kwargs
        })
        return self._chat_response

    def chat_complete(
        self,
        model: str,
        messages: list,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> MockChatCompletionResponse:
        """Mock sync chat completion."""
        self._check_failure()
        self.calls.append({
            "method": "chat_complete",
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            **kwargs
        })
        return self._chat_response

    async def embeddings_async(
        self,
        model: str,
        inputs: list,
        **kwargs
    ) -> MockEmbeddingResponse:
        """Mock async embeddings."""
        self._check_failure()
        self.calls.append({
            "method": "embeddings_async",
            "model": model,
            "inputs": inputs,
            **kwargs
        })
        return MockEmbeddingResponse.create(len(inputs))

    def embeddings(
        self,
        model: str,
        inputs: list,
        **kwargs
    ) -> MockEmbeddingResponse:
        """Mock sync embeddings."""
        self._check_failure()
        self.calls.append({
            "method": "embeddings",
            "model": model,
            "inputs": inputs,
            **kwargs
        })
        return MockEmbeddingResponse.create(len(inputs))


class MockMistralAudioClient:
    """Mock for Mistral audio transcription."""

    def __init__(self, api_key: str = "test-api-key"):
        self.api_key = api_key
        self._transcription_text = "This is the transcribed text from the audio."
        self._should_fail = False
        self._failure_message = "Transcription failed"
        self.calls: list[dict] = []

    def set_transcription(self, text: str):
        """Set the transcription text to return."""
        self._transcription_text = text

    def set_failure(self, message: str = "Transcription failed"):
        """Configure mock to fail."""
        self._should_fail = True
        self._failure_message = message

    async def transcribe_async(self, file_path: str, language: Optional[str] = None) -> str:
        """Mock async transcription."""
        if self._should_fail:
            raise Exception(self._failure_message)

        self.calls.append({
            "method": "transcribe_async",
            "file_path": file_path,
            "language": language,
        })
        return self._transcription_text


def create_mock_mistral_client(monkeypatch, response_content: str = "Mock response"):
    """
    Pytest fixture helper to create and install a mock Mistral client.

    Usage:
        def test_something(monkeypatch):
            mock_client = create_mock_mistral_client(monkeypatch)
            # Your test code here
            assert mock_client.calls[0]["method"] == "chat_complete_async"
    """
    mock_client = MockMistralClient()
    mock_client.set_chat_response(response_content)

    # Patch the Mistral import
    monkeypatch.setattr("mistralai.Mistral", lambda api_key: mock_client)

    return mock_client
