"""
Servicio de envío de emails
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from config.settings import settings
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Servicio para enviar emails"""

    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """
        Enviar email usando SMTP
        
        Args:
            to_email: Email del destinatario
            subject: Asunto del email
            html_body: Contenido HTML del email
            text_body: Contenido de texto plano (opcional)
        
        Returns:
            True si se envió correctamente, False en caso contrario
        """
        try:
            # Validar configuración SMTP
            if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
                logger.warning("⚠️ Configuración SMTP no encontrada. Email no enviado.")
                logger.warning("   Configure SMTP_USER, SMTP_PASSWORD y SMTP_FROM_EMAIL en .env")
                return False

            # Crear mensaje
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
            msg['To'] = to_email

            # Agregar cuerpo de texto y HTML
            if text_body:
                part1 = MIMEText(text_body, 'plain')
                msg.attach(part1)

            part2 = MIMEText(html_body, 'html')
            msg.attach(part2)

            # Enviar email
            logger.info(f"🔗 Conectando a SMTP server: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                logger.info("✅ Conexión SMTP establecida")
                
                if settings.SMTP_USE_TLS:
                    logger.info("🔒 Iniciando TLS...")
                    server.starttls()
                    logger.info("✅ TLS establecido")
                
                logger.info(f"🔐 Autenticando como: {settings.SMTP_USER}")
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                logger.info("✅ Autenticación exitosa")
                
                logger.info(f"📤 Enviando mensaje a: {to_email}")
                server.send_message(msg)
                logger.info(f"✅ Email enviado exitosamente a {to_email}")
            
            return True

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ Error de autenticación SMTP: {e}")
            logger.error("   Verifica que SMTP_USER y SMTP_PASSWORD sean correctos")
            logger.error("   Para Gmail, asegúrate de usar una 'Contraseña de aplicación'")
            return False
        except smtplib.SMTPConnectError as e:
            logger.error(f"❌ Error de conexión SMTP: {e}")
            logger.error(f"   No se pudo conectar a {settings.SMTP_HOST}:{settings.SMTP_PORT}")
            logger.error("   Verifica que el servidor SMTP esté accesible")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"❌ Error SMTP al enviar email: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Error inesperado al enviar email: {e}")
            import traceback
            logger.error(f"   Traceback: {traceback.format_exc()}")
            return False

    @staticmethod
    def send_password_reset_email(email: str, token: str, reset_url: str) -> bool:
        """
        Enviar email de recuperación de contraseña
        
        Args:
            email: Email del usuario
            token: Token de reset
            reset_url: URL completa para resetear contraseña
        
        Returns:
            True si se envió correctamente, False en caso contrario
        """
        subject = "Recuperación de Contraseña - Contafy"

        # Cuerpo HTML del email
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #4CAF50;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 5px 5px;
                }}
                .button {{
                    display: inline-block;
                    padding: 12px 30px;
                    background-color: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .button:hover {{
                    background-color: #45a049;
                }}
                .footer {{
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #666;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Recuperación de Contraseña</h1>
                </div>
                <div class="content">
                    <p>Hola,</p>
                    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Contafy.</p>
                    <p>Haz clic en el siguiente botón para restablecer tu contraseña:</p>
                    <p style="text-align: center;">
                        <a href="{reset_url}" class="button">Restablecer Contraseña</a>
                    </p>
                    <p>O copia y pega el siguiente enlace en tu navegador:</p>
                    <p style="word-break: break-all; color: #666;">{reset_url}</p>
                    <p><strong>Este enlace expirará en 1 hora.</strong></p>
                    <p>Si no solicitaste este cambio, puedes ignorar este email y tu contraseña permanecerá sin cambios.</p>
                </div>
                <div class="footer">
                    <p>Este es un email automático, por favor no respondas.</p>
                    <p>&copy; 2024 Contafy. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Cuerpo de texto plano
        text_body = f"""
        Recuperación de Contraseña - Contafy
        
        Hola,
        
        Recibimos una solicitud para restablecer la contraseña de tu cuenta en Contafy.
        
        Haz clic en el siguiente enlace para restablecer tu contraseña:
        {reset_url}
        
        Este enlace expirará en 1 hora.
        
        Si no solicitaste este cambio, puedes ignorar este email y tu contraseña permanecerá sin cambios.
        
        Este es un email automático, por favor no respondas.
        © 2024 Contafy. Todos los derechos reservados.
        """

        return EmailService.send_email(email, subject, html_body, text_body)

