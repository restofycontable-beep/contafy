#!/usr/bin/env python3

"""
Script para crear todas las tablas definidas en los modelos ORM.
"""
from config.database import create_tables # Ajuste según tu estructura

if __name__ == "__main__":
    create_tables()
    print("✅ Tablas creadas o verificadas correctamente")
