"""add is_admin to users

Revision ID: 0d0c9b8db93b
Revises: f03e723a8148
Create Date: 2026-07-06 15:25:40.635566

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0d0c9b8db93b'
down_revision: Union[str, Sequence[str], None] = 'f03e723a8148'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false())
        )

def downgrade():
    op.drop_column("users", "is_admin")