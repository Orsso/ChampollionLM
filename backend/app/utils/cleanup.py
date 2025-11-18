"""Utility functions for cleaning up temporary files."""

import logging
from datetime import UTC, datetime, timedelta
from pathlib import Path

logger = logging.getLogger(__name__)


def cleanup_temp_files(temp_dir: Path, max_age_hours: int = 24) -> int:
    """Remove temporary files older than max_age_hours.
    
    Args:
        temp_dir: Directory containing temporary files
        max_age_hours: Maximum age in hours before files are deleted
        
    Returns:
        Number of files deleted
    """
    if not temp_dir.exists():
        logger.debug("Temp directory does not exist", extra={"dir": str(temp_dir)})
        return 0
    
    cutoff = datetime.now(tz=UTC) - timedelta(hours=max_age_hours)
    deleted = 0
    
    for file_path in temp_dir.rglob("*"):
        if not file_path.is_file():
            continue
        
        try:
            mtime = datetime.fromtimestamp(file_path.stat().st_mtime, tz=UTC)
            if mtime < cutoff:
                file_path.unlink()
                deleted += 1
                logger.debug("Deleted temp file", extra={"file": str(file_path)})
        except OSError as exc:
            logger.warning("Failed to delete temp file", extra={"file": str(file_path), "error": str(exc)})
    
    logger.info("Temp files cleanup completed", extra={"deleted": deleted, "dir": str(temp_dir)})
    return deleted

