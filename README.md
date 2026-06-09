# WBR Sistema v3 - Arquitectura Refactorizada

## 📁 Estructura de Archivos

```
proyecto/
├── index.html           ← SOLO estructura HTML (NO CSS, NO JS lógica)
├── styles.css           ← TODO el visual (colores, tamaños, estilos)
├── api-handler.js       ← CONEXIÓN CON GOOGLE APPSCRIPT (⚠️ PROTEGIDO)
├── app.js               ← TODA la lógica de UI y funciones
└── AppScript (Google)   ← Google Apps Script intacto
```

---

## 🎯 Responsabilidad de Cada Archivo

### **index.html** - Estructura Pura
- ✅ Define qué elementos HTML existen
- ✅ IDs, clases, estructura del DOM
- ✅ Referencia a CSS y JS
- ❌ NO tiene CSS embebido
- ❌ NO tiene lógica de conexión

**Cuándo editar:** Cuando necesites cambiar dónde están las cosas o agregar nuevos inputs

---

### **styles.css** - Visual Puro
- ✅ TODO el CSS: colores, tamaños, espacios, fuentes
- ✅ Animaciones, botones, tablas, tarjetas
- ❌ NUNCA afecta la lógica
- ❌ NUNCA toca Google Sheets

**Cuándo editar:** Cuando quieras cambiar colores, márgenes, padding, fuentes, etc.

---

### **api-handler.js** - Conexión Crítica ⚠️
```javascript
const APPS_SCRIPT_URL = '...';

async function llamarAppScript(action, params = {}) {
    // ⚠️ ESTE ARCHIVO NUNCA DEBE TOCARSE
    // Aquí va la conexión con Google AppScript
}
```

- ✅ URL del AppScript
- ✅ Función `llamarAppScript()` que conecta todo
- ❌ NO editar bajo ninguna circunstancia (a menos que cambies la URL)

**Cuándo editar:** Solo si cambias la URL del AppScript de Google

---

### **app.js** - Lógica de UI
- ✅ Funciones que manejan eventos (clicks, cambios)
- ✅ Funciones que llaman a `llamarAppScript()`
- ✅ Renderización de HTML dinámico
- ✅ Mensajes, validaciones
- ❌ NO tiene la URL del AppScript (está en api-handler.js)
- ❌ NO tiene CSS (está en styles.css)

**Cuándo editar:** Cuando necesites nueva funcionalidad o cambiar comportamientos

---

### **AppScript (Google)** - Intacto
- ✅ Lee/escribe en Google Sheets
- ✅ Todas las funciones de servidor
- ❌ NO editar desde aquí (editar en Google Sheets Script Editor)

---

## 🔄 Flujo de Datos

```
Usuario hace clic en botón
    ↓
HTML (index.html) captura evento
    ↓
app.js ejecuta función (validación, UI)
    ↓
api-handler.js llama a Google AppScript
    ↓
AppScript lee/escribe en Google Sheets
    ↓
Respuesta JSON vuelve a app.js
    ↓
app.js actualiza la UI con resultado
    ↓
styles.css lo hace verse bonito
```

---

## 📝 Cómo Hacer Cambios

### Cambio Visual (SEGURO)
```
"Hacé los botones más grandes y de color azul"

EDITAR: styles.css
❌ NO tocar: api-handler.js, app.js
```

### Cambio Funcional (VERIFICAR)
```
"Cuando el usuario hace clic en Guardar, 
quiero que se marque como completado"

EDITAR: index.html (si necesito nuevo botón)
EDITAR: app.js (nueva función para el evento)
EDITAR: AppScript (si necesito nueva lógica de servidor)
❌ NO tocar: api-handler.js
```

### Cambio de Estructura (CUIDADO)
```
"Quiero 2 columnas: vendedores | pendientes"

EDITAR: index.html (estructura HTML)
EDITAR: styles.css (grid/layout)
EDITAR: app.js (si necesito cargar pendientes dinámicamente)
❌ NO tocar: api-handler.js
```

---

## 🛡️ REGLA DE ORO

### Si cambias `styles.css`
→ app.js y api-handler.js permanecen intactos

### Si cambias `index.html` (estructura)
→ app.js puede necesitar actualización
→ api-handler.js NUNCA se toca

### Si cambias `app.js` (lógica)
→ index.html puede necesitar elementos nuevos
→ api-handler.js NUNCA se toca

### Si necesitas cambiar api-handler.js
→ Probablemente cambiaste la URL de AppScript
→ SOLO cambias la URL, nada más

---

## 💬 Prompts Correctos Para Cambios

### Ejemplo 1: Visual
```
CAMBIO VISUAL:
- Fondo de navbar: de gris a azul marino
- Botones: más redondeados, sombra más suave

SOLO: styles.css
NO TOCAR: app.js, api-handler.js
```

### Ejemplo 2: Funcional
```
NUEVA FUNCIONALIDAD:
- Cuando selecciono un mes, quiero ver vendedores automáticamente
- Las listas deben filtrarse por mes

EDITO:
- index.html: agregar un select para meses (si no existe)
- app.js: nueva función "cargarVendedoresPorMes()"

NO TOCO: api-handler.js
```

### Ejemplo 3: Estructura + Visual
```
REFACTOR DE LAYOUT:
- Cambiar a 2 columnas (izquierda: vendedores, derecha: pendientes)
- Vendedores en card, pendientes en lista

EDITO:
- index.html: estructura de 2 columnas
- styles.css: grid/flexbox para layout
- app.js: si necesito cargar dinámicamente

NO TOCO: api-handler.js
```

---

## ✅ Ventajas de Esta Arquitectura

1. **Seguridad:** La conexión está en su propio archivo, nunca se daña accidentalmente
2. **Claridad:** Cada archivo tiene una responsabilidad clara
3. **Mantenimiento:** Si algo se rompe, sabes exactamente dónde mirar
4. **Escalabilidad:** Puedes agregar más archivos (ej: `utils.js`, `validations.js`)
5. **Colaboración:** Diferentes personas pueden editar diferentes archivos sin conflictos

---

## 🚀 Próximos Pasos

1. **Copia estos 4 archivos** a tu proyecto
2. **Verifica que todo funcione** con la URL del AppScript
3. **Ahora puedes:**
   - Cambiar colores sin miedo
   - Agregar funcionalidad nuevas
   - Refactorizar UI
   - **Nunca más se romperá la conexión** 🎉

---

## 📞 Soporte

Si algo se rompe después de un cambio:
1. **¿Cambié CSS/HTML?** → Probablemente no es la conexión
2. **¿Cambié app.js?** → Verifica la sintaxis de JavaScript
3. **¿La conexión se rompió?** → Verifica que api-handler.js está intacto

---

**Última actualización:** Junio 2026
**Creado para:** Carlos (WBR Sistema v3)
