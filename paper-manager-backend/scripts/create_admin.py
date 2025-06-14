#!/usr/bin/env python3
"""
Admin User Management Script
Command-line tool for creating or resetting admin user accounts
"""

import os
import sys
import asyncio
import secrets
from getpass import getpass
from pathlib import Path
from typing import Optional, Dict, Any
from sqlmodel import Session, select
import argparse
from colorama import init, Fore, Back, Style

# Add project root directory to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Initialize colorama for Windows
init(autoreset=True)

from app.core.database import init_db, engine
from app.models.user import User
from app.services.utils import get_password_hash


def create_admin_user_sync(
    username: str = "admin",
    email: str = "admin@paperManager.com",
    full_name: str = "System Administrator",
    password: Optional[str] = None,
    force_reset: bool = False,
) -> Dict[str, Any]:
    """
    Synchronously create admin user (for use by other modules)

    Args:
        username: Username
        email: Email address
        full_name: Full name
        password: Password, if None a random password will be generated
        force_reset: Whether to force reset existing user

    Returns:
        Dictionary containing operation result
    """
    # Ensure database is initialized
    init_db()

    result = {
        "success": False,
        "message": "",
        "user_info": None,
        "generated_password": None,
    }

    # Generate random password if none provided
    if not password:
        password = secrets.token_urlsafe(16)
        result["generated_password"] = password

    try:
        with Session(engine) as session:
            # Check if user with same username or email already exists
            existing_user = session.exec(
                select(User).where((User.username == username) | (User.email == email))
            ).first()

            if existing_user:
                if force_reset:
                    # Reset existing user
                    existing_user.hashed_password = get_password_hash(password)
                    existing_user.is_superuser = True
                    existing_user.is_active = True
                    existing_user.full_name = full_name
                    session.add(existing_user)
                    session.commit()

                    result["success"] = True
                    result["message"] = f"Admin user '{username}' has been reset"
                    result["user_info"] = {
                        "id": existing_user.id,
                        "username": existing_user.username,
                        "email": existing_user.email,
                        "full_name": existing_user.full_name,
                    }
                    return result
                else:
                    result["message"] = (
                        f"Username '{username}' or email '{email}' already exists"
                    )
                    return result

            # Create new admin user
            admin_user = User(
                username=username,
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash(password),
                is_active=True,
                is_superuser=True,
            )

            session.add(admin_user)
            session.commit()
            session.refresh(admin_user)

            result["success"] = True
            result["message"] = f"Admin user '{username}' created successfully"
            result["user_info"] = {
                "id": admin_user.id,
                "username": admin_user.username,
                "email": admin_user.email,
                "full_name": admin_user.full_name,
            }

    except Exception as e:
        result["message"] = f"Failed to create admin user: {e}"

    return result


async def create_admin_user(interactive=True):
    """
    Create admin user

    Args:
        interactive: Whether to use interactive mode
    """
    print(f"{Fore.CYAN}Initializing database...{Style.RESET_ALL}")
    init_db()

    with Session(engine) as session:
        if interactive:
            print(f"\n{Fore.YELLOW}Please enter admin information:{Style.RESET_ALL}")
            username = input("Username (default: admin): ").strip() or "admin"
            email = (
                input("Email (default: admin@paperManager.com): ").strip()
                or "admin@paperManager.com"
            )
            full_name = (
                input("Full name (default: System Administrator): ").strip()
                or "System Administrator"
            )

            # Secure password input
            while True:
                password = getpass("Password: ").strip()
                if len(password) >= 6:
                    confirm_password = getpass("Confirm password: ").strip()
                    if password == confirm_password:
                        break
                    else:
                        print(
                            f"{Fore.RED}Passwords do not match. Please try again.{Style.RESET_ALL}"
                        )
                else:
                    print(
                        f"{Fore.RED}Password must be at least 6 characters. Please try again.{Style.RESET_ALL}"
                    )
        else:
            # Non-interactive mode, use environment variables or defaults
            username = os.getenv("ADMIN_USERNAME", "admin")
            email = os.getenv("ADMIN_EMAIL", "admin@paperManager.com")
            full_name = "System Administrator"
            password = os.getenv("ADMIN_PASSWORD")

            if not password:
                password = secrets.token_urlsafe(16)
                print(
                    f"{Fore.YELLOW}Generated random password: {password}{Style.RESET_ALL}"
                )

        # Check if user with same username or email already exists
        existing_user = session.exec(
            select(User).where((User.username == username) | (User.email == email))
        ).first()

        if existing_user:
            if existing_user.username == username:
                print(
                    f"{Fore.RED}Username '{username}' already exists{Style.RESET_ALL}"
                )
            if existing_user.email == email:
                print(f"{Fore.RED}Email '{email}' already exists{Style.RESET_ALL}")

            if interactive:
                choice = (
                    input("Do you want to reset the existing user's password? (y/N): ")
                    .strip()
                    .lower()
                )
                if choice == "y":
                    existing_user.hashed_password = get_password_hash(password)
                    existing_user.is_superuser = True
                    existing_user.is_active = True
                    session.commit()
                    print(f"{Fore.GREEN}User password has been reset{Style.RESET_ALL}")
                else:
                    print(f"{Fore.YELLOW}Operation cancelled{Style.RESET_ALL}")
                return
            else:
                print(
                    f"{Fore.YELLOW}User already exists, skipping creation{Style.RESET_ALL}"
                )
                return

        # Create new admin user
        try:
            admin_user = User(
                username=username,
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash(password),
                is_active=True,
                is_superuser=True,
            )

            session.add(admin_user)
            session.commit()
            session.refresh(admin_user)

            print(f"\n{Fore.GREEN}Admin user created successfully!{Style.RESET_ALL}")
            print(f"{Fore.CYAN}" + "=" * 50 + f"{Style.RESET_ALL}")
            print(f"{Fore.BLUE}User ID: {admin_user.id}{Style.RESET_ALL}")
            print(f"{Fore.BLUE}Username: {username}{Style.RESET_ALL}")
            print(f"{Fore.BLUE}Email: {email}{Style.RESET_ALL}")
            print(f"{Fore.BLUE}Full name: {full_name}{Style.RESET_ALL}")
            if not interactive:
                print(f"{Fore.MAGENTA}Password: {password}{Style.RESET_ALL}")
            print(f"{Fore.CYAN}" + "=" * 50 + f"{Style.RESET_ALL}")
            print(
                f"{Fore.YELLOW}Please keep the login credentials secure!{Style.RESET_ALL}"
            )

        except Exception as e:
            session.rollback()
            print(f"{Fore.RED}Failed to create admin user: {e}{Style.RESET_ALL}")


async def list_admin_users():
    """List all admin users"""
    print(f"{Fore.CYAN}Initializing database...{Style.RESET_ALL}")
    init_db()

    with Session(engine) as session:
        admin_users = session.exec(select(User).where(User.is_superuser == True)).all()

        if not admin_users:
            print(f"{Fore.YELLOW}No admin users found{Style.RESET_ALL}")
            return

        print(f"\n{Fore.MAGENTA}Admin User List:{Style.RESET_ALL}")
        print(f"{Fore.CYAN}" + "=" * 80 + f"{Style.RESET_ALL}")
        for user in admin_users:
            status = (
                f"{Fore.GREEN}Active{Style.RESET_ALL}"
                if user.is_active
                else f"{Fore.RED}Disabled{Style.RESET_ALL}"
            )
            print(
                f"{Fore.BLUE}ID: {user.id:3d}{Style.RESET_ALL} | "
                f"{Fore.BLUE}Username: {user.username:15s}{Style.RESET_ALL} | "
                f"{Fore.BLUE}Email: {user.email:25s}{Style.RESET_ALL} | "
                f"Status: {status}"
            )
        print(f"{Fore.CYAN}" + "=" * 80 + f"{Style.RESET_ALL}")


async def create_admin_user_cli(username, email, full_name, password, force_reset):
    """
    Command-line interface for creating or resetting an admin user.
    Prints results to console.
    """
    print(
        f"{Fore.CYAN}Attempting to create/reset admin: {username}...{Style.RESET_ALL}"
    )
    result = create_admin_user_sync(
        username=username,
        email=email,
        full_name=full_name,
        password=password,
        force_reset=force_reset,
    )

    if result["success"]:
        print(f"{Fore.GREEN}{result['message']}{Style.RESET_ALL}")
        if result.get("user_info"):
            print(f"{Fore.YELLOW}User Details:{Style.RESET_ALL}")
            for key, value in result["user_info"].items():
                print(f"  {Fore.BLUE}{key.capitalize()}: {value}{Style.RESET_ALL}")
        if result.get("generated_password"):
            print(
                f"{Fore.MAGENTA}Generated Password: {result['generated_password']}{Style.RESET_ALL}"
            )
            print(
                f"{Fore.YELLOW}Please store this password securely and change it after first login.{Style.RESET_ALL}"
            )
    else:
        print(f"{Fore.RED}{result['message']}{Style.RESET_ALL}")


async def list_admin_users_cli():
    """
    Command-line interface for listing admin users.
    Prints results to console.
    """
    print(f"{Fore.CYAN}Initializing database for listing admins...{Style.RESET_ALL}")
    init_db()

    with Session(engine) as session:
        admin_users = session.exec(select(User).where(User.is_superuser == True)).all()

        if not admin_users:
            print(f"{Fore.YELLOW}No admin users found.{Style.RESET_ALL}")
            return

        print(f"\n{Fore.MAGENTA}Admin User List:{Style.RESET_ALL}")
        print(f"{Fore.CYAN}" + "=" * 80 + f"{Style.RESET_ALL}")
        print(
            f"{Fore.BLUE}{'ID':<5} | {'Username':<20} | {'Email':<30} | {'Full Name':<20} | {'Status':<10}{Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}" + "-" * 80 + f"{Style.RESET_ALL}")
        for user in admin_users:
            status = (
                f"{Fore.GREEN}Active{Style.RESET_ALL}"
                if user.is_active
                else f"{Fore.RED}Disabled{Style.RESET_ALL}"
            )
            print(
                f"{Fore.BLUE}{user.id:<5} | {user.username:<20} | {user.email:<30} | {user.full_name:<20}{Style.RESET_ALL} | {status:<10}"
            )
        print(f"{Fore.CYAN}" + "=" * 80 + f"{Style.RESET_ALL}")


async def main_cli():
    """Main function for command-line execution"""
    parser = argparse.ArgumentParser(description="Admin User Management Script")

    subparsers = parser.add_subparsers(
        dest="command", help="Available commands", required=True
    )

    # Create command
    create_parser = subparsers.add_parser(
        "create", help="Create or reset an admin user"
    )
    create_parser.add_argument(
        "--username",
        default=os.getenv("ADMIN_USERNAME", "admin"),
        help="Admin username (default: admin or ADMIN_USERNAME env var)",
    )
    create_parser.add_argument(
        "--email",
        default=os.getenv("ADMIN_EMAIL", "admin@paperManager.com"),
        help="Admin email (default: admin@paperManager.com or ADMIN_EMAIL env var)",
    )
    create_parser.add_argument(
        "--full-name",
        default="System Administrator",
        help="Admin full name (default: System Administrator)",
    )
    create_parser.add_argument(
        "--password",
        default=os.getenv("ADMIN_PASSWORD"),
        help="Admin password (default: random or ADMIN_PASSWORD env var)",
    )
    create_parser.add_argument(
        "--force-reset", action="store_true", help="Force reset if user already exists"
    )

    # List command
    list_parser = subparsers.add_parser("list", help="List all admin users")

    args = parser.parse_args()

    if args.command == "create":
        # If password is not provided via CLI or ENV, generate one for CLI creation
        password_to_use = args.password
        generated_cli_password = False
        if not password_to_use:
            password_to_use = secrets.token_urlsafe(16)
            generated_cli_password = True
            print(
                f"{Fore.MAGENTA}No password provided, generated a random one for this operation: {password_to_use}{Style.RESET_ALL}"
            )

        await create_admin_user_cli(
            username=args.username,
            email=args.email,
            full_name=args.full_name,
            password=password_to_use,
            force_reset=args.force_reset,
        )
    elif args.command == "list":
        await list_admin_users_cli()


if __name__ == "__main__":
    try:
        asyncio.run(main_cli())
    except KeyboardInterrupt:
        print(f"\n\n{Fore.YELLOW}Operation cancelled by user.{Style.RESET_ALL}")
    except Exception as e:
        print(f"\n{Fore.RED}An error occurred: {e}{Style.RESET_ALL}")
        sys.exit(1)
