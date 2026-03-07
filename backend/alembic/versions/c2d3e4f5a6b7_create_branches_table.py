"""create branches table

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2026-03-07 00:01:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c2d3e4f5a6b7'
down_revision = 'b1c2d3e4f5a6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create branches table
    op.create_table(
        'branches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=10), nullable=False),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_branches_id'), 'branches', ['id'], unique=False)

    # Insert initial branches
    op.execute("""
        INSERT INTO branches (name, code, address, phone) VALUES
        ('Pergamino', 'PER', 'Av. San Martin 1234, Pergamino, Buenos Aires', '2477-123456'),
        ('Lagos', 'LAG', 'Calle Principal 567, Carlos Casares, Buenos Aires', '2395-789012'),
        ('Mendoza', 'MZA', 'Av. San Juan 890, Ciudad de Mendoza, Mendoza', '261-345678')
    """)


def downgrade() -> None:
    op.drop_index(op.f('ix_branches_id'), table_name='branches')
    op.drop_table('branches')
