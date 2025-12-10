"""Add demo_access table for demo API key sharing

Revision ID: a7b8c9d0e1f2
Revises: 9b4d6e8f0a23
Create Date: 2025-12-10 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, None] = '9b4d6e8f0a23'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create demo_access table."""
    op.create_table(
        'demo_access',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('granted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('granted_by', sa.String(length=255), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_demo_access_user_id'), 'demo_access', ['user_id'], unique=True)


def downgrade() -> None:
    """Drop demo_access table."""
    op.drop_index(op.f('ix_demo_access_user_id'), table_name='demo_access')
    op.drop_table('demo_access')
