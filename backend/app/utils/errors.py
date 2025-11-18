"""Error handling utilities for consistent HTTP exceptions."""
from fastapi import HTTPException, status


def raise_not_found(resource: str, resource_id: int | str) -> None:
    """
    Raise 404 error for resource not found.

    Args:
        resource: Name of the resource type (e.g., "Project", "Source")
        resource_id: ID of the resource that was not found

    Raises:
        HTTPException: 404 error with formatted message
    """
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} with id {resource_id} not found"
    )


def raise_resource_unavailable(resource: str, reason: str) -> None:
    """
    Raise 404 error for unavailable resource.

    Args:
        resource: Name of the resource type
        reason: Explanation of why the resource is unavailable

    Raises:
        HTTPException: 404 error with formatted message
    """
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} not available: {reason}"
    )


def raise_invalid_request(message: str) -> None:
    """
    Raise 400 error for invalid request.

    Args:
        message: Description of what makes the request invalid

    Raises:
        HTTPException: 400 error with provided message
    """
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=message
    )
