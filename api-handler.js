// =======================================
// WBR SISTEMA v3 - API HANDLER
// CONEXIÓN CON GOOGLE APPSCRIPT
// ⚠️ NO TOCAR ESTE ARCHIVO - CONEXIÓN CRÍTICA
// =======================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzkr-JLoKmkCk98B5PyhPyR1piOtOr0qUvAY9_9EymTc_cWm_Z7qRus4vFdKOg2quiN/exec';

/**
 * FUNCIÓN CRÍTICA - Realiza todas las llamadas a Google AppScript
 * @param {string} action - Acción a ejecutar en AppScript
 * @param {object} params - Parámetros adicionales
 * @returns {Promise<object>} Respuesta del servidor
 */
async function llamarAppScript(action, params = {}) {
    const body = new URLSearchParams({
        action: action,
        ...params
    });

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: body
        });
        const data = await response.json();
        return data;
    } catch(error) {
        console.error('Error en llamarAppScript:', error);
        return { exito: false, mensaje: 'Error de conexión con AppScript' };
    }
}
