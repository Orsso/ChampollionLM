#!/usr/bin/env python3
"""
Fix existing document sources by copying content to processed_content.

This script addresses the bug where document sources were created with content
but without processed_content, causing them to appear as "unprocessed" in the UI.

Usage:
    python scripts/fix_document_sources.py
"""
import asyncio
import sys
from pathlib import Path

# Add backend to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models import Source, SourceType


async def fix_document_sources():
    """Fix document sources with NULL processed_content."""
    async with AsyncSessionLocal() as session:
        # Find all document sources with content but no processed_content
        stmt = (
            select(Source)
            .where(
                Source.type == SourceType.DOCUMENT,
                Source.content.isnot(None),
                Source.processed_content.is_(None)
            )
        )
        result = await session.execute(stmt)
        sources = result.scalars().all()
        
        if not sources:
            print("✓ No document sources need fixing.")
            return
        
        print(f"Found {len(sources)} document source(s) to fix:")
        
        for source in sources:
            print(f"  - Source #{source.id}: {source.title}")
            # Copy content to processed_content
            source.processed_content = source.content
        
        await session.commit()
        print(f"\n✓ Successfully fixed {len(sources)} document source(s).")


async def main():
    """Main entry point."""
    print("=" * 60)
    print("Fix Document Sources - Processed Content Migration")
    print("=" * 60)
    print()
    
    try:
        await fix_document_sources()
        print("\n✓ Migration completed successfully!")
        return 0
    except Exception as e:
        print(f"\n✗ Migration failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

