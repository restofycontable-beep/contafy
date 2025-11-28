"""
Script para poblar tipos_cuentas_globales con datos iniciales
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import get_db
from models.tipo_cuenta_global import TipoCuentaGlobal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def poblar_tipos_cuentas_globales():
    """Pobla la tabla tipos_cuentas_globales con datos iniciales"""
    db = next(get_db())
    
    try:
        # Tipos de cuentas predefinidos
        tipos_cuentas = [
            "BASE GRAVADA",
            "BASE NO GRAVADA",
            "IVA",
            "CONTRAPARTIDA",
            "ADICIONAL 1",
            "ADICIONAL 2",
            "ADICIONAL 3",
            "ADICIONAL 4",
            "ADICIONAL 5",
            "ADICIONAL 6"
        ]
        
        for nombre in tipos_cuentas:
            # Verificar si ya existe
            tipo_existente = db.query(TipoCuentaGlobal).filter(
                TipoCuentaGlobal.nombre == nombre
            ).first()
            
            if not tipo_existente:
                nuevo_tipo = TipoCuentaGlobal(nombre=nombre)
                db.add(nuevo_tipo)
                logger.info(f"✅ Creado tipo de cuenta: {nombre}")
            else:
                logger.info(f"⏭️  Tipo de cuenta ya existe: {nombre}")
        
        db.commit()
        logger.info("✅ Tipos de cuentas globales poblados exitosamente")
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error poblando tipos de cuentas globales: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    poblar_tipos_cuentas_globales()

