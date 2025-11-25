"""
Servicios de autenticación
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import secrets

from models import User
from schemas.auth_schemas import TokenData
from config.settings import settings
from config.database import get_db
import logging

logger = logging.getLogger(__name__)

# Configuración de hashing de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuración JWT
ALGORITHM = "HS256"

class AuthService:
    """Servicio de autenticación"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verificar contraseña"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Obtener hash de contraseña"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Crear token JWT"""
        to_encode = data.copy()
        
        # Asegurar que 'sub' sea string (requerido por JWT)
        if 'sub' in to_encode and not isinstance(to_encode['sub'], str):
            to_encode['sub'] = str(to_encode['sub'])
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        
        logger.info(f"🔨 Creando token con datos: {to_encode}")
        logger.info(f"🔨 SECRET_KEY usado: {settings.SECRET_KEY[:10]}...")
        logger.info(f"🔨 Algoritmo: {ALGORITHM}")
        logger.info(f"🔨 Expiración: {expire}")
        
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
        logger.info(f"✅ Token creado: {encoded_jwt[:100]}...")
        
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[TokenData]:
        """Verificar y decodificar token JWT"""
        try:
            logger.info(f"🔍 Decodificando token con SECRET_KEY: {settings.SECRET_KEY[:10]}...")
            logger.info(f"🔍 Algoritmo usado: {ALGORITHM}")
            
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            logger.info(f"✅ Token decodificado exitosamente. Payload: {payload}")
            
            user_id_str: str = payload.get("sub")
            username: str = payload.get("username")
            
            if user_id_str is None:
                logger.warning("❌ No se encontró 'sub' (user_id) en el payload")
                return None
            
            # Convertir user_id de string a int
            try:
                user_id = int(user_id_str)
            except (ValueError, TypeError):
                logger.warning(f"❌ No se pudo convertir user_id a entero: {user_id_str}")
                return None
            
            logger.info(f"📋 Datos extraídos - User ID: {user_id}, Username: {username}")
                
            return TokenData(user_id=user_id, username=username)
            
        except JWTError as e:
            logger.error(f"❌ Error JWT: {e}")
            logger.error(f"   Token recibido: {token[:100]}...")
            logger.error(f"   SECRET_KEY usado: {settings.SECRET_KEY[:20]}...")
            return None
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Obtener usuario por email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Obtener usuario por username"""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Obtener usuario por ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_username_or_email(db: Session, identifier: str) -> Optional[User]:
        """Obtener usuario por username o email"""
        return db.query(User).filter(
            (User.username == identifier) | (User.email == identifier)
        ).first()
    
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
        """Autenticar usuario"""
        user = AuthService.get_user_by_username_or_email(db, username)
        
        if not user:
            return None
            
        if not AuthService.verify_password(password, user.hashed_password):
            return None
            
        return user
    
    @staticmethod
    def create_user(db: Session, user_data: dict) -> User:
        """Crear nuevo usuario"""
        # Verificar si ya existe
        if AuthService.get_user_by_email(db, user_data["email"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )
        
        if AuthService.get_user_by_username(db, user_data["username"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El username ya está en uso"
            )
        
        # Crear usuario
        hashed_password = AuthService.get_password_hash(user_data["password"])
        
        db_user = User(
            email=user_data["email"],
            username=user_data["username"],
            full_name=user_data.get("full_name"),
            hashed_password=hashed_password
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        logger.info(f"Usuario creado: {db_user.username} ({db_user.email})")
        return db_user
    
    @staticmethod
    def update_last_login(db: Session, user: User):
        """Actualizar último login"""
        user.last_login = datetime.now(timezone.utc)
        db.commit()
    
    @staticmethod
    def generate_reset_token() -> str:
        """Generar token único para reset de contraseña"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def request_password_reset(db: Session, email: str) -> bool:
        """
        Solicitar reset de contraseña
        
        Args:
            db: Sesión de base de datos
            email: Email del usuario
        
        Returns:
            True si se generó el token exitosamente (no revela si el email existe)
        """
        user = AuthService.get_user_by_email(db, email)
        
        # Por seguridad, siempre retornamos True, incluso si el email no existe
        # Esto previene que se descubran emails válidos
        if not user:
            logger.warning(f"⚠️ Intento de reset para email no existente: {email}")
            return True
        
        # Generar token único
        reset_token = AuthService.generate_reset_token()
        reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        
        # Guardar token en la base de datos
        user.reset_token = reset_token
        user.reset_token_expires = reset_token_expires
        db.commit()
        db.refresh(user)
        
        logger.info(f"✅ Token de reset generado para usuario: {user.username} ({email})")
        return True
    
    @staticmethod
    def validate_reset_token(db: Session, token: str) -> Optional[User]:
        """
        Validar token de reset de contraseña
        
        Args:
            db: Sesión de base de datos
            token: Token de reset
        
        Returns:
            Usuario si el token es válido, None en caso contrario
        """
        user = db.query(User).filter(User.reset_token == token).first()
        
        if not user:
            logger.warning("⚠️ Token de reset no encontrado")
            return None
        
        # Verificar si el token ha expirado
        if user.reset_token_expires is None or user.reset_token_expires < datetime.now(timezone.utc):
            logger.warning(f"⚠️ Token de reset expirado para usuario: {user.username}")
            # Limpiar token expirado
            user.reset_token = None
            user.reset_token_expires = None
            db.commit()
            return None
        
        logger.info(f"✅ Token de reset válido para usuario: {user.username}")
        return user
    
    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> User:
        """
        Resetear contraseña usando token
        
        Args:
            db: Sesión de base de datos
            token: Token de reset
            new_password: Nueva contraseña
        
        Returns:
            Usuario con contraseña actualizada
        
        Raises:
            HTTPException: Si el token es inválido o expirado
        """
        user = AuthService.validate_reset_token(db, token)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido o expirado"
            )
        
        # Actualizar contraseña
        user.hashed_password = AuthService.get_password_hash(new_password)
        
        # Invalidar token (solo se puede usar una vez)
        user.reset_token = None
        user.reset_token_expires = None
        
        db.commit()
        db.refresh(user)
        
        logger.info(f"✅ Contraseña restablecida exitosamente para usuario: {user.username}")
        return user

# Dependency para obtener usuario actual
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtener usuario actual desde el token JWT
    """
    from fastapi import HTTPException, status
    
    try:
        logger.info(f"🔐 Verificando token: {credentials.credentials[:50]}...")
        
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudieron validar las credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        token_data = AuthService.verify_token(credentials.credentials)
        if token_data is None:
            logger.warning("❌ Token inválido o expirado")
            raise credentials_exception
        
        logger.info(f"✅ Token válido - User ID: {token_data.user_id}, Username: {token_data.username}")
        
        user = AuthService.get_user_by_id(db, user_id=token_data.user_id)
        if user is None:
            logger.warning(f"❌ Usuario no encontrado con ID: {token_data.user_id}")
            raise credentials_exception
        
        logger.info(f"✅ Usuario encontrado: {user.username} (ID: {user.id})")
        
        if not user.is_active:
            logger.warning(f"❌ Usuario inactivo: {user.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario inactivo"
            )
        
        logger.info(f"✅ Autenticación exitosa para: {user.username}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error en autenticación: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error interno de autenticación"
        )