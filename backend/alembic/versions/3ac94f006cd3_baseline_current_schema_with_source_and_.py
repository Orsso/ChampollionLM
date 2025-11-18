"""baseline_current_schema_with_source_and_

Revision ID: 3ac94f006cd3
Revises: 
Create Date: 2025-10-15 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3ac94f006cd3'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Baseline migration - assumes schema already exists from prior manual migrations.
    This is a no-op migration that establishes the starting point for Alembic tracking.
    """
    pass


def downgrade() -> None:
    """Baseline cannot be downgraded."""
    pass

