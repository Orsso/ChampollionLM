"""Token counting utilities for LLM context management."""

from __future__ import annotations

from functools import lru_cache
from typing import Sequence

import tiktoken


# Mistral models use similar tokenization to GPT models
# We use cl100k_base encoding as a good approximation
MISTRAL_CONTEXT_LIMIT = 128_000


@lru_cache(maxsize=1)
def get_encoding() -> tiktoken.Encoding:
    """
    Get tiktoken encoding for Mistral models.
    
    Mistral uses a similar tokenizer to GPT-4, so we use cl100k_base
    as a close approximation for token counting.
    """
    return tiktoken.get_encoding("cl100k_base")


def estimate_tokens(text: str) -> int:
    """
    Estimate token count for text using tiktoken.
    
    Args:
        text: Text to count tokens for
        
    Returns:
        Estimated token count
        
    Performance:
        - ~1ms for 10k tokens on modern hardware
        - Encoding is cached for repeated calls
    """
    if not text:
        return 0
    
    encoding = get_encoding()
    return len(encoding.encode(text))


def estimate_tokens_batch(texts: Sequence[str]) -> int:
    """
    Estimate total token count for multiple texts.
    
    Args:
        texts: Sequence of texts to count tokens for
        
    Returns:
        Total estimated token count across all texts
    """
    return sum(estimate_tokens(text) for text in texts)


def format_token_count(count: int) -> str:
    """
    Format token count in human-readable format.
    
    Args:
        count: Token count
        
    Returns:
        Formatted string (e.g., "1.2k", "45k", "128k")
    """
    if count < 1000:
        return str(count)
    elif count < 10000:
        return f"{count / 1000:.1f}k"
    else:
        return f"{count // 1000}k"


def get_context_usage_percentage(token_count: int) -> float:
    """
    Calculate percentage of context window used for mistral-medium-latest.
    
    Args:
        token_count: Number of tokens
        
    Returns:
        Percentage of context used (0-100)
    """
    return (token_count / MISTRAL_CONTEXT_LIMIT) * 100
