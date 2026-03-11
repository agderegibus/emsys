// Configuración centralizada de la aplicación
// En desarrollo usa localhost, en producción usa VITE_API_URL

export const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
