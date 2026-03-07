"""create stock_movements table

Revision ID: e8f9a1b2c3d4
Revises: d77fca242bfa
Create Date: 2026-01-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8f9a1b2c3d4'
down_revision: Union[str, Sequence[str], None] = 'd77fca242bfa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'stock_movements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('movement_type', sa.String(length=20), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('previous_stock', sa.Integer(), nullable=False),
        sa.Column('new_stock', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('sale_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("movement_type IN ('entrada', 'salida', 'ajuste')", name='valid_movement_type'),
        sa.CheckConstraint('quantity > 0', name='positive_quantity'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['sale_id'], ['sales.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_stock_movements_product', 'stock_movements', ['product_id'])
    op.create_index('idx_stock_movements_created', 'stock_movements', ['created_at'], postgresql_using='btree')
    op.create_index('idx_stock_movements_type', 'stock_movements', ['movement_type'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('idx_stock_movements_type', table_name='stock_movements')
    op.drop_index('idx_stock_movements_created', table_name='stock_movements')
    op.drop_index('idx_stock_movements_product', table_name='stock_movements')
    op.drop_table('stock_movements')
