"""add_payment_method_and_cashier_to_sales

Revision ID: dc6ef529f898
Revises: c5cdde790805
Create Date: 2026-01-24 19:20:13.803084

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dc6ef529f898'
down_revision: Union[str, Sequence[str], None] = 'c5cdde790805'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add payment_method and cashier to sales table
    op.add_column('sales', sa.Column('payment_method', sa.String(length=50), nullable=True))
    op.add_column('sales', sa.Column('cashier', sa.String(length=100), nullable=True))

    # Add check constraint for payment_method
    op.create_check_constraint(
        'valid_payment_method',
        'sales',
        "payment_method IN ('efectivo', 'tarjeta', 'mercadopago') OR payment_method IS NULL"
    )

    # Create index for better query performance
    op.create_index('ix_sales_payment_method', 'sales', ['payment_method'])
    op.create_index('ix_sales_cashier', 'sales', ['cashier'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_sales_cashier', table_name='sales')
    op.drop_index('ix_sales_payment_method', table_name='sales')
    op.drop_constraint('valid_payment_method', 'sales', type_='check')
    op.drop_column('sales', 'cashier')
    op.drop_column('sales', 'payment_method')
