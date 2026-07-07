import uuid
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
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


@router.patch("/projects/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.SALES_MANAGER)),
):
    result = await db.execute(select(Project).where(Project.id == project_id, Project.tenant_id == tenant_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.commit()
    await db.refresh(project)
    return project


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN)),
):
    result = await db.execute(select(Project).where(Project.id == project_id, Project.tenant_id == tenant_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    plots_result = await db.execute(select(Plot).where(Plot.project_id == project_id))
    if plots_result.scalars().first():
        raise HTTPException(status_code=400, detail="Cannot delete a project that still has plots. Remove its plots first.")

    await db.delete(project)
    await db.commit()
    return {"status": "deleted"}


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


@router.get("/{plot_id}/detail")
async def plot_detail(
    plot_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    """Full picture of one plot — its own details plus every booking,
    EMI status, and legal document tied to it. This is what 'thoroughly
    checking a plot' means for staff: one screen, not five."""
    from app.models.booking import Booking
    from app.models.customer import Customer
    from app.models.emi import EMIInstallment, Payment
    from app.models.document import LegalDocument

    plot_result = await db.execute(select(Plot).where(Plot.id == plot_id, Plot.tenant_id == tenant_id))
    plot = plot_result.scalar_one_or_none()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")

    bookings_result = await db.execute(select(Booking).where(Booking.plot_id == plot_id, Booking.tenant_id == tenant_id))
    bookings = bookings_result.scalars().all()

    booking_details = []
    for b in bookings:
        cust_result = await db.execute(select(Customer).where(Customer.id == b.customer_id))
        customer = cust_result.scalar_one_or_none()
        installments = (await db.execute(select(EMIInstallment).where(EMIInstallment.booking_id == b.id))).scalars().all()
        payments = (await db.execute(select(Payment).where(Payment.booking_id == b.id))).scalars().all()
        booking_details.append({
            "id": str(b.id),
            "status": b.status,
            "total_price": b.total_price,
            "token_advance": b.token_advance,
            "customer_name": customer.full_name if customer else None,
            "customer_phone": customer.phone if customer else None,
            "total_paid": sum(p.amount for p in payments),
            "installments_pending": sum(1 for i in installments if i.status != "paid"),
            "created_at": b.created_at,
        })

    docs_result = await db.execute(select(LegalDocument).where(LegalDocument.plot_id == plot_id, LegalDocument.tenant_id == tenant_id))
    docs = docs_result.scalars().all()

    return {
        "plot": PlotOut.model_validate(plot),
        "bookings": booking_details,
        "documents": [
            {"id": str(d.id), "document_type": d.document_type, "file_url": d.file_url, "valid_until": d.valid_until}
            for d in docs
        ],
    }

@router.post("/bulk-import")
async def bulk_import_plots(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.SALES_MANAGER)),
):
    """Bulk-add plots from a CSV — the only realistic way to load 50-500
    plots at once. Expected columns (header row required):
    plot_number, extent_sqft, price_per_sqft, facing (optional), is_corner (optional: true/false)"""
    proj_result = await db.execute(select(Project).where(Project.id == project_id, Project.tenant_id == tenant_id))
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found for this tenant")

    raw = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(raw))

    required_cols = {"plot_number", "extent_sqft", "price_per_sqft"}
    if not reader.fieldnames or not required_cols.issubset(set(c.strip() for c in reader.fieldnames)):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must have columns: {', '.join(required_cols)} (facing and is_corner are optional)",
        )

    created, errors = 0, []
    for i, row in enumerate(reader, start=2):  # row 1 is the header
        try:
            plot = Plot(
                tenant_id=tenant_id,
                project_id=project_id,
                plot_number=row["plot_number"].strip(),
                extent_sqft=float(row["extent_sqft"]),
                price_per_sqft=float(row["price_per_sqft"]),
                facing=row.get("facing", "").strip() or None,
                is_corner=str(row.get("is_corner", "")).strip().lower() in ("true", "1", "yes"),
            )
            db.add(plot)
            created += 1
        except (ValueError, KeyError) as e:
            errors.append(f"Row {i}: {e}")

    await db.commit()
    return {"created": created, "errors": errors}
