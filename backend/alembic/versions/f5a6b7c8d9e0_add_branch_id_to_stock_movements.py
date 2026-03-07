"""add branch_id to stock_movements

Revision ID: f5a6b7c8d9e0
Revises: e4f5a6b7c8d9
Create Date: 2026-03-07 00:04:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f5a6b7c8d9e0'
down_revision = 'e4f5a6b7c8d9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add branch_id column to stock_movements
    op.add_column('stock_movements', sa.Column('branch_id', sa.Integer(), nullable=True))

    # Create index
    op.create_index(op.f('ix_stock_movements_branch_id'), 'stock_movements', ['branch_id'], unique=False)

    # Create foreign key
    op.create_foreign_key(
        'fk_stock_movements_branch_id',
        'stock_movements', 'branches',
        ['branch_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_stock_movements_branch_id', 'stock_movements', type_='foreignkey')
    op.drop_index(op.f('ix_stock_movements_branch_id'), table_name='stock_movements')
    op.drop_column('stock_movements', 'branch_id')
