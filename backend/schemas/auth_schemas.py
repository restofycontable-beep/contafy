"""
Esquemas Pydantic para autenticación
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    """Esquema base del usuario"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: Optional[str] = Field(None, max_length=255)


class UserCreate(UserBase):
    """Esquema para crear usuario"""
    password: str = Field(..., min_length=6, max_length=100)


class UserUpdate(BaseModel):
    """Esquema para actualizar usuario"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    full_name: Optional[str] = Field(None, max_length=255)


class UserInDB(UserBase):
    """Esquema del usuario en base de datos"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_active: bool
    is_verified: bool
    is_superuser: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None


class UserPublic(UserBase):
    """Esquema público del usuario (sin información sensible)"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_active: bool
    is_verified: bool
    is_superuser: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None


class Token(BaseModel):
    """Esquema del token de acceso"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    """Datos contenidos en el token"""
    user_id: Optional[int] = None
    username: Optional[str] = None


class LoginRequest(BaseModel):
    """Esquema para solicitud de login"""
    username: str = Field(..., description="Username o email")
    password: str = Field(..., min_length=1)


class RegisterRequest(UserCreate):
    """Esquema para registro de usuario"""
    confirm_password: str = Field(..., min_length=6, max_length=100)


class PasswordChange(BaseModel):
    """Esquema para cambio de contraseña"""
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=100)
    confirm_password: str = Field(..., min_length=6, max_length=100)


class UserListResponse(BaseModel):
    """Esquema de respuesta para listar usuarios"""
    success: bool
    data: List[UserPublic]
    total: int


class UserResponse(BaseModel):
    """Esquema de respuesta para un usuario"""
    success: bool
    data: UserPublic


class AuthResponse(BaseModel):
    """Respuesta de autenticación exitosa"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublic


class PasswordResetRequest(BaseModel):
    """Esquema para solicitar reset de contraseña"""
    email: EmailStr = Field(..., description="Email del usuario")


class PasswordResetConfirm(BaseModel):
    """Esquema para confirmar reset de contraseña"""
    token: str = Field(..., description="Token de reset")
    new_password: str = Field(..., min_length=6, max_length=100)
    confirm_password: str = Field(..., min_length=6, max_length=100)