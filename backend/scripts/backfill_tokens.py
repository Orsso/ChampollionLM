import asyncio
import sys
from pathlib import Path

# Add backend directory to python path
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from sqlalchemy import select
from app.db.session import get_session
from app.models import Source
from app.utils.tokens import estimate_tokens
from app.utils.text_extraction import extract_text_from_source

async def backfill_tokens():
    print("Starting token backfill...")
    async for session in get_session():
        # Get all sources
        stmt = select(Source)
        result = await session.execute(stmt)
        sources = result.scalars().all()
        
        print(f"Found {len(sources)} sources.")
        
        updated_count = 0
        for source in sources:
            if source.token_count is None:
                try:
                    text = extract_text_from_source(source)
                    if text:
                        count = estimate_tokens(text)
                        source.token_count = count
                        updated_count += 1
                        print(f"Updated source {source.id} ({source.title}): {count} tokens")
                    else:
                        print(f"Skipping source {source.id} ({source.title}): No text extracted")
                except Exception as e:
                    print(f"Error processing source {source.id}: {e}")
        
        if updated_count > 0:
            await session.commit()
            print(f"Successfully updated {updated_count} sources.")
        else:
            print("No sources needed updating.")
        
        return

if __name__ == "__main__":
    asyncio.run(backfill_tokens())
