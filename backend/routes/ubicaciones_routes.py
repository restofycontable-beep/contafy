
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from config.database import get_db
from services.auth_service import get_current_user
from models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/departamentos")
async def listar_departamentos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        result = db.execute(text("""
            SELECT DISTINCT departamento, codigo_departamento
            FROM ubicaciones
            WHERE pais = 'Colombia'
            ORDER BY departamento
        """))
        
        departamentos = [
            {
                "nombre": row[0],
                "codigo": row[1]
            }
            for row in result.fetchall()
        ]
        
        return JSONResponse(content={
            "success": True,
            "data": departamentos
        })
        
    except Exception as e:
        logger.error(f"Error listando departamentos: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@router.get("/ciudades/{codigo_departamento}")
async def listar_ciudades(
    codigo_departamento: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    try:
        result = db.execute(text("""
            SELECT ciudad, codigo_ciudad, codigo_departamento
            FROM ubicaciones
            WHERE codigo_departamento = :codigo_depto
            ORDER BY ciudad
        """), {"codigo_depto": codigo_departamento})
        
        ciudades = [
            {
                "nombre": row[0],
                "codigo": row[1],
                "codigo_departamento": row[2]
            }
            for row in result.fetchall()
        ]
        
        return JSONResponse(content={
            "success": True,
            "data": ciudades
        })
        
    except Exception as e:
        logger.error(f"Error listando ciudades: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

