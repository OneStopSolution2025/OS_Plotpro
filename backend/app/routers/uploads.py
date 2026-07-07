import uuid
import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user, get_tenant_id, require_roles
from app.models.user import User, UserRole
from app.models.plot import Project, Plot
from app.models.document import LegalDocument, DocumentType

router = APIRouter(prefix="/api/uploads", tags=["file uploads"])

# NOTE: this stores files on local disk under /uploads — fine for a single
# Railway instance during MVP, but Railway's filesystem is ephemeral on
# redeploys. For production, swap _save_file() below for a GCS/S3 upload
# (you already have working GCS credentials from RapidReportz — bucket
# ocrfile_store, project wise-philosophy-473112-v8 — reuse that pattern).
UPLOAD_DIR = "uploads"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_DOC_TYPES = {"application/pdf", "image/jpeg", "image/png"}


def _save_file(upload: UploadFile, subfolder: str) -> str:
    folder = os.path.join(UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)
    ext = os.path.splitext(upload.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(folder, filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(upload.file, f)
    return f"/{path}"  # served via a static mount in main.py


@router.post("/project-layout/{project_id}")
async def upload_project_layout(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.SALES_MANAGER)),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Layout image must be JPEG, PNG, or WebP")

    result = await db.execute(select(Project).where(Project.id == project_id, Project.tenant_id == tenant_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    url = _save_file(file, f"layouts/{tenant_id}")
    project.layout_image_url = url
    await db.commit()
    return {"layout_image_url": url}


@router.post("/legal-document")
async def upload_legal_document(
    document_type: DocumentType,
    project_id: uuid.UUID | None = None,
    plot_id: uuid.UUID | None = None,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.ACCOUNTANT)),
):
    if file.content_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=400, detail="Document must be PDF, JPEG, or PNG")

    url = _save_file(file, f"documents/{tenant_id}")
    doc = LegalDocument(
        tenant_id=tenant_id,
        project_id=project_id,
        plot_id=plot_id,
        document_type=document_type,
        file_url=url,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return {"id": str(doc.id), "file_url": url}


@router.get("/legal-documents")
async def list_legal_documents(
    project_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    query = select(LegalDocument).where(LegalDocument.tenant_id == tenant_id)
    if project_id:
        query = query.where(LegalDocument.project_id == project_id)
    result = await db.execute(query)
    docs = result.scalars().all()
    return [
        {
            "id": str(d.id),
            "document_type": d.document_type,
            "file_url": d.file_url,
            "valid_until": d.valid_until,
        }
        for d in docs
    ]


@router.delete("/legal-document/{document_id}")
async def delete_legal_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.ACCOUNTANT)),
):
    result = await db.execute(select(LegalDocument).where(LegalDocument.id == document_id, LegalDocument.tenant_id == tenant_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await db.delete(doc)
    await db.commit()
    return {"status": "deleted"}


@router.post("/plot-image/{plot_id}")
async def upload_plot_image(
    plot_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.SALES_MANAGER)),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Image must be JPEG, PNG, or WebP")

    result = await db.execute(select(Plot).where(Plot.id == plot_id, Plot.tenant_id == tenant_id))
    plot = result.scalar_one_or_none()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")

    url = _save_file(file, f"plot-images/{tenant_id}")
    plot.image_url = url
    await db.commit()
    return {"image_url": url}
