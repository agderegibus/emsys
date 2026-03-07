from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr


class BranchSimple(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Literal["admin", "cajero"] = "cajero"
    branch_ids: list[int] = []
    default_branch_id: int | None = None


class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    role: Literal["admin", "cajero"] | None = None
    is_active: bool | None = None
    branch_ids: list[int] | None = None
    default_branch_id: int | None = None


class UserRead(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime | None = None
    branches: list[BranchSimple] = []

    class Config:
        from_attributes = True


class UserWithPassword(UserRead):
    has_password: bool = False
