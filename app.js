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
// FETCH (conectado a Sheets vía Apps Script)
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
        console.log('✅ Respuesta:', data);
        return data;
    } catch(error) {
        console.error('❌ Error en fetch:', error);
        return { exito: false, mensaje: 'Error de conexión: ' + error.message };
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
    wbrHistorico = {};
    
    for (const mes of MESES) {
        const result = await llamarAppScript('obtenerWBR', { mes: mes });
        if (result.exito && result.data) {
            wbrHistorico[mes] = result.data;
        } else {
            wbrHistorico[mes] = [];
        }
    }
    
    console.log('✅ WBR histórico cargado:', wbrHistorico);
    generarAcordeones();
}

// =======================================
// WBR - SESIONES (GRID)
// =======================================

function generarAcordeones() {
    const container = document.getElementById('wbrAccordionContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Obtener el mes actualmente seleccionado
    const mesActivo = document.querySelector('.mes-item.active .mes-label')?.textContent;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const MESES_COMPLETOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesIndex = meses.indexOf(mesActivo);
    const mesCompleto = MESES_COMPLETOS[mesIndex] || 'Junio';
    
    // Obtener número de semanas del mes PRIMERO
    const semanasDelMes = SEMANAS_POR_MES[mesCompleto] || 4;
    let sesionesGeneradas = 0;
    
    // Crear grid para las sesiones
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(' + semanasDelMes + ', 1fr)';
    grid.style.gap = '20px';
    
    // Generar una sesión por cada semana del mes
    for (let semana = 1; semana <= semanasDelMes; semana++) {
        // Buscar sesión existente o crear una por defecto
        const sesionExistente = wbrHistorico[mesCompleto]?.find(w => w.semana === semana);
        const sesion = sesionExistente || {
            mes: mesCompleto,
            semana: semana,
            estado: 'Pendiente',
            fecha_apertura: '',
            fecha_cierre: ''
        };
        
        const card = document.createElement('div');
        card.style.background = 'white';
        card.style.padding = '20px';
        card.style.borderRadius = '8px';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        card.style.borderLeft = '4px solid #667eea';
        card.style.cursor = 'pointer';
        card.style.transition = 'all 0.3s';
        card.onmouseover = () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
        };
        card.onmouseout = () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        };
        
        // Determinar color del estado
        let colorEstado = '#667eea';
        if (sesion.estado === 'Cerrada') colorEstado = '#e74c3c';
        else if (sesion.estado === 'Abierta') colorEstado = '#27ae60';
        else if (sesion.estado === 'Pendiente') colorEstado = '#f39c12';
        
        card.innerHTML = `
            <div style="margin-bottom: 15px;">
                <h4 style="color: #2c3e50; margin-bottom: 5px; font-size: 16px;">Semana ${sesion.semana}</h4>
                <span style="display: inline-block; background: ${colorEstado}; color: white; padding: 4px 10px; border-radius: 15px; font-size: 11px; font-weight: bold;">${sesion.estado}</span>
            </div>
            <div style="color: #666; font-size: 13px; margin-bottom: 15px;">
                <p style="margin-bottom: 8px;"><strong>Compromisos:</strong> Por cargar</p>
                <div style="width: 100%; height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;">
                    <div style="width: 50%; height: 100%; background: #27ae60;"></div>
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn-success" style="flex: 1; padding: 8px; border: none; border-radius: 5px; cursor: pointer; font-size: 12px; font-weight: bold; background: #2c3e50; color: white;" onclick="abrirSesionWBR('${sesion.mes}', ${sesion.semana})">Abrir</button>
                ${sesion.estado === 'Cerrada' ? '<button class="btn-success" style="flex: 1; padding: 8px; border: none; border-radius: 5px; cursor: pointer; font-size: 12px; font-weight: bold; background: #3498db; color: white;" onclick="descargarPDFWBR(\'${sesion.mes}\', ${sesion.semana})">PDF</button>' : ''}
            </div>
        `;
        
        grid.appendChild(card);
        sesionesGeneradas++;
    }
    
    if (sesionesGeneradas === 0) {
        container.innerHTML = '<p style="color: #666; padding: 20px;">No hay sesiones WBR para este mes</p>';
    } else {
        container.appendChild(grid);
    }
}

// =======================================
// WBR - TIMELINE
// =======================================

function renderizarTimeline() {
    const container = document.getElementById('timelineMeses');
    if (!container) return;
    
    container.innerHTML = '';
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    meses.forEach((mes, index) => {
        const item = document.createElement('div');
        item.className = 'mes-item';
        if (index === 5) item.classList.add('active'); // Junio por defecto
        
        item.innerHTML = `
            <div class="mes-circle">${index + 1}</div>
            <div class="mes-label">${mes}</div>
        `;
        
        item.onclick = () => cambiarMesTimeline(mes, item);
        container.appendChild(item);
    });
}

function cambiarMesTimeline(mes, element) {
    document.querySelectorAll('.mes-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    generarAcordeones();
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
        renderizarTimeline();
        cargarWBRHistorico();
    }
}
