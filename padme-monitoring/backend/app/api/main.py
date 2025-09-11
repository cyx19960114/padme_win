from fastapi import APIRouter, Depends

from app.api.routes import auth, job, station, train


api_router = APIRouter()
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["auth"],
)
api_router.include_router(
    train.router,
    prefix="/trains",
    tags=["trains"],
    dependencies=[Depends(auth.get_user_info)],
)
api_router.include_router(
    station.router,
    prefix="/stations",
    tags=["stations"],
    dependencies=[Depends(auth.get_user_info)],
)
api_router.include_router(
    job.router,
    prefix="/jobs",
    tags=["jobs"],
)
