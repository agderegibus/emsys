"""add branch_id to sales

Revision ID: e4f5a6b7c8d9
Revises: d3e4f5a6b7c8
Create Date: 2026-03-07 00:03:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e4f5a6b7c8d9'
down_revision = 'd3e4f5a6b7c8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add branch_id column to sales
    op.add_column('sales', sa.Column('branch_id', sa.Integer(), nullable=True))

    # Create index
    op.create_index(op.f('ix_sales_branch_id'), 'sales', ['branch_id'], unique=False)

    # Create foreign key
    op.create_foreign_key(
        'fk_sales_branch_id',
        'sales', 'branches',
        ['branch_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_sales_branch_id', 'sales', type_='foreignkey')
    op.drop_index(op.f('ix_sales_branch_id'), table_name='sales')
    op.drop_column('sales', 'branch_id')
