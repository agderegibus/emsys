"""create_suppliers_and_product_supplier_relation

Revision ID: c5cdde790805
Revises: cb8cde288614
Create Date: 2026-01-24 19:15:48.915124

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5cdde790805'
down_revision: Union[str, Sequence[str], None] = 'cb8cde288614'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create suppliers table
    op.create_table(
        'suppliers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('contact_name', sa.String(length=200), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_suppliers_name', 'suppliers', ['name'])
    op.create_index('ix_suppliers_email', 'suppliers', ['email'])

    # Create product_supplier many-to-many relationship table
    op.create_table(
        'product_supplier',
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('supplier_id', sa.Integer(), nullable=False),
        sa.Column('supplier_product_code', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('product_id', 'supplier_id')
    )

    # Add supplier_id and purchase_price to stock_movements
    op.add_column('stock_movements', sa.Column('supplier_id', sa.Integer(), nullable=True))
    op.add_column('stock_movements', sa.Column('purchase_price_ars', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_stock_movements_supplier', 'stock_movements', 'suppliers', ['supplier_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_stock_movements_supplier', 'stock_movements', ['supplier_id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Remove from stock_movements
    op.drop_index('ix_stock_movements_supplier', table_name='stock_movements')
    op.drop_constraint('fk_stock_movements_supplier', 'stock_movements', type_='foreignkey')
    op.drop_column('stock_movements', 'purchase_price_ars')
    op.drop_column('stock_movements', 'supplier_id')

    # Drop product_supplier table
    op.drop_table('product_supplier')

    # Drop suppliers table
    op.drop_index('ix_suppliers_email', table_name='suppliers')
    op.drop_index('ix_suppliers_name', table_name='suppliers')
    op.drop_table('suppliers')
