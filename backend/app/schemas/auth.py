from pydantic import BaseModel
from typing import Literal


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class BranchSimple(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True


class UserMeResponse(BaseModel):
    id: int
    username: str
    email: str
    role: Literal["admin", "cajero"]
    is_active: bool
    branches: list[BranchSimple] = []

    class Config:
        from_attributes = True
