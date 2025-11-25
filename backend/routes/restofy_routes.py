"""
Rutas para la integración con la API de Restofy
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
from models.user import User
from services.auth_service import get_current_user
from config.database import get_db
from services.restofy_service import RestofyService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/{empresa_id}/productos")
async def obtener_productos(
    empresa_id: int,
    page: int = Query(1, ge=1, description="Número de página"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene el listado de productos de Restofy
    """
    try:
        service = RestofyService(db)
        result = service.obtener_productos(empresa_id, current_user.id, page)
        
        if result.get('success'):
            return JSONResponse(
                content={
                    'success': True,
                    'data': result.get('data'),
                    'page': page
                }
            )
        else:
            status_code = 400 if not result.get('tiene_restofy', True) else result.get('status_code', 500)
            return JSONResponse(
                status_code=status_code,
                content={
                    'success': False,
                    'error': result.get('error', 'Error desconocido'),
                    'tiene_restofy': result.get('tiene_restofy', False)
                }
            )
    except Exception as e:
        logger.error(f"Error obteniendo productos: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Error obteniendo productos: {str(e)}'
            }
        )


@router.get("/{empresa_id}/categorias")
async def obtener_categorias(
    empresa_id: int,
    page: int = Query(1, ge=1, description="Número de página"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene el listado de categorías de Restofy
    """
    try:
        service = RestofyService(db)
        result = service.obtener_categorias(empresa_id, current_user.id, page)
        
        if result.get('success'):
            return JSONResponse(
                content={
                    'success': True,
                    'data': result.get('data'),
                    'page': page
                }
            )
        else:
            status_code = 400 if not result.get('tiene_restofy', True) else result.get('status_code', 500)
            return JSONResponse(
                status_code=status_code,
                content={
                    'success': False,
                    'error': result.get('error', 'Error desconocido'),
                    'tiene_restofy': result.get('tiene_restofy', False)
                }
            )
    except Exception as e:
        logger.error(f"Error obteniendo categorías: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Error obteniendo categorías: {str(e)}'
            }
        )


@router.get("/{empresa_id}/facturas-electronicas")
async def obtener_facturas_electronicas(
    empresa_id: int,
    page: int = Query(1, ge=1, description="Número de página"),
    start_date: Optional[str] = Query(None, description="Fecha de inicio (formato: YYYY-MM-DD HH:MM:SS)"),
    end_date: Optional[str] = Query(None, description="Fecha de fin (formato: YYYY-MM-DD HH:MM:SS)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene el listado de facturas electrónicas generadas
    """
    try:
        service = RestofyService(db)
        result = service.obtener_facturas_electronicas(
            empresa_id, 
            current_user.id, 
            page, 
            start_date, 
            end_date
        )
        
        if result.get('success'):
            return JSONResponse(
                content={
                    'success': True,
                    'data': result.get('data'),
                    'page': page,
                    'start_date': start_date,
                    'end_date': end_date
                }
            )
        else:
            status_code = 400 if not result.get('tiene_restofy', True) else result.get('status_code', 500)
            return JSONResponse(
                status_code=status_code,
                content={
                    'success': False,
                    'error': result.get('error', 'Error desconocido'),
                    'tiene_restofy': result.get('tiene_restofy', False)
                }
            )
    except Exception as e:
        logger.error(f"Error obteniendo facturas electrónicas: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Error obteniendo facturas electrónicas: {str(e)}'
            }
        )


@router.get("/{empresa_id}/items-facturas")
async def obtener_items_facturas(
    empresa_id: int,
    page: int = Query(1, ge=1, description="Número de página"),
    start_date: Optional[str] = Query(None, description="Fecha de inicio (formato: YYYY-MM-DD HH:MM:SS)"),
    end_date: Optional[str] = Query(None, description="Fecha de fin (formato: YYYY-MM-DD HH:MM:SS)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene el listado de items de las facturas electrónicas generadas
    Longitud de respuesta: 50 items por página
    """
    try:
        service = RestofyService(db)
        result = service.obtener_items_facturas(
            empresa_id, 
            current_user.id, 
            page, 
            start_date, 
            end_date
        )
        
        if result.get('success'):
            return JSONResponse(
                content={
                    'success': True,
                    'data': result.get('data'),
                    'page': page,
                    'start_date': start_date,
                    'end_date': end_date,
                    'items_per_page': 50
                }
            )
        else:
            status_code = 400 if not result.get('tiene_restofy', True) else result.get('status_code', 500)
            return JSONResponse(
                status_code=status_code,
                content={
                    'success': False,
                    'error': result.get('error', 'Error desconocido'),
                    'tiene_restofy': result.get('tiene_restofy', False)
                }
            )
    except Exception as e:
        logger.error(f"Error obteniendo items de facturas: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Error obteniendo items de facturas: {str(e)}'
            }
        )


@router.get("/{empresa_id}/solicitudes-inventario")
async def obtener_solicitudes_inventario(
    empresa_id: int,
    page: int = Query(1, ge=1, description="Número de página"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene el listado de solicitudes de inventario
    """
    try:
        service = RestofyService(db)
        result = service.obtener_solicitudes_inventario(empresa_id, current_user.id, page)
        
        if result.get('success'):
            return JSONResponse(
                content={
                    'success': True,
                    'data': result.get('data'),
                    'page': page
                }
            )
        else:
            status_code = 400 if not result.get('tiene_restofy', True) else result.get('status_code', 500)
            return JSONResponse(
                status_code=status_code,
                content={
                    'success': False,
                    'error': result.get('error', 'Error desconocido'),
                    'tiene_restofy': result.get('tiene_restofy', False)
                }
            )
    except Exception as e:
        logger.error(f"Error obteniendo solicitudes de inventario: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Error obteniendo solicitudes de inventario: {str(e)}'
            }
        )


@router.get("/{empresa_id}/verificar-version")
async def verificar_version(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verifica que la conexión con la API de Restofy funcione correctamente
    Incluye información de diagnóstico sobre la configuración guardada en la BD
    """
    try:
        logger.info(f"🔍 Verificando versión para empresa_id={empresa_id}, usuario_id={current_user.id}")
        
        # Primero obtener la configuración para diagnóstico
        from models.empresa import Empresa
        empresa = db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()
        
        diagnostico = None
        if empresa:
            diagnostico = {
                'empresa_id': empresa_id,
                'empresa_nombre': empresa.razon_social,
                'url_restofy_en_bd': empresa.url_restofy,
                'tiene_url': bool(empresa.url_restofy),
                'tiene_token': bool(empresa.token_restofysas),
                'token_length': len(empresa.token_restofysas) if empresa.token_restofysas else 0,
                'configuracion_completa': empresa.tiene_restofy_configurado()
            }
        
        service = RestofyService(db)
        result = service.verificar_version(empresa_id, current_user.id)
        
        logger.info(f"📊 Resultado de verificar_version: success={result.get('success')}, error={result.get('error')}")
        
        if result.get('success'):
            return JSONResponse(
                content={
                    'success': True,
                    'message': result.get('message'),
                    'url': result.get('url'),
                    'empresa': result.get('empresa'),
                    'diagnostico': diagnostico
                }
            )
        else:
            # Si la empresa no tiene Restofy configurado, retornar 400
            # Si hay un error de conexión con la API de Restofy, retornar el status_code correspondiente (404, 401, etc.)
            # Si la empresa no se encuentra, retornar 404
            error_msg = result.get('error', 'Error desconocido')
            
            if 'no encontrada' in error_msg.lower() or 'not found' in error_msg.lower():
                status_code = 404
            elif not result.get('tiene_restofy', True):
                status_code = 400
            else:
                status_code = result.get('status_code', 500)
            
            logger.warning(f"⚠️ Error verificando versión: {error_msg}, status_code={status_code}")
            
            # Incluir información de diagnóstico en el error
            response_data = {
                'success': False,
                'error': error_msg,
                'tiene_restofy': result.get('tiene_restofy', False),
                'empresa_id': empresa_id,
                'status_code': status_code,
                'diagnostico': diagnostico
            }
            
            # Agregar información adicional si hay error de conexión
            if status_code == 404 and diagnostico:
                response_data['url_usada'] = diagnostico.get('url_restofy_en_bd')
                response_data['sugerencia'] = 'Verifique que la URL tenga el formato correcto: https://ejemplo.app-restofy.com/29/api/restofy (donde 29 es la versión)'
            
            return JSONResponse(
                status_code=status_code,
                content=response_data
            )
    except Exception as e:
        logger.error(f"❌ Error verificando versión: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Error verificando versión: {str(e)}',
                'empresa_id': empresa_id
            }
        )

