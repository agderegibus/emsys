from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.auth import get_current_user, require_admin
from app.models.branch import Branch
from app.models.user import User
from app.models.user_branch import UserBranch
from app.models.sale import Sale
from app.schemas.branch import BranchCreate, BranchUpdate, BranchOut, BranchWithStats


router = APIRouter(prefix="/branches", tags=["Branches"])


@router.get("/", response_model=list[BranchOut])
async def list_branches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all branches.
    Admin sees all branches, non-admin sees only assigned branches.
    """
    if current_user.role == "admin":
        branches = db.query(Branch).order_by(Branch.name).all()
    else:
        branches = current_user.branches

    return branches


@router.get("/with-stats", response_model=list[BranchWithStats])
async def list_branches_with_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List all branches with statistics (admin only).
    """
    branches = db.query(Branch).order_by(Branch.name).all()
    result = []

    for branch in branches:
        # Count users assigned to this branch
        user_count = db.query(UserBranch).filter(UserBranch.branch_id == branch.id).count()

        # Count sales and total
        sales_stats = db.query(
            func.count(Sale.id).label("sale_count"),
            func.coalesce(func.sum(Sale.total_ars), 0).label("total_sales_ars")
        ).filter(Sale.branch_id == branch.id).first()

        result.append(BranchWithStats(
            id=branch.id,
            name=branch.name,
            code=branch.code,
            address=branch.address,
            phone=branch.phone,
            is_active=branch.is_active,
            created_at=branch.created_at,
            user_count=user_count,
            sale_count=sales_stats.sale_count or 0,
            total_sales_ars=sales_stats.total_sales_ars or 0
        ))

    return result


@router.get("/{branch_id}", response_model=BranchOut)
async def get_branch(
    branch_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get branch by ID.
    """
    branch = db.query(Branch).filter(Branch.id == branch_id).first()

    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )

    # Check access for non-admin users
    if current_user.role != "admin":
        user_branch_ids = [b.id for b in current_user.branches]
        if branch_id not in user_branch_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this branch"
            )

    return branch


@router.post("/", response_model=BranchOut, status_code=status.HTTP_201_CREATED)
async def create_branch(
    branch_data: BranchCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new branch (admin only).
    """
    # Check for duplicate name or code
    existing = db.query(Branch).filter(
        (Branch.name == branch_data.name) | (Branch.code == branch_data.code)
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Branch with this name or code already exists"
        )

    branch = Branch(**branch_data.model_dump())
    db.add(branch)
    db.commit()
    db.refresh(branch)

    return branch


@router.put("/{branch_id}", response_model=BranchOut)
async def update_branch(
    branch_id: int,
    branch_data: BranchUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update a branch (admin only).
    """
    branch = db.query(Branch).filter(Branch.id == branch_id).first()

    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )

    # Check for duplicate name or code if changing
    if branch_data.name and branch_data.name != branch.name:
        existing = db.query(Branch).filter(Branch.name == branch_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Branch with this name already exists"
            )

    if branch_data.code and branch_data.code != branch.code:
        existing = db.query(Branch).filter(Branch.code == branch_data.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Branch with this code already exists"
            )

    # Update fields
    update_data = branch_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(branch, field, value)

    db.commit()
    db.refresh(branch)

    return branch


@router.delete("/{branch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_branch(
    branch_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a branch (admin only).
    """
    branch = db.query(Branch).filter(Branch.id == branch_id).first()

    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )

    db.delete(branch)
    db.commit()
