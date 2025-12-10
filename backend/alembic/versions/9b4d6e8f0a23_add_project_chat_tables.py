"""add_project_chat_tables

Revision ID: 9b4d6e8f0a23
Revises: 5720f1316c87
Create Date: 2025-12-09 14:50:00.000000

This migration creates the project chat tables:
- project_chat_session: Groups messages into named conversations
- project_chat_message: Stores individual chat messages (with session_id)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b4d6e8f0a23'
down_revision: Union[str, None] = '5720f1316c87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create project_chat_session table first (parent)
    op.create_table('project_chat_session',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_chat_session_project_id'), 'project_chat_session', ['project_id'], unique=False)

    # Create project_chat_message table (child)
    op.create_table('project_chat_message',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=True),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('message_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['project_chat_session.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_chat_message_project_id'), 'project_chat_message', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_chat_message_session_id'), 'project_chat_message', ['session_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_project_chat_message_session_id'), table_name='project_chat_message')
    op.drop_index(op.f('ix_project_chat_message_project_id'), table_name='project_chat_message')
    op.drop_table('project_chat_message')
    op.drop_index(op.f('ix_project_chat_session_project_id'), table_name='project_chat_session')
    op.drop_table('project_chat_session')
