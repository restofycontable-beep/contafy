// Servicio para interactuar con el backend de DIAN Automation
const AUTOMATION_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/dian-automation`;

const DianService = {
    async abrirPaginaLogin() {
        console.log("Llamando a DianService.abrirPaginaLogin()");
        try {
            const response = await fetch(`${AUTOMATION_BASE_URL}/abrir-login`, {
                method: 'POST',
            });
            const resultado = await response.json();
            console.log("Respuesta del backend:", resultado);
            return resultado;
        } catch (error) {
            return { success: false, message: error.message };
        }
    },
    async abrirTokenUrl(tokenUrl) {
        try {
            const response = await fetch("/api/dian-automation/abrir-token-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: tokenUrl })
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: error.message };
        }
    },
    async consultarDocumentosDIAN(tokenUrl, desde, hasta, tipo) {
        try {
            const response = await fetch("/api/dian-automation/consultar-documentos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: tokenUrl, desde, hasta, tipo })
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: error.message };
        }
    },
    async consultarDocumentos(tokenUrl, desde, hasta, tipo) {
        try {
            const response = await fetch(`${AUTOMATION_BASE_URL}/consultar-documentos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token_url: tokenUrl,
                    desde: desde,
                    hasta: hasta,
                    tipo: tipo
                }),
            });
            const resultado = await response.json();
            console.log("Respuesta del backend al consultar documentos:", resultado);
            return resultado;
        } catch (error) {
            console.error("Error consultando documentos:", error);
            return { success: false, message: error.message };
        }
    },
    async descargarDocumentosDIAN(tokenUrl, desde, hasta, tipo) {
        try {
            const response = await fetch("/api/dian-automation/descargar-documentos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: tokenUrl, desde, hasta, tipo })
            });
            
            if (response.ok) {
                // Crear un blob del archivo ZIP
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                
                // Crear un enlace temporal para descargar
                const a = document.createElement('a');
                a.href = url;
                a.download = `documentos_dian_${tipo}_${desde}_${hasta}.zip`;
                document.body.appendChild(a);
                a.click();
                
                // Limpiar
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                return { success: true, message: "Archivo ZIP descargado correctamente" };
            } else {
                const errorData = await response.json();
                return { success: false, message: errorData.detail || "Error al descargar" };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    },
    async cerrarSesion() {
        try {
            const response = await fetch(`${AUTOMATION_BASE_URL}/cerrar-sesion`, {
                method: 'POST',
            });
            const resultado = await response.json();
            console.log("Respuesta del backend al cerrar sesión:", resultado);
            return resultado;
        } catch (error) {
            return { success: false, message: error.message };
        }
    },
    async obtenerDocumentosRecientes(tipo = null, limit = 50) {
        try {
            const params = new URLSearchParams();
            if (tipo) params.append('tipo', tipo);
            if (limit) params.append('limit', limit);
            
            const response = await fetch(`${AUTOMATION_BASE_URL}/documentos-recientes?${params}`);
            const resultado = await response.json();
            console.log("Documentos recientes obtenidos:", resultado);
            return resultado;
        } catch (error) {
            console.error("Error obteniendo documentos recientes:", error);
            return { success: false, message: error.message };
        }
    },

    async obtenerEstadoProcesamiento() {
        try {
            const response = await fetch(`${AUTOMATION_BASE_URL}/estado-procesamiento`);
            const resultado = await response.json();
            console.log("Estado del procesamiento:", resultado);
            return resultado;
        } catch (error) {
            console.error("Error obteniendo estado del procesamiento:", error);
            return { success: false, message: error.message };
        }
    },

    // ...otros métodos del servicio...
};

export default DianService; 