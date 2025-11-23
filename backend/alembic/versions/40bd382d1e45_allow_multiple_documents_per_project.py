"""allow multiple documents per project

Revision ID: 40bd382d1e45
Revises: caeecb4cdaeb
Create Date: 2025-11-22 15:58:29.963813

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '40bd382d1e45'
down_revision: Union[str, None] = 'caeecb4cdaeb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('document', schema=None) as batch_op:
        batch_op.drop_constraint('uq_document_project', type_='unique')


def downgrade() -> None:
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('document', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_document_project', ['project_id'])
