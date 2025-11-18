"""Pagination schemas for API endpoints."""

from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, Field


T = TypeVar("T")


class PaginationParams(BaseModel):
    """
    Query parameters for paginated endpoints.

    Used as FastAPI dependency to parse limit/offset from query string.
    """
    limit: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Number of items to return (1-100)"
    )
    offset: int = Field(
        default=0,
        ge=0,
        description="Number of items to skip"
    )


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response wrapper.

    Wraps any list of items with pagination metadata,
    allowing clients to implement pagination UI.
    """
    items: list[T] = Field(
        description="List of items for current page"
    )
    total: int = Field(
        ge=0,
        description="Total number of items across all pages"
    )
    limit: int = Field(
        ge=1,
        description="Number of items requested per page"
    )
    offset: int = Field(
        ge=0,
        description="Number of items skipped"
    )
    has_more: bool = Field(
        description="Whether more items exist beyond current page"
    )

    @classmethod
    def create(cls, items: list[T], total: int, limit: int, offset: int) -> PaginatedResponse[T]:
        """
        Factory method to create paginated response.

        Args:
            items: List of items for current page
            total: Total number of items
            limit: Items per page
            offset: Items skipped

        Returns:
            PaginatedResponse with has_more calculated
        """
        return cls(
            items=items,
            total=total,
            limit=limit,
            offset=offset,
            has_more=(offset + len(items)) < total
        )
