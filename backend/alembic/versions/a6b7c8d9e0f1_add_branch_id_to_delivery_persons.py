"""add branch_id to delivery_persons

Revision ID: a6b7c8d9e0f1
Revises: f5a6b7c8d9e0
Create Date: 2026-03-07 00:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a6b7c8d9e0f1'
down_revision = 'f5a6b7c8d9e0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add branch_id column to delivery_persons
    op.add_column('delivery_persons', sa.Column('branch_id', sa.Integer(), nullable=True))

    # Create index
    op.create_index(op.f('ix_delivery_persons_branch_id'), 'delivery_persons', ['branch_id'], unique=False)

    # Create foreign key
    op.create_foreign_key(
        'fk_delivery_persons_branch_id',
        'delivery_persons', 'branches',
        ['branch_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_delivery_persons_branch_id', 'delivery_persons', type_='foreignkey')
    op.drop_index(op.f('ix_delivery_persons_branch_id'), table_name='delivery_persons')
    op.drop_column('delivery_persons', 'branch_id')
