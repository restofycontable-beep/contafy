"""
Rutas de autenticación
Login, registro, refresh token y gestión de usuarios
"""

from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from config.database import get_db
from models.user import User
from schemas.auth_schemas import (
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    UserPublic,
    PasswordChange,
    UserUpdate,
    PasswordResetRequest,
    PasswordResetConfirm
)
from services.auth_service import AuthService, get_current_user
from services.email_service import EmailService
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

# Dependency para obtener usuario activo
async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:

    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Usuario inactivo"
        )
    return current_user


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"📥 Datos recibidos para registro:")
        logger.info(f"   Username: {user_data.username}")
        logger.info(f"   Email: {user_data.email}")
        logger.info(f"   Full name: {user_data.full_name}")
        logger.info(f"   Password length: {len(user_data.password)}")
        logger.info(f"   Confirm password length: {len(user_data.confirm_password)}")
        
        # Validar que las contraseñas coincidan
        if user_data.password != user_data.confirm_password:
            logger.warning(f"❌ Contraseñas no coinciden para usuario: {user_data.username}")
            logger.warning(f"   Password: '{user_data.password}'")
            logger.warning(f"   Confirm: '{user_data.confirm_password}'")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Las contraseñas no coinciden"
            )
        
        logger.info("✅ Validación de contraseñas exitosa")
        
        # Crear usuario
        user_dict = user_data.model_dump(exclude={"confirm_password"})
        logger.info(f"📋 Datos para crear usuario: {user_dict}")
        
        db_user = AuthService.create_user(db, user_dict)
        
        logger.info(f"Usuario creado exitosamente: {db_user.username} (ID: {db_user.id})")
        
        # Crear token de acceso
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = AuthService.create_access_token(
            data={"sub": db_user.id, "username": db_user.username},
            expires_delta=access_token_expires
        )
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserPublic.model_validate(db_user)
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Error de validación en registro: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error de validación: {str(e)}"
        )
    except Exception as e:
        logger.error(f"❌ Error interno en registro: {e}")
        logger.error(f"   Tipo de error: {type(e).__name__}")
        import traceback
        logger.error(f"   Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    # Autenticar usuario
    user = AuthService.authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo"
        )
    
    # Crear token de acceso
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": user.id, "username": user.username},
        expires_delta=access_token_expires
    )
    
    # Actualizar último login
    AuthService.update_last_login(db, user)
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserPublic.model_validate(user)
    )


@router.get("/me", response_model=UserPublic)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_active_user)]
):

    return UserPublic.model_validate(current_user)


@router.put("/me", response_model=UserPublic)
async def update_current_user(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):

    try:
        # Verificar si el email ya existe (si se está cambiando)
        if user_update.email and user_update.email != current_user.email:
            existing_user = AuthService.get_user_by_email(db, user_update.email)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El email ya está en uso"
                )
        
        # Verificar si el username ya existe (si se está cambiando)
        if user_update.username and user_update.username != current_user.username:
            existing_user = AuthService.get_user_by_username(db, user_update.username)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El username ya está en uso"
                )
        
        # Actualizar campos básicos
        update_data = user_update.model_dump(exclude_unset=True, exclude_none=True)
        for field, value in update_data.items():
            if hasattr(current_user, field):
                setattr(current_user, field, value)
        
        db.commit()
        db.refresh(current_user)
        
        return UserPublic.model_validate(current_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando usuario: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):

    # Verificar contraseña actual
    if not AuthService.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )
    
    # Verificar que las nuevas contraseñas coincidan
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las nuevas contraseñas no coinciden"
        )
    
    # Actualizar contraseña
    current_user.hashed_password = AuthService.get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}


@router.post("/logout")
async def logout():

    return {"message": "Logout exitoso"}


@router.post("/forgot-password")
async def forgot_password(
    reset_request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Solicitar reset de contraseña
    Envía un email con un token para restablecer la contraseña
    """
    try:
        # Validar configuración SMTP antes de procesar
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.error("❌ Configuración SMTP no encontrada. No se puede enviar email de recuperación.")
            logger.error("   Configure SMTP_USER, SMTP_PASSWORD y SMTP_FROM_EMAIL en .env")
            # Por seguridad, retornamos éxito sin revelar el error
            return {
                "message": "Si el email existe, recibirás un enlace para restablecer tu contraseña"
            }
        
        logger.info(f"📧 Solicitud de reset de contraseña para: {reset_request.email}")
        
        # Generar token y guardarlo en la base de datos
        AuthService.request_password_reset(db, reset_request.email)
        
        # Obtener usuario para enviar email (si existe)
        user = AuthService.get_user_by_email(db, reset_request.email)
        
        if user and user.reset_token:
            # Construir URL de reset con ruta específica y query parameter
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={user.reset_token}"
            
            logger.info(f"🔗 URL de reset generada para usuario {user.username}: {reset_url}")
            
            # Enviar email
            email_sent = EmailService.send_password_reset_email(
                user.email,
                user.reset_token,
                reset_url
            )
            
            if email_sent:
                logger.info(f"✅ Email de recuperación enviado exitosamente a {user.email}")
            else:
                logger.warning(f"⚠️ No se pudo enviar email a {reset_request.email}")
                # Aún retornamos éxito para no revelar si el email existe
        else:
            logger.info(f"ℹ️ Email no encontrado en la base de datos: {reset_request.email}")
        
        # Siempre retornamos éxito (por seguridad, no revelamos si el email existe)
        return {
            "message": "Si el email existe, recibirás un enlace para restablecer tu contraseña"
        }
        
    except Exception as e:
        logger.error(f"❌ Error en forgot-password: {e}")
        import traceback
        logger.error(f"   Traceback: {traceback.format_exc()}")
        # Por seguridad, siempre retornamos el mismo mensaje
        return {
            "message": "Si el email existe, recibirás un enlace para restablecer tu contraseña"
        }


@router.get("/validate-reset-token")
async def validate_reset_token(
    token: str = Query(..., description="Token de reset a validar"),
    db: Session = Depends(get_db)
):
    
    try:
        logger.info(f"🔍 Validando token de reset: {token[:20]}...")
        
        user = AuthService.validate_reset_token(db, token)
        
        if user:
            logger.info(f"✅ Token válido para usuario: {user.username}")
            return {
                "valid": True,
                "message": "Token válido"
            }
        else:
            logger.warning(f"⚠️ Token inválido o expirado: {token[:20]}...")
            return {
                "valid": False,
                "message": "Token inválido o expirado"
            }
            
    except Exception as e:
        logger.error(f"❌ Error validando token: {e}")
        import traceback
        logger.error(f"   Traceback: {traceback.format_exc()}")
        return {
            "valid": False,
            "message": "Error al validar token"
        }


@router.post("/reset-password")
async def reset_password(
    reset_confirm: PasswordResetConfirm,
    db: Session = Depends(get_db)
):

    try:
        logger.info(f"🔐 Solicitud de reset de contraseña con token: {reset_confirm.token[:20]}...")
        
        # Validar que las contraseñas coincidan
        if reset_confirm.new_password != reset_confirm.confirm_password:
            logger.warning("⚠️ Las contraseñas no coinciden en reset-password")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Las contraseñas no coinciden"
            )
        
        # Validar longitud mínima de contraseña
        if len(reset_confirm.new_password) < 6:
            logger.warning("⚠️ Contraseña demasiado corta (mínimo 6 caracteres)")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña debe tener al menos 6 caracteres"
            )
        
        # Resetear contraseña
        user = AuthService.reset_password(
            db,
            reset_confirm.token,
            reset_confirm.new_password
        )
        
        logger.info(f"✅ Contraseña restablecida exitosamente para usuario: {user.username} ({user.email})")
        
        return {
            "message": "Contraseña restablecida exitosamente. Puedes iniciar sesión con tu nueva contraseña."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error en reset-password: {e}")
        import traceback
        logger.error(f"   Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado"
        )