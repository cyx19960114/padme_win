from contextlib import asynccontextmanager

from fastapi import FastAPI
from rdflib_sqlalchemy import registerplugins
from starlette.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import graph_singleton
from app.api.main import api_router
from app.api.routes.job import close_active_sse_connections


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Register SQLAlchemy plugins first time application is started
    registerplugins()
    yield
    # Add cleanup functions here before application shutdown
    await close_active_sse_connections()
    graph_singleton.close_graph()


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)


@app.get("/healthy")
async def health_check():
    return {"status": "healthy"}


if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include all API routes
app.include_router(api_router)
