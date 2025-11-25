"""
Configuración de la base de datos
"""

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .settings import settings

# Configurar logger
logger = logging.getLogger(__name__)

# URL de conexión a la base de datos
DATABASE_URL = settings.database_url
logger.info(f"🔗 Configurando conexión a base de datos: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")

# Crear engine de SQLAlchemy
try:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False
    )
    logger.info("✅ Engine de SQLAlchemy creado exitosamente")
except Exception as e:
    logger.error(f"❌ Error creando engine de SQLAlchemy: {e}")
    raise

# Crear sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
from models.base import Base

# Dependency para obtener sesión de base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Función para crear todas las tablas
def create_tables():
    Base.metadata.create_all(bind=engine)

# Función para verificar conexión
def check_connection():
    """Verifica la conexión a la base de datos"""
    try:
        logger.info("🔍 Verificando conexión a la base de datos...")
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            logger.info("✅ Conexión a la base de datos exitosa")
            return True
    except Exception as e:
        logger.error(f"❌ Error de conexión a la base de datos: {e}")
        logger.error(f"📋 URL utilizada: {DATABASE_URL}")
        return False

# Función para obtener información del pool de conexiones
def get_pool_status():
    """Obtiene información del estado del pool de conexiones"""
    try:
        pool = engine.pool
        status = {
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow()
        }
        logger.info(f"📊 Estado del pool: {status}")
        return status
    except Exception as e:
        logger.error(f"❌ Error obteniendo estado del pool: {e}")
        return None

# Verificar conexión al importar el módulo
logger.info("🚀 Iniciando verificación de conexión a la base de datos...")
if check_connection():
    logger.info("🎉 Base de datos lista para usar")
    get_pool_status()
else:
    logger.warning("⚠️ No se pudo conectar a la base de datos - Verifica tu configuración")