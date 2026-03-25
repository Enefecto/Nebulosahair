from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import Literal

from app.dependencies import get_current_user
from app.services.s3 import upload_image, delete_image_from_url

router = APIRouter()


@router.post("/image")
async def upload_img(
    file: UploadFile = File(...),
    folder: Literal["logo", "services", "gallery"] = Form(...),
    name: str = Form(...),
    _=Depends(get_current_user),
):
    contents = await file.read()
    url = upload_image(contents, folder, name, file.content_type or "image/jpeg")
    return {"url": url}


@router.delete("/image")
def delete_img(
    image_url: str,
    _=Depends(get_current_user),
):
    deleted = delete_image_from_url(image_url)
    if not deleted:
        raise HTTPException(status_code=404, detail="Imagen no encontrada en S3")
    return {"message": "Imagen eliminada."}
