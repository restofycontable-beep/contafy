"""
Servicio para interactuar con la API de Restofy
"""
import requests
import logging
import re
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from models.empresa import Empresa

logger = logging.getLogger(__name__)


class RestofyService:
    """
    Servicio para hacer llamadas a la API de Restofy
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def _get_empresa_config(self, empresa_id: int, usuario_id: int) -> Optional[Dict[str, Any]]:
        """
        Obtiene la configuración de Restofy de una empresa
        Retorna None si la empresa no tiene Restofy configurado
        """
        logger.info(f"🔍 RestofyService._get_empresa_config: empresa_id={empresa_id}, usuario_id={usuario_id}")
        
        empresa = self.db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == usuario_id,
            Empresa.is_active == True
        ).first()
        
        if not empresa:
            logger.warning(f"⚠️ RestofyService._get_empresa_config: Empresa no encontrada (empresa_id={empresa_id}, usuario_id={usuario_id})")
            return {
                'error': f'Empresa no encontrada (ID: {empresa_id}). Verifique que la empresa existe y pertenece a su cuenta.',
                'empresa_id': empresa_id
            }
        
        logger.info(f"✅ RestofyService._get_empresa_config: Empresa encontrada: {empresa.razon_social}")
        
        # Verificar si la empresa está vinculada con Restofy
        vinculada_restofy = getattr(empresa, 'vinculada_restofy', False)
        if not vinculada_restofy:
            logger.warning(f"⚠️ RestofyService._get_empresa_config: Empresa no está vinculada con Restofy (empresa_id={empresa_id})")
            return {
                'error': 'Esta empresa no está vinculada con Restofy. Active la opción "Vinculada con Restofy" en la configuración de la empresa.',
                'empresa': empresa.razon_social,
                'tiene_restofy': False,
                'vinculada_restofy': False
            }
        
        # Verificar si la empresa tiene Restofy configurado (URL y token)
        if not empresa.tiene_restofy_configurado():
            logger.warning(f"⚠️ RestofyService._get_empresa_config: Empresa vinculada pero no tiene Restofy configurado completamente (empresa_id={empresa_id})")
            return {
                'error': 'Esta empresa está vinculada con Restofy pero no tiene la URL y token configurados. Configure la URL y token de Restofy en la configuración de la empresa.',
                'empresa': empresa.razon_social,
                'tiene_restofy': False,
                'vinculada_restofy': True
            }
        
        # Validar formato de URL (debe contener la versión de la API, ej: /29/api/restofy)
        url_restofy = empresa.url_restofy
        token_restofysas = empresa.token_restofysas
        
        # LOG DETALLADO DE LO QUE HAY EN LA BASE DE DATOS
        logger.info(f"📊 RestofyService._get_empresa_config: DATOS EN BD para empresa_id={empresa_id}:")
        logger.info(f"   - URL completa: {url_restofy}")
        logger.info(f"   - URL length: {len(url_restofy) if url_restofy else 0} caracteres")
        logger.info(f"   - Token length: {len(token_restofysas) if token_restofysas else 0} caracteres")
        logger.info(f"   - Token preview: {token_restofysas[:20] + '...' if token_restofysas and len(token_restofysas) > 20 else token_restofysas}")
        
        if url_restofy:
            # Verificar que la URL tenga el formato esperado: debe contener /api/restofy
            if '/api/restofy' not in url_restofy:
                logger.error(f"❌ RestofyService._get_empresa_config: URL de Restofy no tiene el formato esperado")
                logger.error(f"   URL actual: {url_restofy}")
                logger.error(f"   Formato esperado: https://ejemplo.app-restofy.com/29/api/restofy (donde 29 es la versión de la API)")
            else:
                logger.info(f"✅ URL contiene '/api/restofy' - formato correcto")
            
            # Extraer la versión de la URL para validación
            version_match = re.search(r'/(\d+)/api/restofy', url_restofy)
            if version_match:
                version = version_match.group(1)
                logger.info(f"✅ Versión de API detectada en URL: {version}")
            else:
                logger.warning(f"⚠️ No se pudo detectar la versión de la API en la URL")
                logger.warning(f"   URL analizada: {url_restofy}")
            
            # Verificar espacios
            if url_restofy != url_restofy.strip():
                logger.warning(f"⚠️ La URL tiene espacios al inicio o final")
                logger.warning(f"   URL original: '{url_restofy}'")
                logger.warning(f"   URL sin espacios: '{url_restofy.strip()}'")
        else:
            logger.error(f"❌ No hay URL de Restofy configurada en la base de datos")
        
        if not token_restofysas:
            logger.error(f"❌ No hay token de Restofy configurado en la base de datos")
        
        logger.info(f"✅ RestofyService._get_empresa_config: Configuración válida, URL final: {self._build_api_url(url_restofy) if url_restofy else 'N/A'}")
        
        return {
            'url': empresa.url_restofy,
            'token': empresa.token_restofysas,
            'empresa': empresa.razon_social,
            'tiene_restofy': True
        }
    
    def _build_api_url(self, base_url: str) -> str:
        """
        Limpia y retorna la URL completa de la API de Restofy
        La URL debe venir completa desde la configuración de la empresa
        Ejemplo: https://casorellana.app-restofy.com/29/api/restofy
        """
        # Limpiar la URL (eliminar espacios y barras al final)
        url = base_url.strip().rstrip('/')
        return url
    
    def _make_request(self, url: str, token: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Realiza una petición GET a la API de Restofy
        """
        try:
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            logger.info(f"🌐 Llamando a Restofy API (GET): {url}")
            logger.info(f"📋 Parámetros: {params}")
            
            response = requests.get(url, headers=headers, params=params, timeout=30)
            
            logger.info(f"📊 Status code: {response.status_code}")
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'data': response.json(),
                    'status_code': response.status_code
                }
            elif response.status_code == 401:
                return {
                    'success': False,
                    'error': 'Token de autenticación inválido o expirado',
                    'status_code': response.status_code
                }
            elif response.status_code == 404:
                return {
                    'success': False,
                    'error': 'Recurso no encontrado. Verifique que la versión de la API sea correcta (29)',
                    'status_code': response.status_code
                }
            else:
                try:
                    error_data = response.json()
                    error_message = error_data.get('message', f'Error en la API: {response.status_code}')
                except:
                    error_message = f'Error en la API: {response.status_code} - {response.text}'
                
                return {
                    'success': False,
                    'error': error_message,
                    'status_code': response.status_code
                }
                
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': 'Timeout al conectar con la API de Restofy'
            }
        except requests.exceptions.ConnectionError:
            return {
                'success': False,
                'error': 'Error de conexión con la API de Restofy. Verifique la URL'
            }
        except Exception as e:
            logger.error(f"❌ Error en petición a Restofy: {str(e)}")
            return {
                'success': False,
                'error': f'Error inesperado: {str(e)}'
            }
    
    def _make_post_request(self, url: str, token: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Realiza una petición POST con form-data a la API de Restofy
        """
        try:
            headers = {
                'Authorization': f'Bearer {token}',
                'Accept': 'application/json'
            }
            # No incluir Content-Type para que requests maneje form-data automáticamente
            
            # LOG DETALLADO DE LA PETICIÓN
            logger.info(f"🌐 ========== PETICIÓN A RESTOFY API ==========")
            logger.info(f"📡 Método: POST")
            logger.info(f"🔗 URL completa: {url}")
            logger.info(f"📋 Datos (form-data): {data}")
            logger.info(f"🔑 Token length: {len(token) if token else 0} caracteres")
            logger.info(f"🔑 Token preview: {token[:20] + '...' if token and len(token) > 20 else token}")
            logger.info(f"📦 Headers: {headers}")
            
            response = requests.post(url, headers=headers, data=data, timeout=30)
            
            logger.info(f"📊 ========== RESPUESTA DE RESTOFY API ==========")
            logger.info(f"📊 Status code: {response.status_code}")
            logger.info(f"📊 Status text: {response.reason}")
            logger.info(f"📊 Response headers: {dict(response.headers)}")
            
            # Log de la respuesta (primeros 500 caracteres)
            try:
                response_text = response.text
                logger.info(f"📄 Response body (primeros 500 chars): {response_text[:500]}")
            except:
                logger.info(f"📄 No se pudo leer el body de la respuesta")
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'data': response.json(),
                    'status_code': response.status_code
                }
            elif response.status_code == 401:
                return {
                    'success': False,
                    'error': 'Token de autenticación inválido o expirado',
                    'status_code': response.status_code
                }
            elif response.status_code == 404:
                return {
                    'success': False,
                    'error': 'Recurso no encontrado. Verifique que la versión de la API sea correcta (29)',
                    'status_code': response.status_code
                }
            else:
                try:
                    error_data = response.json()
                    error_message = error_data.get('message', f'Error en la API: {response.status_code}')
                except:
                    error_message = f'Error en la API: {response.status_code} - {response.text}'
                
                return {
                    'success': False,
                    'error': error_message,
                    'status_code': response.status_code
                }
                
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': 'Timeout al conectar con la API de Restofy'
            }
        except requests.exceptions.ConnectionError:
            return {
                'success': False,
                'error': 'Error de conexión con la API de Restofy. Verifique la URL'
            }
        except Exception as e:
            logger.error(f"❌ Error en petición POST a Restofy: {str(e)}")
            return {
                'success': False,
                'error': f'Error inesperado: {str(e)}'
            }
    
    def obtener_productos(self, empresa_id: int, usuario_id: int, page: int = 1) -> Dict[str, Any]:
        """
        Obtiene el listado de productos de Restofy
        IMPORTANTE: La API de Restofy requiere POST, no GET
        """
        config = self._get_empresa_config(empresa_id, usuario_id)
        if not config or config.get('error'):
            return {
                'success': False,
                'error': config.get('error', 'Empresa no encontrada o no tiene configuración de Restofy'),
                'tiene_restofy': config.get('tiene_restofy', False) if config else False
            }
        
        url = self._build_api_url(config['url'])
        # Cambiar a POST con form-data (como facturas electrónicas)
        data = {
            'action': 'products',
            'page': str(page)
        }
        
        logger.info(f"📦 Obteniendo productos - URL: {url}, Page: {page}")
        return self._make_post_request(url, config['token'], data)
    
    def obtener_categorias(self, empresa_id: int, usuario_id: int, page: int = 1) -> Dict[str, Any]:
        """
        Obtiene el listado de categorías de Restofy
        IMPORTANTE: La API de Restofy requiere POST, no GET
        """
        config = self._get_empresa_config(empresa_id, usuario_id)
        if not config or config.get('error'):
            return {
                'success': False,
                'error': config.get('error', 'Empresa no encontrada o no tiene configuración de Restofy'),
                'tiene_restofy': config.get('tiene_restofy', False) if config else False
            }
        
        url = self._build_api_url(config['url'])
        # Cambiar a POST con form-data (como facturas electrónicas)
        data = {
            'action': 'categories',
            'page': str(page)
        }
        
        logger.info(f"📁 Obteniendo categorías - URL: {url}, Page: {page}")
        return self._make_post_request(url, config['token'], data)
    
    def obtener_facturas_electronicas(
        self, 
        empresa_id: int, 
        usuario_id: int, 
        page: int = 1,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Obtiene el listado de facturas electrónicas generadas
        Usa POST con form-data según los requisitos de la API de Restofy
        """
        config = self._get_empresa_config(empresa_id, usuario_id)
        if not config or config.get('error'):
            return {
                'success': False,
                'error': config.get('error', 'Empresa no encontrada o no tiene configuración de Restofy'),
                'tiene_restofy': config.get('tiene_restofy', False) if config else False
            }
        
        url = self._build_api_url(config['url'])
        # Preparar datos para form-data
        data = {
            'action': 'orders',
            'page': str(page)
        }
        
        if start_date:
            data['start_date'] = start_date
        if end_date:
            data['end_date'] = end_date
        
        return self._make_post_request(url, config['token'], data)
    
    def obtener_items_facturas(
        self, 
        empresa_id: int, 
        usuario_id: int, 
        page: int = 1,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Obtiene el listado de items de las facturas electrónicas generadas
        Longitud de respuesta: 50 items por página
        IMPORTANTE: La API de Restofy requiere POST, no GET
        """
        config = self._get_empresa_config(empresa_id, usuario_id)
        if not config or config.get('error'):
            return {
                'success': False,
                'error': config.get('error', 'Empresa no encontrada o no tiene configuración de Restofy'),
                'tiene_restofy': config.get('tiene_restofy', False) if config else False
            }
        
        url = self._build_api_url(config['url'])
        # Cambiar a POST con form-data
        data = {
            'action': 'items',
            'page': str(page)
        }
        
        if start_date:
            data['start_date'] = start_date
        if end_date:
            data['end_date'] = end_date
        
        logger.info(f"🛒 Obteniendo items de facturas - URL: {url}, Page: {page}")
        return self._make_post_request(url, config['token'], data)
    
    def obtener_solicitudes_inventario(
        self, 
        empresa_id: int, 
        usuario_id: int, 
        page: int = 1
    ) -> Dict[str, Any]:
        """
        Obtiene el listado de solicitudes de inventario
        IMPORTANTE: La API de Restofy requiere POST, no GET
        """
        config = self._get_empresa_config(empresa_id, usuario_id)
        if not config or config.get('error'):
            return {
                'success': False,
                'error': config.get('error', 'Empresa no encontrada o no tiene configuración de Restofy'),
                'tiene_restofy': config.get('tiene_restofy', False) if config else False
            }
        
        url = self._build_api_url(config['url'])
        # Cambiar a POST con form-data
        data = {
            'action': 'solicitudes_inventario',
            'page': str(page)
        }
        
        logger.info(f"📋 Obteniendo solicitudes de inventario - URL: {url}, Page: {page}")
        return self._make_post_request(url, config['token'], data)
    
    def verificar_version(self, empresa_id: int, usuario_id: int) -> Dict[str, Any]:
        """
        Verifica que la conexión con la API de Restofy funcione correctamente
        Realiza una petición de prueba (obtener productos) para verificar la conexión
        """
        logger.info(f"🔍 RestofyService.verificar_version: empresa_id={empresa_id}, usuario_id={usuario_id}")
        
        config = self._get_empresa_config(empresa_id, usuario_id)
        if not config or config.get('error'):
            error_msg = config.get('error', 'Empresa no encontrada o no tiene configuración de Restofy') if config else 'Empresa no encontrada'
            logger.warning(f"⚠️ RestofyService.verificar_version: {error_msg}")
            return {
                'success': False,
                'error': error_msg,
                'tiene_restofy': config.get('tiene_restofy', False) if config else False,
                'empresa_id': empresa_id
            }
        
        logger.info(f"✅ RestofyService.verificar_version: Configuración obtenida, URL: {config.get('url', 'N/A')[:50]}...")
        
        # Intentar obtener productos como prueba de conexión
        result = self.obtener_productos(empresa_id, usuario_id, page=1)
        
        if result.get('success'):
            logger.info(f"✅ RestofyService.verificar_version: Conexión exitosa")
            return {
                'success': True,
                'message': 'Conexión exitosa con la API de Restofy',
                'url': self._build_api_url(config['url']),
                'empresa': config.get('empresa')
            }
        else:
            logger.warning(f"⚠️ RestofyService.verificar_version: Error en conexión: {result.get('error')}")
            return result

