"""
Servicio para manejar cuentas globales
"""
from sqlalchemy.orm import Session
from models.cuenta_global import CuentaGlobal
from models.tipo_cuenta_global import TipoCuentaGlobal
from typing import List, Dict, Optional

class CuentaGlobalService:
    def __init__(self, db: Session):
        self.db = db

    def get_tipos_cuentas_globales(self) -> List[TipoCuentaGlobal]:
        """Obtiene todos los tipos de cuentas globales"""
        return self.db.query(TipoCuentaGlobal).order_by(TipoCuentaGlobal.nombre).all()

    def get_cuentas_globales_by_empresa(self, empresa_id: int) -> List[CuentaGlobal]:
        """Obtiene todas las cuentas globales de una empresa"""
        return self.db.query(CuentaGlobal).filter(
            CuentaGlobal.empresa_id == empresa_id,
            CuentaGlobal.is_active == True
        ).order_by(CuentaGlobal.orden, CuentaGlobal.id).all()

    def get_cuenta_global_by_tipo(self, empresa_id: int, tipo_cuenta_id: int) -> Optional[CuentaGlobal]:
        """Obtiene una cuenta global específica por tipo"""
        return self.db.query(CuentaGlobal).filter(
            CuentaGlobal.empresa_id == empresa_id,
            CuentaGlobal.tipo_cuenta_id == tipo_cuenta_id,
            CuentaGlobal.is_active == True
        ).first()

    def create_or_update_cuenta_global(self, empresa_id: int, tipo_cuenta_id: int, codigo: str, nombre: Optional[str] = None, descripcion: Optional[str] = None, orden: int = 0) -> CuentaGlobal:
        """Crea una nueva cuenta global (permite múltiples cuentas del mismo tipo)"""
        nueva_cuenta = CuentaGlobal(
            empresa_id=empresa_id,
            tipo_cuenta_id=tipo_cuenta_id,
            codigo=codigo,
            nombre=nombre,
            descripcion=descripcion,
            orden=orden,
            is_active=True
        )
        self.db.add(nueva_cuenta)
        self.db.commit()
        self.db.refresh(nueva_cuenta)
        return nueva_cuenta

    def delete_cuenta_global(self, cuenta_id: int, empresa_id: int) -> bool:
        """Elimina (soft delete) una cuenta global"""
        cuenta = self.db.query(CuentaGlobal).filter(
            CuentaGlobal.id == cuenta_id,
            CuentaGlobal.empresa_id == empresa_id
        ).first()
        
        if cuenta:
            cuenta.is_active = False
            self.db.commit()
            return True
        return False

