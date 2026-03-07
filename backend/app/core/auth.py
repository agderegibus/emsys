from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: int | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )

    return user


async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Require the current user to be an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_branch_context(
    x_branch_id: int | None = Header(None, alias="X-Branch-ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> int | None:
    """
    Get the branch context from the X-Branch-ID header.
    Validates that the user has access to the requested branch.
    Returns None if no branch is specified (admin can see all).
    """
    if x_branch_id is None:
        # Admin can operate without specifying a branch (sees all)
        if current_user.role == "admin":
            return None
        # Non-admin must have at least one branch assigned
        if not current_user.branches:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No branch assigned to user"
            )
        # Return the default branch or the first one
        for ub in current_user.user_branches:
            if ub.is_default:
                return ub.branch_id
        return current_user.branches[0].id

    # Validate user has access to the requested branch
    if current_user.role == "admin":
        # Admin can access any branch
        from app.models.branch import Branch
        branch = db.query(Branch).filter(Branch.id == x_branch_id).first()
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branch not found"
            )
        return x_branch_id

    # Non-admin: check if branch is in user's assigned branches
    user_branch_ids = [b.id for b in current_user.branches]
    if x_branch_id not in user_branch_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this branch"
        )

    return x_branch_id


async def get_optional_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User | None:
    """Get the current user if authenticated, otherwise return None."""
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        if payload is None:
            return None
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        return None
