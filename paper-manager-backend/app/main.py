from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import init_db
from app.api import user, paper, category, team, reference

app = FastAPI(
    title="Paper Manager API",
    description="API for managing academic papers and their authors",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user.router, prefix="/api/users", tags=["users"])
app.include_router(paper.router, prefix="/api/papers", tags=["papers"])
app.include_router(category.router, prefix="/api/categories", tags=["categories"])
app.include_router(team.router, prefix="/api/teams", tags=["teams"])
app.include_router(reference.router, prefix="/api/references", tags=["references"])


@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/")
async def root():
    return {"message": "Welcome to Paper Manager API"}