import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user, get_tenant_id, require_roles
from app.models.user import User, UserRole
from app.models.plot import Project, Plot, PlotStatus
from app.schemas.plot import ProjectCreate, ProjectOut, PlotCreate, PlotUpdate, PlotOut

router = APIRouter(prefix="/api/plots", tags=["plots & inventory"])


# ---------- Projects ----------

@router.post("/projects", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.SALES_MANAGER)),
):
    project = Project(tenant_id=tenant_id, **payload.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/projects", response_model=list[ProjectOut])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.tenant_id == tenant_id))
    return result.scalars().all()


# ---------- Plots ----------

@router.post("", response_model=PlotOut, status_code=status.HTTP_201_CREATED)
async def create_plot(
    payload: PlotCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.SALES_MANAGER)),
):
    # verify the project belongs to this tenant before attaching a plot to it
    proj = await db.execute(select(Project).where(Project.id == payload.project_id, Project.tenant_id == tenant_id))
    if not proj.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found for this tenant")

    plot = Plot(tenant_id=tenant_id, **payload.model_dump())
    db.add(plot)
    await db.commit()
    await db.refresh(plot)
    return plot


@router.get("", response_model=list[PlotOut])
async def list_plots(
    project_id: uuid.UUID | None = None,
    status_filter: PlotStatus | None = None,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    query = select(Plot).where(Plot.tenant_id == tenant_id)
    if project_id:
        query = query.where(Plot.project_id == project_id)
    if status_filter:
        query = query.where(Plot.status == status_filter)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{plot_id}", response_model=PlotOut)
async def update_plot(
    plot_id: uuid.UUID,
    payload: PlotUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.SALES_MANAGER)),
):
    result = await db.execute(select(Plot).where(Plot.id == plot_id, Plot.tenant_id == tenant_id))
    plot = result.scalar_one_or_none()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(plot, field, value)

    await db.commit()
    await db.refresh(plot)
    return plot
