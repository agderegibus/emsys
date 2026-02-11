"""add stock_qty to products

Revision ID: c3d8aba58c16
Revises: f37e37b146dc
Create Date: 2026-01-03 16:02:15.406850

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d8aba58c16'
down_revision: Union[str, Sequence[str], None] = 'f37e37b146dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add stock_qty column to products table
    op.add_column('products', sa.Column('stock_qty', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove stock_qty column from products table
    op.drop_column('products', 'stock_qty')
