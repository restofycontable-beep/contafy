"""
Servicio para manejar operaciones de empresas
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from models.empresa import Empresa
from models.user import User

class EmpresaService:
    def __init__(self, db: Session):
        self.db = db
    
    def crear_empresa(self, empresa_data: dict, usuario_id: int) -> Empresa:
        """
        Crear una nueva empresa
        """
        try:
            # Verificar si ya existe una empresa con el mismo NIT
            empresa_existente = self.db.query(Empresa).filter(
                Empresa.nit == empresa_data['nit']
            ).first()
            
            if empresa_existente:
                raise ValueError(f"Ya existe una empresa con el NIT {empresa_data['nit']}")
            
            # Crear la nueva empresa
            empresa = Empresa(
                nit=empresa_data['nit'],
                razon_social=empresa_data['razon_social'],
                nombre_comercial=empresa_data.get('nombre_comercial'),
                representante_nombre=empresa_data.get('representante_nombre'),
                representante_nit=empresa_data.get('representante_nit'),
                usuario_id=usuario_id
            )
            
            self.db.add(empresa)
            self.db.commit()
            self.db.refresh(empresa)
            
            return empresa
            
        except Exception as e:
            self.db.rollback()
            
            # Si es un error de secuencia, intentar arreglarlo
            if "llave duplicada" in str(e) and "empresas_pkey" in str(e):
                try:
                    self.arreglar_secuencia_ids()
                    # Intentar crear la empresa nuevamente
                    empresa = Empresa(
                        nit=empresa_data['nit'],
                        razon_social=empresa_data['razon_social'],
                        nombre_comercial=empresa_data.get('nombre_comercial'),
                        representante_nombre=empresa_data.get('representante_nombre'),
                        representante_nit=empresa_data.get('representante_nit'),
                        usuario_id=usuario_id
                    )
                    
                    self.db.add(empresa)
                    self.db.commit()
                    self.db.refresh(empresa)
                    
                    return empresa
                    
                except Exception as retry_error:
                    self.db.rollback()
                    raise ValueError(f"Error creando empresa después de arreglar secuencia: {str(retry_error)}")
            
            # Si no es un error de secuencia, re-lanzar el error original
            raise ValueError(f"Error creando empresa: {str(e)}")
    
    def obtener_empresas_usuario(self, usuario_id: int) -> List[Empresa]:
        """
        Obtener todas las empresas de un usuario
        """
        return self.db.query(Empresa).filter(
            Empresa.usuario_id == usuario_id,
            Empresa.is_active == True
        ).all()
    
    def obtener_empresa_por_id(self, empresa_id: int, usuario_id: int) -> Optional[Empresa]:
        """
        Obtener una empresa específica por ID
        """
        return self.db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == usuario_id,
            Empresa.is_active == True
        ).first()
    
    def actualizar_empresa(self, empresa_id: int, empresa_data: dict, usuario_id: int) -> Optional[Empresa]:
        """
        Actualizar una empresa existente
        """
        empresa = self.obtener_empresa_por_id(empresa_id, usuario_id)
        
        if not empresa:
            return None
        
        # Verificar si el nuevo NIT ya existe en otra empresa
        if 'nit' in empresa_data and empresa_data['nit'] != empresa.nit:
            empresa_existente = self.db.query(Empresa).filter(
                Empresa.nit == empresa_data['nit'],
                Empresa.id != empresa_id
            ).first()
            
            if empresa_existente:
                raise ValueError(f"Ya existe una empresa con el NIT {empresa_data['nit']}")
        
        # Actualizar campos
        for campo, valor in empresa_data.items():
            if hasattr(empresa, campo):
                setattr(empresa, campo, valor)
        
        self.db.commit()
        self.db.refresh(empresa)
        
        return empresa
    
    def eliminar_empresa(self, empresa_id: int, usuario_id: int) -> bool:
        """
        Eliminar (desactivar) una empresa
        """
        empresa = self.obtener_empresa_por_id(empresa_id, usuario_id)
        
        if not empresa:
            return False
        
        empresa.is_active = False
        self.db.commit()
        
        return True
    
    def arreglar_secuencia_ids(self) -> bool:
        """
        Arregla la secuencia de IDs de la tabla empresas
        """
        try:
            # Obtener el máximo ID actual
            max_id = self.db.query(Empresa.id).order_by(Empresa.id.desc()).first()
            max_id = max_id[0] if max_id else 0
            
            # Resetear la secuencia usando SQL directo
            self.db.execute(f"SELECT setval('empresas_id_seq', {max_id + 1}, false)")
            self.db.commit()
            
            return True
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Error arreglando secuencia: {str(e)}")
