from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
import os
import secrets
from sqlmodel import Session, select
from colorama import init, Fore, Style
from app.core.database import init_db, engine
from app.api import api_router
from app.models.user import User
from app.services.utils import get_password_hash
from scripts.create_admin import create_admin_user_sync

# Initialize colorama for Windows
init(autoreset=True)

app = FastAPI(
    title="Paper Manager API",
    description="API for managing academic papers and their authors",
    version="1.0.0",
    docs_url=None,  # Disable default docs URL
)

# Configure static files directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Configure media files directory for file preview
from app.core.config_dev import config

media_dir = str(config.uploads)
app.mount("/media", StaticFiles(directory=media_dir), name="media")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes
app.include_router(api_router, prefix="/api")


# Custom documentation page
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url or "/openapi.json",
        title=app.title + " - API Documentation",
        swagger_favicon_url="/static/favicon.ico",
    )


@app.on_event("startup")
async def startup_event():
    init_db()

    # Create default admin user
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_email = os.getenv("ADMIN_EMAIL", "admin@paperManager.com")
    admin_password = os.getenv("ADMIN_PASSWORD")
    full_name = "System Administrator"
    force_reset = os.getenv("ADMIN_FORCE_RESET", "False").lower() == "true"

    # Check if admin already exists to avoid unnecessary calls or password generation if not needed
    with Session(engine) as session:
        existing_admin = session.exec(
            select(User).where(User.is_superuser == True)
        ).first()
        if existing_admin and not force_reset:
            print(
                f"{Fore.GREEN}Admin user '{existing_admin.username}' already exists. Skipping creation.{Style.RESET_ALL}"
            )
            return
        elif existing_admin and force_reset:
            print(
                f"{Fore.BLUE}Admin user '{existing_admin.username}' exists. Force reset is enabled.{Style.RESET_ALL}"
            )
        else:
            print(
                f"{Fore.BLUE}No admin user found or force reset is not specified. Proceeding with creation/reset logic.{Style.RESET_ALL}"
            )

    generated_password = None
    if not admin_password:
        admin_password = secrets.token_urlsafe(16)
        generated_password = admin_password
        print(
            f"{Fore.YELLOW}ADMIN_PASSWORD environment variable not set. A random password will be generated.{Style.RESET_ALL}"
        )

    result = create_admin_user_sync(
        username=admin_username,
        email=admin_email,
        full_name=full_name,
        password=admin_password,
        force_reset=force_reset,
    )

    if result["success"]:
        print(f"{Fore.GREEN}{result['message']}{Style.RESET_ALL}")
        if result.get("user_info"):
            print(f"{Fore.CYAN}Admin User Details:{Style.RESET_ALL}")
            print(
                f"  {Fore.BLUE}Username: {result['user_info']['username']}{Style.RESET_ALL}"
            )
            print(
                f"  {Fore.BLUE}Email: {result['user_info']['email']}{Style.RESET_ALL}"
            )
        if result.get("generated_password"):
            print(
                f"{Fore.MAGENTA}Generated Password: {result['generated_password']}{Style.RESET_ALL}"
            )
            print(
                f"{Fore.YELLOW}Please store this password securely. If this is the first setup, consider changing it.{Style.RESET_ALL}"
            )
        elif generated_password:
            print(
                f"{Fore.MAGENTA}Generated Password during startup: {generated_password}{Style.RESET_ALL}"
            )
            print(
                f"{Fore.YELLOW}Please store this password securely. If this is the first setup, consider changing it.{Style.RESET_ALL}"
            )
        else:
            print(
                f"{Fore.BLUE}Password for admin '{admin_username}' was taken from ADMIN_PASSWORD environment variable.{Style.RESET_ALL}"
            )
        print(f"{Fore.CYAN}" + "=" * 50 + f"{Style.RESET_ALL}")
        if not os.getenv("ADMIN_PASSWORD") and not force_reset:
            print(
                f"{Fore.YELLOW}For security, set the ADMIN_PASSWORD environment variable for production.{Style.RESET_ALL}"
            )
        if force_reset:
            print(
                f"{Fore.BLUE}Admin user was reset as per ADMIN_FORCE_RESET=true.{Style.RESET_ALL}"
            )
    else:
        print(
            f"{Fore.RED}Failed to create/reset admin user: {result['message']}{Style.RESET_ALL}"
        )


@app.get("/")
async def root():
    return {"message": "Welcome to Paper Manager API"}
