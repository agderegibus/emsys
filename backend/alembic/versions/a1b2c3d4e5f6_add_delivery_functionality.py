"""add delivery functionality

Revision ID: a1b2c3d4e5f6
Revises: dc6ef529f898
Create Date: 2026-01-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'dc6ef529f898'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create delivery_persons table
    op.create_table(
        'delivery_persons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_delivery_persons_id'), 'delivery_persons', ['id'], unique=False)

    # Add delivery columns to sales table
    op.add_column('sales', sa.Column('is_delivery', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('sales', sa.Column('delivery_address', sa.Text(), nullable=True))
    op.add_column('sales', sa.Column('delivery_person_id', sa.Integer(), nullable=True))

    # Create indexes
    op.create_index(op.f('ix_sales_is_delivery'), 'sales', ['is_delivery'], unique=False)
    op.create_index(op.f('ix_sales_delivery_person_id'), 'sales', ['delivery_person_id'], unique=False)

    # Create foreign key
    op.create_foreign_key(
        'fk_sales_delivery_person_id',
        'sales', 'delivery_persons',
        ['delivery_person_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Drop foreign key and columns from sales
    op.drop_constraint('fk_sales_delivery_person_id', 'sales', type_='foreignkey')
    op.drop_index(op.f('ix_sales_delivery_person_id'), table_name='sales')
    op.drop_index(op.f('ix_sales_is_delivery'), table_name='sales')
    op.drop_column('sales', 'delivery_person_id')
    op.drop_column('sales', 'delivery_address')
    op.drop_column('sales', 'is_delivery')

    # Drop delivery_persons table
    op.drop_index(op.f('ix_delivery_persons_id'), table_name='delivery_persons')
    op.drop_table('delivery_persons')
