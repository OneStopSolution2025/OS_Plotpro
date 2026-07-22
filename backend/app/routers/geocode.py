"""
Address → coordinates lookup, proxied through the backend (browsers can't
set the User-Agent header Nominatim's usage policy requires, so this can't
be called directly from the frontend). Free, no API key — OpenStreetMap's
Nominatim service. Rate-limited to reasonable interactive use only.
"""
import httpx
from fastapi import APIRouter, Depends, HTTPException
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/geocode", tags=["geocoding"])

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


@router.get("")
async def geocode_address(
    q: str,
    _user: User = Depends(get_current_user),
):
    """Looks up an address/place name and returns the best-match coordinates.
    Staff type a real address ('123 Anna Nagar, Dindigul') instead of hunting
    for GPS numbers themselves."""
    if not q or len(q.strip()) < 3:
        raise HTTPException(status_code=400, detail="Enter at least 3 characters to search")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            NOMINATIM_URL,
            params={"q": q, "format": "json", "limit": 5},
            headers={"User-Agent": "OS2-PlotPro/1.0 (contact: design@os2studio.com)"},
            timeout=10.0,
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Location search is temporarily unavailable")

    results = response.json()
    return [
        {
            "display_name": r["display_name"],
            "latitude": float(r["lat"]),
            "longitude": float(r["lon"]),
        }
        for r in results
    ]
