"""create branch_stock table

Revision ID: b7c8d9e0f1a2
Revises: a6b7c8d9e0f1
Create Date: 2026-03-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c8d9e0f1a2'
down_revision: Union[str, None] = 'a6b7c8d9e0f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create branch_stock table
    op.create_table(
        'branch_stock',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('branch_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('stock_qty', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('min_stock', sa.Integer(), nullable=True, server_default='10'),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['branch_id'], ['branches.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('branch_id', 'product_id', name='uq_branch_product')
    )

    # Create indexes for faster queries
    op.create_index('idx_branch_stock_branch', 'branch_stock', ['branch_id'])
    op.create_index('idx_branch_stock_product', 'branch_stock', ['product_id'])


def downgrade() -> None:
    op.drop_index('idx_branch_stock_product')
    op.drop_index('idx_branch_stock_branch')
    op.drop_table('branch_stock')
