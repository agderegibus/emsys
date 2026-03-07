#!/usr/bin/env python3
"""
Script to create the initial admin user.
Run this after applying all migrations.

Usage:
    cd backend
    python setup_initial_admin.py
"""

import sys
sys.path.insert(0, '.')

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.branch import Branch
from app.models.user_branch import UserBranch


def setup_initial_admin():
    db = SessionLocal()

    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.username == settings.FIRST_ADMIN_USERNAME).first()
        if existing_admin:
            print(f"Admin user '{settings.FIRST_ADMIN_USERNAME}' already exists.")

            # Update password if needed
            if not existing_admin.password_hash:
                existing_admin.password_hash = get_password_hash(settings.FIRST_ADMIN_PASSWORD)
                existing_admin.role = "admin"
                db.commit()
                print(f"Updated admin user with password and role.")

            return

        # Create admin user
        password_hash = get_password_hash(settings.FIRST_ADMIN_PASSWORD)
        admin = User(
            username=settings.FIRST_ADMIN_USERNAME,
            email=settings.FIRST_ADMIN_EMAIL,
            password_hash=password_hash,
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.flush()

        # Assign admin to all branches
        branches = db.query(Branch).all()
        for i, branch in enumerate(branches):
            user_branch = UserBranch(
                user_id=admin.id,
                branch_id=branch.id,
                is_default=(i == 0)  # First branch is default
            )
            db.add(user_branch)

        db.commit()

        print(f"Admin user created successfully!")
        print(f"  Username: {settings.FIRST_ADMIN_USERNAME}")
        print(f"  Email: {settings.FIRST_ADMIN_EMAIL}")
        print(f"  Password: {settings.FIRST_ADMIN_PASSWORD}")
        print(f"  Role: admin")
        print(f"  Branches: {', '.join([b.name for b in branches])}")

    except Exception as e:
        db.rollback()
        print(f"Error creating admin: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    setup_initial_admin()
