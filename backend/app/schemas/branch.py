from datetime import datetime
from pydantic import BaseModel


class BranchCreate(BaseModel):
    name: str
    code: str
    address: str | None = None
    phone: str | None = None
    is_active: bool = True


class BranchUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    address: str | None = None
    phone: str | None = None
    is_active: bool | None = None


class BranchOut(BaseModel):
    id: int
    name: str
    code: str
    address: str | None
    phone: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class BranchWithStats(BranchOut):
    user_count: int = 0
    sale_count: int = 0
    total_sales_ars: int = 0


class UserBranchAssignment(BaseModel):
    user_id: int
    branch_ids: list[int]
    default_branch_id: int | None = None
