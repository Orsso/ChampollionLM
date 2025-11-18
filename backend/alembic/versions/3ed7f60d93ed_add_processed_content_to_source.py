"""add_processed_content_to_source

Revision ID: 3ed7f60d93ed
Revises: 
Create Date: 2025-10-15 09:29:32.300709

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3ed7f60d93ed'
down_revision: Union[str, None] = '3ac94f006cd3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add processed_content field to source table and migrate transcript data.
    
    This consolidates all source processing results (transcription, OCR, extraction)
    into a single unified field instead of having separate tables.
    """
    # 1. Add processed_content column to source
    op.add_column('source', sa.Column('processed_content', sa.Text(), nullable=True))
    
    # 2. Migrate data from transcript table to source.processed_content
    connection = op.get_bind()
    connection.execute(sa.text("""
        UPDATE source
        SET processed_content = (
            SELECT text 
            FROM transcript 
            WHERE transcript.source_id = source.id
        )
        WHERE EXISTS (
            SELECT 1 FROM transcript WHERE transcript.source_id = source.id
        )
    """))
    
    # 3. Drop the transcript table (no longer needed)
    op.drop_table('transcript')


def downgrade() -> None:
    """
    Revert: recreate transcript table and move data back.
    """
    # 1. Recreate transcript table
    op.create_table('transcript',
        sa.Column('id', sa.INTEGER(), nullable=False),
        sa.Column('source_id', sa.INTEGER(), nullable=False),
        sa.Column('provider', sa.VARCHAR(length=80), nullable=False),
        sa.Column('text', sa.TEXT(), nullable=False),
        sa.Column('created_at', sa.DATETIME(), nullable=False),
        sa.ForeignKeyConstraint(['source_id'], ['source.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 2. Migrate data back from source.processed_content to transcript
    connection = op.get_bind()
    connection.execute(sa.text("""
        INSERT INTO transcript (source_id, provider, text, created_at)
        SELECT id, 'mistral', processed_content, datetime('now')
        FROM source
        WHERE processed_content IS NOT NULL AND type = 'audio'
    """))
    
    # 3. Drop processed_content column
    op.drop_column('source', 'processed_content')
