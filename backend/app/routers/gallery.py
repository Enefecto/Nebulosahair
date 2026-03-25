from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.dependencies import get_supabase_admin as get_supabase, get_current_user
from app.models.schemas import GalleryItemCreate, GalleryItemUpdate
from app.services.s3 import delete_image_from_url

router = APIRouter()


@router.get("/")
def list_gallery(
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    res = supabase.table("gallery").select("*").order("sort_order").execute()
    return res.data


@router.post("/")
def create_gallery_item(
    payload: GalleryItemCreate,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    data = payload.model_dump()
    if data.get("service_id"):
        data["service_id"] = str(data["service_id"])
    res = supabase.table("gallery").insert(data).execute()
    return res.data[0]


@router.put("/{item_id}")
def update_gallery_item(
    item_id: str,
    payload: GalleryItemUpdate,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    data = payload.model_dump(exclude_unset=True)
    if "service_id" in data and data["service_id"]:
        data["service_id"] = str(data["service_id"])
    res = supabase.table("gallery").update(data).eq("id", item_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    return res.data[0]


@router.delete("/{item_id}")
def delete_gallery_item(
    item_id: str,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    item = supabase.table("gallery").select("image_url").eq("id", item_id).single().execute()
    if item.data and item.data.get("image_url"):
        delete_image_from_url(item.data["image_url"])
    supabase.table("gallery").delete().eq("id", item_id).execute()
    return {"message": "Imagen eliminada."}
