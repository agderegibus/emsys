"""add_fields_to_customers

Revision ID: cb8cde288614
Revises: e8f9a1b2c3d4
Create Date: 2026-01-24 12:07:58.503939

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cb8cde288614'
down_revision: Union[str, Sequence[str], None] = 'e8f9a1b2c3d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add email, address, and created_at fields to customers table
    op.add_column('customers', sa.Column('email', sa.String(length=255), nullable=True))
    op.add_column('customers', sa.Column('address', sa.Text(), nullable=True))
    op.add_column('customers', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))

    # Create indexes for better performance
    op.create_index('ix_customers_email', 'customers', ['email'])


def downgrade() -> None:
    """Downgrade schema."""
    # Remove indexes
    op.drop_index('ix_customers_email', table_name='customers')

    # Remove columns
    op.drop_column('customers', 'created_at')
    op.drop_column('customers', 'address')
    op.drop_column('customers', 'email')
