"""add document type

Revision ID: 50ce493f2f56
Revises: 40bd382d1e45
Create Date: 2025-11-23 12:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '50ce493f2f56'
down_revision: Union[str, None] = '40bd382d1e45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('document', sa.Column('type', sa.String(length=50), nullable=False, server_default='cours'))


def downgrade() -> None:
    op.drop_column('document', 'type')
