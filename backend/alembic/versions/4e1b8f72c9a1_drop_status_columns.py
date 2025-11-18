"""drop_status_columns

Revision ID: 4e1b8f72c9a1
Revises: 3ed7f60d93ed
Create Date: 2025-11-18 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '4e1b8f72c9a1'
down_revision = '3ed7f60d93ed'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Check if columns exist before dropping to avoid errors if already dropped
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('project')]

    if 'status' in columns:
        op.drop_column('project', 'status')
    
    if 'transcription_error' in columns:
        op.drop_column('project', 'transcription_error')
        
    if 'document_error' in columns:
        op.drop_column('project', 'document_error')

def downgrade() -> None:
    op.add_column('project', sa.Column('status', sa.VARCHAR(length=20), autoincrement=False, nullable=True))
    op.add_column('project', sa.Column('transcription_error', sa.TEXT(), autoincrement=False, nullable=True))
    op.add_column('project', sa.Column('document_error', sa.TEXT(), autoincrement=False, nullable=True))

