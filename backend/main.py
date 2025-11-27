from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from routes import auth_routes, procesamiento_routes, empresa_routes, zip_routes, ubicaciones_routes, admin_routes, restofy_routes
from config.settings import settings
import logging
from datetime import datetime

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s | %(levelname)s | %(name)s:%(funcName)s:%(lineno)d | %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Modo debug: {settings.DEBUG}")
    logger.info(f"Servidor corriendo en {settings.HOST}:{settings.PORT}")
    yield
    logger.info(f"Cerrando {settings.APP_NAME}")

app = FastAPI(
    title=settings.APP_NAME,
    description="API para procesamiento de documentos",
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan
)

cors_origins = settings.CORS_ORIGINS
if "*" in cors_origins:
    cors_origins = ["*"]
else:
    cors_origins = [origin for origin in cors_origins if "*" not in origin]

logger.info(f"CORS Origins configurados: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

app.include_router(auth_routes.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(procesamiento_routes.router, prefix="/api/procesamiento", tags=["Procesamiento"])
app.include_router(empresa_routes.router, prefix="/api/empresas", tags=["Empresas"])
app.include_router(zip_routes.router, prefix="/api/zip", tags=["Archivos ZIP"])
app.include_router(ubicaciones_routes.router, prefix="/api/ubicaciones", tags=["Ubicaciones"])
app.include_router(admin_routes.router, prefix="/api/admin", tags=["Administración"])
app.include_router(restofy_routes.router, prefix="/api/restofy", tags=["Restofy"])

@app.get("/")
async def root():
    return {
        "message": f"{settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.get("/api/routes")
async def list_routes():
    routes = []
    for route in app.routes:
        if hasattr(route, "methods") and hasattr(route, "path"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods)
            })
    return {
        "routes": routes,
        "total": len(routes)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        limit_concurrency=1000,
        limit_max_requests=10000,
        timeout_keep_alive=30,
        timeout_graceful_shutdown=30
    )