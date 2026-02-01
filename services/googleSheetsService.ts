import { ApiResponse } from '../types';

/**
 * IMPORTANTE: Pega aquí la URL de tu "Aplicación Web" generada en Apps Script.
 * Asegúrate de haber desplegado como:
 * 1. "Ejecutar como": Yo (Me)
 * 2. "Quién tiene acceso": Cualquiera (Anyone)
 */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxn-1dnjmKu5oaiot--7KJAnmcNHlOyf4GHZBGt2p_4wtVklJSJFNMG6RReNic8SiawJg/exec'; 

export const submitToGoogleSheets = async (data: Record<string, string>): Promise<ApiResponse> => {
  if (GOOGLE_SCRIPT_URL.includes('TU_URL_AQUI')) {
    return {
      status: 'error',
      message: 'Error de configuración: URL del script no definida.'
    };
  }

  try {
    // TRUCO TÉCNICO: Usamos 'text/plain' en lugar de 'application/json'.
    // Esto evita que el navegador haga una verificación de seguridad estricta (CORS Preflight)
    // que Google Apps Script suele rechazar. El script de Google igual entenderá el JSON.
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Modo "disparar y olvidar". No podemos leer la respuesta, pero asegura el envío.
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', 
      },
      body: JSON.stringify(data),
    });

    // Al usar no-cors, no recibimos respuesta real del servidor.
    // Asumimos éxito si no hubo error de red.
    return {
      status: 'success',
      message: '¡Inscripción enviada correctamente!'
    };
  } catch (error) {
    console.error("Error en el envío:", error);
    return {
      status: 'error',
      message: 'Error de conexión. Intenta nuevamente.'
    };
  }
};

export const fetchCoursesFromSheet = async (): Promise<string[]> => {
  if (GOOGLE_SCRIPT_URL.includes('TU_URL_AQUI')) return [];

  try {
    const cacheBuster = new Date().getTime();
    const urlWithCacheBuster = `${GOOGLE_SCRIPT_URL}?t=${cacheBuster}`;

    const response = await fetch(urlWithCacheBuster, {
      method: 'GET'
    });
    
    const data = await response.json();
    if (data.status === 'success' && data.courses) {
      return data.courses;
    }
    return [];
  } catch (error) {
    console.error("Error obteniendo cursos:", error);
    return [];
  }
};