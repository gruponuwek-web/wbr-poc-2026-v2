// =======================================
// WBR SISTEMA v3 - APP.JS (Sheets)
// =======================================

let usuarioActual = 'Cargando...';
let vendedoresData = [];
let compromisosData = [];
let wbrHistorico = {};

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxV8fXIxW7stjX3I4Ysjh20VtPquQZgE6Y3MzcnNpHQCP_e3ZMsT9jPrruHOGudztsW/exec';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const SEMANAS_POR_MES = { 'Enero': 4, 'Febrero': 4, 'Marzo': 5, 'Abril': 4, 'Mayo': 5, 'Junio': 4, 'Julio': 5, 'Agosto': 4, 'Septiembre': 5, 'Octubre': 4, 'Noviembre': 5, 'Diciembre': 4 };

// =======================================
// DATOS DE PRUEBA (localStorage)
// =======================================

function inicializarDatos() {
    // Si ya existen datos, no reinicializar
    if (localStorage.getItem('wbr_vendedores')) return;
    
    // Vendedores de prueba
    const vendedores = [
        { id: '1', nombre: 'Hortencia Villa', estado: 'Activo' },
        { id: '2', nombre: 'Elizabeth Díaz', estado: 'Activo' },
        { id: '3', nombre: 'Amairani García', estado: 'Activo' },
        { id: '4', nombre: 'Adriana Casas', estado: 'Activo' },
        { id: '5', nombre: 'Itzel Hernández', estado: 'Activo' },
        { id: '6', nombre: 'Verónica Cruz', estado: 'Activo' }
    ];
    
    // Compromisos de prueba para Junio
    const compromisos = [
        { id: 'C1', mes: 'Junio', semana: 1, vendedor: 'Hortencia Villa', cliente: 'Cliente A', clasificacion: 'Propuesta', estado: 'Pendiente', fecha_creacion: new Date().toISOString() },
        { id: 'C2', mes: 'Junio', semana: 1, vendedor: 'Hortencia Villa', cliente: 'Cliente B', clasificacion: 'Seguimiento', estado: 'Pendiente', fecha_creacion: new Date().toISOString() },
        { id: 'C3', mes: 'Junio', semana: 2, vendedor: 'Hortencia Villa', cliente: 'Cliente C', clasificacion: 'Cierre', estado: 'Pendiente', fecha_creacion: new Date().toISOString() },
        { id: 'C4', mes: 'Junio', semana: 1, vendedor: 'Elizabeth Díaz', cliente: 'Cliente D', clasificacion: 'Propuesta', estado: 'Pendiente', fecha_creacion: new Date().toISOString() },
        { id: 'C5', mes: 'Junio', semana: 2, vendedor: 'Elizabeth Díaz', cliente: 'Cliente E', clasificacion: 'Seguimiento', estado: 'Pendiente', fecha_creacion: new Date().toISOString() },
        { id: 'C6', mes: 'Junio', semana: 3, vendedor: 'Amairani García', cliente: 'Cliente F', clasificacion: 'Propuesta', estado: 'Pendiente', fecha_creacion: new Date().toISOString() }
    ];
    
    // WBR sesiones
    const wbr = [
        { mes: 'Junio', semana: 1, estado: 'Pendiente', fecha_apertura: '', fecha_cierre: '', usuario: '' },
        { mes: 'Junio', semana: 2, estado: 'Pendiente', fecha_apertura: '', fecha_cierre: '', usuario: '' },
        { mes: 'Junio', semana: 3, estado: 'Pendiente', fecha_apertura: '', fecha_cierre: '', usuario: '' },
        { mes: 'Junio', semana: 4, estado: 'Pendiente', fecha_apertura: '', fecha_cierre: '', usuario: '' }
    ];
    
    // Guardar en localStorage
    localStorage.setItem('wbr_vendedores', JSON.stringify(vendedores));
    localStorage.setItem('wbr_compromisos', JSON.stringify(compromisos));
    localStorage.setItem('wbr_sesiones', JSON.stringify(wbr));
    localStorage.setItem('wbr_usuario', 'Cargando...');
    
    console.log('✅ Datos de prueba inicializados en localStorage');
}

// =======================================
// FETCH (conectado a Sheets, con fallback a localStorage)
// =======================================

async function llamarAppScript(action, params = {}) {
    // Construir URL con parámetros GET
    const urlParams = new URLSearchParams({
        action: action,
        ...params
    });
    
    const url = APPS_SCRIPT_URL + '?' + urlParams.toString();
    
    console.log(`📤 Llamando Apps Script: ${action}`, params);
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Respuesta (Sheets):', data);
        return data;
    } catch(error) {
        console.warn('⚠️  Apps Script falló, usando localStorage como fallback:', error.message);
        
        // FALLBACK A LOCALHOST
        return llamarLocalStorage(action, params);
    }
}

// Fallback a localStorage (datos de prueba)
function llamarLocalStorage(action, params = {}) {
    console.log(`📦 Usando localStorage para: ${action}`);
    
    try {
        switch(action) {
            case 'obtenerVendedores':
                return { exito: true, data: JSON.parse(localStorage.getItem('wbr_vendedores')) || [] };
            
            case 'obtenerCompromisos':
                const compromisos = JSON.parse(localStorage.getItem('wbr_compromisos')) || [];
                const filtrados = compromisos.filter(c => c.mes === params.mes);
                return { exito: true, data: filtrados };
            
            case 'obtenerWBR':
                const sesiones = JSON.parse(localStorage.getItem('wbr_sesiones')) || [];
                const sesionesDelMes = sesiones.filter(s => s.mes === params.mes);
                return { exito: true, data: sesionesDelMes };
            
            case 'actualizarEstadoCompromiso':
                const allCompromisos = JSON.parse(localStorage.getItem('wbr_compromisos')) || [];
                const compIndex = allCompromisos.findIndex(c => c.id === params.idCompromiso);
                if (compIndex !== -1) {
                    allCompromisos[compIndex].estado = params.completado === 'true' || params.completado === true ? 'Completado' : 'No Completado';
                    localStorage.setItem('wbr_compromisos', JSON.stringify(allCompromisos));
                    return { exito: true, mensaje: 'Estado actualizado (localStorage)' };
                }
                return { exito: false, mensaje: 'Compromiso no encontrado' };
            
            default:
                return { exito: false, mensaje: 'Acción no reconocida' };
        }
    } catch(error) {
        console.error('❌ Error en localStorage:', error);
        return { exito: false, mensaje: 'Error: ' + error.message };
    }
}

// =======================================
// INICIALIZACIÓN
// =======================================

window.addEventListener('DOMContentLoaded', () => {
    inicializarDatos();
    cargarDatos();
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);
});

function actualizarFechaHora() {
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const año = now.getFullYear();
    const hora = String(now.getHours()).padStart(2, '0');
    const minuto = String(now.getMinutes()).padStart(2, '0');
    
    const el = document.getElementById('fechaHora');
    if (el) el.textContent = `${dia}/${mes}/${año} ${hora}:${minuto}`;
}

function cargarDatos() {
    cargarVendedores();
    cargarWBRHistorico();
}

// =======================================
// VENDEDORES
// =======================================

async function cargarVendedores() {
    const result = await llamarAppScript('obtenerVendedores');
    if (result.exito) {
        vendedoresData = result.data || [];
        console.log('✅ Vendedores cargados:', vendedoresData);
    } else {
        console.error('❌ Error cargando vendedores:', result.mensaje);
        vendedoresData = [];
    }
}

// =======================================
// WBR - CARGAR HISTÓRICO
// =======================================

async function cargarWBRHistorico() {
    // Solo carga Junio (mes actual)
    cargarSesionesActuales();
}

// =======================================
// WBR - CARGAR Y RENDERIZAR SESIONES
// =======================================

async function cargarSesionesActuales() {
    // Solo carga sesiones que existen (actualmente Junio)
    const result = await llamarAppScript('obtenerWBR', { mes: 'Junio' });
    
    if (result.exito && result.data) {
        const sesiones = result.data;
        renderizarHeaderWBR(sesiones);
        renderizarSesiones(sesiones);
    } else {
        // Fallback: usa datos de localStorage
        const sesionesLocal = JSON.parse(localStorage.getItem('wbr_sesiones')) || [];
        renderizarHeaderWBR(sesionesLocal);
        renderizarSesiones(sesionesLocal);
    }
}

function renderizarHeaderWBR(sesiones) {
    const container = document.getElementById('timelineMeses');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Obtener la sesión activa más reciente
    const activas = sesiones.filter(s => s.estado !== 'Cerrada');
    const sesionActual = activas.length > 0 ? activas[activas.length - 1] : null;
    
    // Header con info del mes y botón
    const header = document.createElement('div');
    header.style.background = 'white';
    header.style.padding = '15px 20px';
    header.style.borderRadius = '5px';
    header.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '20px';
    
    // Lado izquierdo: Info del mes y semana
    const info = document.createElement('div');
    if (sesionActual) {
        info.innerHTML = `<h3 style="color: #2c3e50; margin: 0; font-size: 16px;">📅 ${sesionActual.mes} - Semana ${sesionActual.semana}</h3>`;
    } else {
        info.innerHTML = `<h3 style="color: #2c3e50; margin: 0; font-size: 16px;">📅 Junio</h3>`;
    }
    
    // Lado derecho: Botón
    const btnCrear = document.createElement('button');
    btnCrear.innerHTML = '➕ Crear Sesión';
    btnCrear.style.padding = '10px 20px';
    btnCrear.style.background = '#27ae60';
    btnCrear.style.color = 'white';
    btnCrear.style.border = 'none';
    btnCrear.style.borderRadius = '5px';
    btnCrear.style.cursor = 'pointer';
    btnCrear.style.fontWeight = 'bold';
    btnCrear.style.fontSize = '13px';
    btnCrear.onclick = () => crearNuevaSesion();
    
    header.appendChild(info);
    header.appendChild(btnCrear);
    container.appendChild(header);
}

function renderizarSesiones(sesiones) {
    const container = document.getElementById('wbrAccordionContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Botón crear sesión
    const btnCrear = document.createElement('button');
    btnCrear.innerHTML = '➕ Crear Sesión';
    btnCrear.style.padding = '12px 20px';
    btnCrear.style.background = '#27ae60';
    btnCrear.style.color = 'white';
    btnCrear.style.border = 'none';
    btnCrear.style.borderRadius = '5px';
    btnCrear.style.cursor = 'pointer';
    btnCrear.style.fontWeight = 'bold';
    btnCrear.style.marginBottom = '20px';
    btnCrear.style.fontSize = '14px';
    btnCrear.onclick = () => crearNuevaSesion();
    container.appendChild(btnCrear);
    
    // Separar activas y cerradas
    const activas = sesiones.filter(s => s.estado !== 'Cerrada');
    const cerradas = sesiones.filter(s => s.estado === 'Cerrada');
    
    // SECCIÓN 1: Sesión Activa (la más reciente, abierta por defecto)
    if (activas.length > 0) {
        // Tomar la última sesión activa (la más reciente)
        const sesionActual = activas[activas.length - 1];
        
        const seccionActiva = document.createElement('div');
        seccionActiva.style.marginBottom = '30px';
        seccionActiva.style.background = 'white';
        seccionActiva.style.borderRadius = '5px';
        seccionActiva.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        seccionActiva.style.overflow = 'hidden';
        
        // Header de la sesión activa
        const headerActiva = document.createElement('div');
        headerActiva.style.background = '#2c3e50';
        headerActiva.style.color = 'white';
        headerActiva.style.padding = '15px 20px';
        headerActiva.style.fontWeight = 'bold';
        headerActiva.style.cursor = 'pointer';
        headerActiva.style.display = 'flex';
        headerActiva.style.justifyContent = 'space-between';
        headerActiva.style.alignItems = 'center';
        headerActiva.innerHTML = `
            <span>📌 Semana ${sesionActual.semana} [${sesionActual.estado}]</span>
            <span style="font-size: 12px;">▲</span>
        `;
        
        const contenidoActiva = document.createElement('div');
        contenidoActiva.style.padding = '20px';
        contenidoActiva.style.display = 'block'; // Abierto por defecto
        
        // Aquí irán los acordeones de vendedoras
        const acordeonesMes = document.createElement('div');
        acordeonesMes.id = `acordeones-vendedoras-${sesionActual.semana}`;
        contenidoActiva.appendChild(acordeonesMes);
        
        // Toggle para abrir/cerrar
        headerActiva.onclick = () => {
            const isOpen = contenidoActiva.style.display !== 'none';
            contenidoActiva.style.display = isOpen ? 'none' : 'block';
            headerActiva.querySelector('span:last-child').textContent = isOpen ? '▼' : '▲';
        };
        
        seccionActiva.appendChild(headerActiva);
        seccionActiva.appendChild(contenidoActiva);
        container.appendChild(seccionActiva);
        
        // Cargar acordeones de vendedoras para esta sesión
        cargarAcordeonesPorSemana(sesionActual.mes, sesionActual.semana, acordeonesMes);
    } else {
        const empty = document.createElement('p');
        empty.textContent = 'No hay sesiones activas';
        empty.style.color = '#999';
        empty.style.marginBottom = '20px';
        container.appendChild(empty);
    }
    
    // SECCIÓN 2: Sesiones Anteriores (acordeón)
    if (cerradas.length > 0) {
        const seccionAnterior = document.createElement('div');
        seccionAnterior.style.marginTop = '20px';
        seccionAnterior.style.background = 'white';
        seccionAnterior.style.borderRadius = '5px';
        seccionAnterior.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        seccionAnterior.style.overflow = 'hidden';
        
        const headerAnterior = document.createElement('div');
        headerAnterior.style.background = '#ecf0f1';
        headerAnterior.style.padding = '15px 20px';
        headerAnterior.style.cursor = 'pointer';
        headerAnterior.style.fontWeight = 'bold';
        headerAnterior.style.display = 'flex';
        headerAnterior.style.justifyContent = 'space-between';
        headerAnterior.style.alignItems = 'center';
        headerAnterior.style.userSelect = 'none';
        headerAnterior.innerHTML = `
            <span>📂 Sesiones Anteriores (${cerradas.length})</span>
            <span style="font-size: 12px;">▼</span>
        `;
        
        const contenidoAnterior = document.createElement('div');
        contenidoAnterior.style.display = 'none'; // Cerrado por defecto
        contenidoAnterior.style.padding = '20px';
        
        const gridAnterior = document.createElement('div');
        gridAnterior.style.display = 'flex';
        gridAnterior.style.flexDirection = 'column';
        gridAnterior.style.gap = '10px';
        
        cerradas.forEach(sesion => {
            const card = document.createElement('div');
            card.style.background = '#f9f9f9';
            card.style.padding = '12px';
            card.style.borderRadius = '4px';
            card.style.borderLeft = '4px solid #95a5a6';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            
            const info = document.createElement('div');
            info.innerHTML = `
                <h4 style="color: #2c3e50; margin: 0; font-size: 13px;">Semana ${sesion.semana}</h4>
                <small style="color: #999;">Estado: Cerrada</small>
            `;
            
            const btnPDF = document.createElement('button');
            btnPDF.textContent = 'PDF';
            btnPDF.style.padding = '6px 12px';
            btnPDF.style.background = '#3498db';
            btnPDF.style.color = 'white';
            btnPDF.style.border = 'none';
            btnPDF.style.borderRadius = '4px';
            btnPDF.style.cursor = 'pointer';
            btnPDF.style.fontSize = '11px';
            
            card.appendChild(info);
            card.appendChild(btnPDF);
            gridAnterior.appendChild(card);
        });
        
        contenidoAnterior.appendChild(gridAnterior);
        
        headerAnterior.onclick = () => {
            const isOpen = contenidoAnterior.style.display !== 'none';
            contenidoAnterior.style.display = isOpen ? 'none' : 'block';
            headerAnterior.querySelector('span:last-child').textContent = isOpen ? '▼' : '▲';
        };
        
        seccionAnterior.appendChild(headerAnterior);
        seccionAnterior.appendChild(contenidoAnterior);
        container.appendChild(seccionAnterior);
    }
}

async function cargarAcordeonesPorSemana(mes, semana, container) {
    // Cargar compromisos del mes
    const resultCompromisos = await llamarAppScript('obtenerCompromisos', { mes: mes });
    const compromisos = resultCompromisos.exito ? resultCompromisos.data : [];
    
    // Filtrar solo compromisos de esta semana
    const compromisosDelaMes = compromisos.filter(c => c.semana === semana || !c.semana);
    
    console.log(`Cargando acordeones para ${mes} - Semana ${semana}:`, compromisosDelaMes);
    
    // Generar acordeones de vendedores
    const vendedoresActivos = vendedoresData.filter(v => v.estado === 'Activo');
    
    vendedoresActivos.forEach(vendedor => {
        // Filtrar compromisos de este vendedor
        const compromisosDelVendedor = compromisosDelaMes.filter(c => c.vendedor === vendedor.nombre);
        
        const item = document.createElement('div');
        item.style.background = '#f9f9f9';
        item.style.borderLeft = '4px solid #2c3e50';
        item.style.borderRadius = '5px';
        item.style.overflow = 'hidden';
        item.style.marginBottom = '10px';
        
        const header = document.createElement('div');
        header.style.background = '#2c3e50';
        header.style.color = 'white';
        header.style.padding = '15px';
        header.style.cursor = 'pointer';
        header.style.fontWeight = 'bold';
        header.style.userSelect = 'none';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        
        const headerLeft = document.createElement('span');
        headerLeft.textContent = `👤 ${vendedor.nombre}`;
        
        const headerRight = document.createElement('span');
        headerRight.style.fontSize = '12px';
        headerRight.style.fontWeight = 'normal';
        const cumplidos = compromisosDelVendedor.filter(c => c.estado === 'Completado').length;
        const total = compromisosDelVendedor.length;
        headerRight.textContent = `(${cumplidos}/${total} compromisos) ▼`;
        
        header.appendChild(headerLeft);
        header.appendChild(headerRight);
        
        const content = document.createElement('div');
        content.className = 'wbr-content';
        content.style.display = 'none';
        content.style.padding = '15px';
        content.style.background = 'white';
        
        // PASO 1: Compromisos
        const paso1 = document.createElement('div');
        paso1.style.marginBottom = '15px';
        paso1.innerHTML = '<h4 style="color: #2c3e50; margin-bottom: 10px;">1️⃣ Compromisos</h4>';
        
        if (compromisosDelVendedor.length === 0) {
            paso1.innerHTML += '<p style="color: #999; font-size: 12px;">No hay compromisos para este mes</p>';
        } else {
            const listaPaso1 = document.createElement('div');
            compromisosDelVendedor.forEach(comp => {
                const compItem = document.createElement('div');
                compItem.style.background = '#f0f0f0';
                compItem.style.padding = '10px';
                compItem.style.borderRadius = '5px';
                compItem.style.marginBottom = '8px';
                compItem.style.display = 'flex';
                compItem.style.justifyContent = 'space-between';
                compItem.style.alignItems = 'center';
                compItem.style.fontSize = '13px';
                
                const compInfo = document.createElement('div');
                compInfo.style.flex = '1';
                compInfo.innerHTML = `
                    <strong style="color: #2c3e50;">${comp.cliente}</strong><br/>
                    <small style="color: #666;">${comp.clasificacion}</small>
                `;
                
                const compEstado = document.createElement('div');
                compEstado.style.display = 'flex';
                compEstado.style.gap = '5px';
                
                // Botón ✓ (Completado)
                const btnCompletado = document.createElement('button');
                btnCompletado.textContent = '✓';
                btnCompletado.style.width = '30px';
                btnCompletado.style.height = '30px';
                btnCompletado.style.border = '2px solid #27ae60';
                btnCompletado.style.borderRadius = '50%';
                btnCompletado.style.cursor = 'pointer';
                btnCompletado.style.background = comp.estado === 'Completado' ? '#27ae60' : 'white';
                btnCompletado.style.color = comp.estado === 'Completado' ? 'white' : '#27ae60';
                btnCompletado.style.fontWeight = 'bold';
                btnCompletado.onclick = () => cambiarEstadoCompromiso(comp.id, 'Completado', btnCompletado);
                
                // Botón ✗ (No Completado)
                const btnNoCompletado = document.createElement('button');
                btnNoCompletado.textContent = '✗';
                btnNoCompletado.style.width = '30px';
                btnNoCompletado.style.height = '30px';
                btnNoCompletado.style.border = '2px solid #e74c3c';
                btnNoCompletado.style.borderRadius = '50%';
                btnNoCompletado.style.cursor = 'pointer';
                btnNoCompletado.style.background = comp.estado === 'No Completado' ? '#e74c3c' : 'white';
                btnNoCompletado.style.color = comp.estado === 'No Completado' ? 'white' : '#e74c3c';
                btnNoCompletado.style.fontWeight = 'bold';
                btnNoCompletado.onclick = () => cambiarEstadoCompromiso(comp.id, 'No Completado', btnNoCompletado);
                
                compEstado.appendChild(btnCompletado);
                compEstado.appendChild(btnNoCompletado);
                
                compItem.appendChild(compInfo);
                compItem.appendChild(compEstado);
                listaPaso1.appendChild(compItem);
            });
            paso1.appendChild(listaPaso1);
        }
        
        content.appendChild(paso1);
        
        // PASO 2 y 3 (placeholders por ahora)
        const paso2 = document.createElement('div');
        paso2.innerHTML = '<h4 style="color: #2c3e50; margin-top: 15px; margin-bottom: 10px;">2️⃣ Descubrimientos</h4><p style="color: #999; font-size: 12px;">[Por implementar]</p>';
        content.appendChild(paso2);
        
        const paso3 = document.createElement('div');
        paso3.innerHTML = '<h4 style="color: #2c3e50; margin-top: 15px; margin-bottom: 10px;">3️⃣ Acciones</h4><p style="color: #999; font-size: 12px;">[Por implementar]</p>';
        content.appendChild(paso3);
        
        header.onclick = (e) => {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
            headerRight.textContent = content.style.display === 'none' ? `(${cumplidos}/${total} compromisos) ▼` : `(${cumplidos}/${total} compromisos) ▲`;
        };
        
        item.appendChild(header);
        item.appendChild(content);
        container.appendChild(item);
    });
}

function crearNuevaSesion() {
    // TODO: Implementar formulario para crear nueva sesión
    alert('Crear nueva sesión - Por implementar');
    console.log('Crear nueva sesión');
}

// =======================================
// WBR - ABRIR SESIÓN CON ACORDEONES
// =======================================

async function abrirSesionWBR(mes, semana) {
    console.log(`Abriendo sesión: ${mes} - Semana ${semana}`);
    
    const wbrSection = document.getElementById('wbr');
    if (!wbrSection) return;
    
    // Crear sección de vendedores
    let vendedoresSection = document.getElementById('wbrVendedoresSection');
    if (!vendedoresSection) {
        vendedoresSection = document.createElement('div');
        vendedoresSection.id = 'wbrVendedoresSection';
        vendedoresSection.style.marginTop = '40px';
        wbrSection.appendChild(vendedoresSection);
    }
    
    vendedoresSection.style.display = 'block';
    vendedoresSection.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #2c3e50; margin: 0;">📅 ${mes} - Semana ${semana}</h3>
                <button onclick="cerrarVendedoresWBR()" style="padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">← Volver</button>
            </div>
            <div id="wbrVendedoresAccordion" style="display: flex; flex-direction: column; gap: 15px;"></div>
        </div>
    `;
    
    // Cargar compromisos
    const resultCompromisos = await llamarAppScript('obtenerCompromisos', { mes: mes });
    const compromisos = resultCompromisos.exito ? resultCompromisos.data : [];
    console.log('Compromisos cargados:', compromisos);
    
    // Generar acordeones de vendedores
    const vendedoresActivos = vendedoresData.filter(v => v.estado === 'Activo');
    const vendedoresAccordion = document.getElementById('wbrVendedoresAccordion');
    
    vendedoresActivos.forEach(vendedor => {
        // Filtrar compromisos de este vendedor
        const compromisosDelVendedor = compromisos.filter(c => c.vendedor === vendedor.nombre);
        
        const item = document.createElement('div');
        item.style.background = '#f9f9f9';
        item.style.borderLeft = '4px solid #2c3e50';
        item.style.borderRadius = '5px';
        item.style.overflow = 'hidden';
        item.style.marginBottom = '10px';
        
        const header = document.createElement('div');
        header.style.background = '#2c3e50';
        header.style.color = 'white';
        header.style.padding = '15px';
        header.style.cursor = 'pointer';
        header.style.fontWeight = 'bold';
        header.style.userSelect = 'none';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        
        const headerLeft = document.createElement('span');
        headerLeft.textContent = `👤 ${vendedor.nombre}`;
        
        const headerRight = document.createElement('span');
        headerRight.style.fontSize = '12px';
        headerRight.style.fontWeight = 'normal';
        const cumplidos = compromisosDelVendedor.filter(c => c.estado === 'Completado').length;
        const total = compromisosDelVendedor.length;
        headerRight.textContent = `(${cumplidos}/${total} compromisos)`;
        
        header.appendChild(headerLeft);
        header.appendChild(headerRight);
        
        const content = document.createElement('div');
        content.className = 'wbr-content';
        content.style.display = 'none';
        content.style.padding = '15px';
        content.style.background = 'white';
        
        // PASO 1: Compromisos
        const paso1 = document.createElement('div');
        paso1.style.marginBottom = '15px';
        paso1.innerHTML = '<h4 style="color: #2c3e50; margin-bottom: 10px;">1️⃣ Compromisos</h4>';
        
        if (compromisosDelVendedor.length === 0) {
            paso1.innerHTML += '<p style="color: #999; font-size: 12px;">No hay compromisos para este mes</p>';
        } else {
            const listaPaso1 = document.createElement('div');
            compromisosDelVendedor.forEach(comp => {
                const compItem = document.createElement('div');
                compItem.style.background = '#f0f0f0';
                compItem.style.padding = '10px';
                compItem.style.borderRadius = '5px';
                compItem.style.marginBottom = '8px';
                compItem.style.display = 'flex';
                compItem.style.justifyContent = 'space-between';
                compItem.style.alignItems = 'center';
                compItem.style.fontSize = '13px';
                
                const compInfo = document.createElement('div');
                compInfo.style.flex = '1';
                compInfo.innerHTML = `
                    <strong style="color: #2c3e50;">${comp.cliente}</strong><br/>
                    <small style="color: #666;">${comp.clasificacion}</small>
                `;
                
                const compEstado = document.createElement('div');
                compEstado.style.display = 'flex';
                compEstado.style.gap = '5px';
                
                // Botón ✓ (Completado)
                const btnCompletado = document.createElement('button');
                btnCompletado.textContent = '✓';
                btnCompletado.style.width = '30px';
                btnCompletado.style.height = '30px';
                btnCompletado.style.border = '2px solid #27ae60';
                btnCompletado.style.borderRadius = '50%';
                btnCompletado.style.cursor = 'pointer';
                btnCompletado.style.background = comp.estado === 'Completado' ? '#27ae60' : 'white';
                btnCompletado.style.color = comp.estado === 'Completado' ? 'white' : '#27ae60';
                btnCompletado.style.fontWeight = 'bold';
                btnCompletado.onclick = () => cambiarEstadoCompromiso(comp.id, 'Completado', btnCompletado);
                
                // Botón ✗ (No Completado)
                const btnNoCompletado = document.createElement('button');
                btnNoCompletado.textContent = '✗';
                btnNoCompletado.style.width = '30px';
                btnNoCompletado.style.height = '30px';
                btnNoCompletado.style.border = '2px solid #e74c3c';
                btnNoCompletado.style.borderRadius = '50%';
                btnNoCompletado.style.cursor = 'pointer';
                btnNoCompletado.style.background = comp.estado === 'No Completado' ? '#e74c3c' : 'white';
                btnNoCompletado.style.color = comp.estado === 'No Completado' ? 'white' : '#e74c3c';
                btnNoCompletado.style.fontWeight = 'bold';
                btnNoCompletado.onclick = () => cambiarEstadoCompromiso(comp.id, 'No Completado', btnNoCompletado);
                
                compEstado.appendChild(btnCompletado);
                compEstado.appendChild(btnNoCompletado);
                
                compItem.appendChild(compInfo);
                compItem.appendChild(compEstado);
                listaPaso1.appendChild(compItem);
            });
            paso1.appendChild(listaPaso1);
        }
        
        content.appendChild(paso1);
        
        // PASO 2 y 3 (placeholders por ahora)
        const paso2 = document.createElement('div');
        paso2.innerHTML = '<h4 style="color: #2c3e50; margin-top: 15px; margin-bottom: 10px;">2️⃣ Descubrimientos</h4><p style="color: #999; font-size: 12px;">[Por implementar]</p>';
        content.appendChild(paso2);
        
        const paso3 = document.createElement('div');
        paso3.innerHTML = '<h4 style="color: #2c3e50; margin-top: 15px; margin-bottom: 10px;">3️⃣ Acciones</h4><p style="color: #999; font-size: 12px;">[Por implementar]</p>';
        content.appendChild(paso3);
        
        header.onclick = (e) => {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        };
        
        item.appendChild(header);
        item.appendChild(content);
        vendedoresAccordion.appendChild(item);
    });
    
    // Scroll a la sección
    setTimeout(() => {
        vendedoresSection.scrollIntoView({ behavior: 'smooth' });
    }, 500);
}

function cerrarVendedoresWBR() {
    const vendedoresSection = document.getElementById('wbrVendedoresSection');
    if (vendedoresSection) {
        vendedoresSection.style.display = 'none';
        vendedoresSection.innerHTML = '';
    }
}

async function cambiarEstadoCompromiso(idCompromiso, nuevoEstado, btnActual) {
    console.log(`Actualizando compromiso ${idCompromiso} a estado: ${nuevoEstado}`);
    
    // Cambiar visualización del botón
    btnActual.style.background = '#2c3e50';
    btnActual.style.color = 'white';
    
    // Limpiar otros botones en el mismo grupo
    const parent = btnActual.parentElement;
    parent.querySelectorAll('button').forEach(btn => {
        if (btn !== btnActual) {
            btn.style.background = 'white';
            btn.style.color = btn.textContent === '✓' ? '#27ae60' : '#e74c3c';
        }
    });
    
    // Guardar en localStorage
    const result = await llamarAppScript('actualizarEstadoCompromiso', { 
        idCompromiso: idCompromiso, 
        completado: nuevoEstado === 'Completado' ? true : false
    });
    
    console.log('Resultado:', result);
    if (!result.exito) {
        alert('Error al guardar: ' + result.mensaje);
    }
}

// =======================================
// SECCIONES (UI)
// =======================================

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');

    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    if (event?.target) event.target.classList.add('active');

    if (sectionId === 'wbr') {
        cargarWBRHistorico();
    }
}
