from fastapi import APIRouter
from .user import router as user_router
from .paper import router as paper_router
from .category import router as category_router
from .team import router as team_router
from .reference import router as reference_router
from .reference_category import router as reference_category_router

api_router = APIRouter()

# User routes
api_router.include_router(user_router, prefix="/users", tags=["users"])

# Paper routes
api_router.include_router(paper_router, prefix="/papers", tags=["papers"])

# Category routes
api_router.include_router(category_router, prefix="/categories", tags=["categories"])

# Team routes
api_router.include_router(team_router, prefix="/teams", tags=["teams"])

# Reference routes
api_router.include_router(reference_router, prefix="/references", tags=["references"])

# Reference Category routes
api_router.include_router(
    reference_category_router,
    prefix="/reference-categories",
    tags=["reference-categories"]
) 