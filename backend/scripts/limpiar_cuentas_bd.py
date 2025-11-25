"""
Script para limpiar los .0 de los datos existentes en la base de datos
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from models.cuenta_importada import CuentaImportada
from utils.number_utils import remove_trailing_zeros
from config.database import SessionLocal

def limpiar_cuentas_bd():
    db = SessionLocal()
    try:
        cuentas = db.query(CuentaImportada).all()
        actualizadas = 0
        
        print(f"Encontradas {len(cuentas)} cuentas en la base de datos")
        
        for cuenta in cuentas:
            nit_limpio = remove_trailing_zeros(cuenta.nit)
            cuenta_limpia = remove_trailing_zeros(cuenta.cuenta)
            cuenta_exenta_limpia = remove_trailing_zeros(cuenta.cuenta_exenta) if cuenta.cuenta_exenta else None
            cuenta_iva_limpia = remove_trailing_zeros(cuenta.cuenta_iva) if cuenta.cuenta_iva else None
            cuenta_contrapartida_limpia = remove_trailing_zeros(cuenta.cuenta_contrapartida) if cuenta.cuenta_contrapartida else None
            
            cambios = False
            if nit_limpio != cuenta.nit:
                cuenta.nit = nit_limpio
                cambios = True
            if cuenta_limpia != cuenta.cuenta:
                cuenta.cuenta = cuenta_limpia
                cambios = True
            if cuenta_exenta_limpia != cuenta.cuenta_exenta:
                cuenta.cuenta_exenta = cuenta_exenta_limpia
                cambios = True
            if cuenta_iva_limpia != cuenta.cuenta_iva:
                cuenta.cuenta_iva = cuenta_iva_limpia
                cambios = True
            if cuenta_contrapartida_limpia != cuenta.cuenta_contrapartida:
                cuenta.cuenta_contrapartida = cuenta_contrapartida_limpia
                cambios = True
            
            if cambios:
                actualizadas += 1
        
        db.commit()
        print(f"✓ Actualizadas {actualizadas} cuentas de {len(cuentas)} totales")
        print("Limpieza completada exitosamente")
    except Exception as e:
        db.rollback()
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("Iniciando limpieza de cuentas en la base de datos...")
    limpiar_cuentas_bd()

