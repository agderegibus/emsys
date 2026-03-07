"""add auth fields to users

Revision ID: b1c2d3e4f5a6
Revises: a1b2c3d4e5f6
Create Date: 2026-03-07 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b1c2d3e4f5a6'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add password_hash column
    op.add_column('users', sa.Column('password_hash', sa.String(length=255), nullable=True))

    # Add role column with default 'cajero'
    op.add_column('users', sa.Column('role', sa.String(length=20), nullable=False, server_default='cajero'))

    # Create index on role for faster queries
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)

    # Add check constraint for valid roles
    op.create_check_constraint(
        'valid_role',
        'users',
        "role IN ('admin', 'cajero')"
    )


def downgrade() -> None:
    op.drop_constraint('valid_role', 'users', type_='check')
    op.drop_index(op.f('ix_users_role'), table_name='users')
    op.drop_column('users', 'role')
    op.drop_column('users', 'password_hash')
