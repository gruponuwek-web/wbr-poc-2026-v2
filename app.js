// =======================================
// WBR SISTEMA v3 - APP.JS COMPLETO
// =======================================

let usuarioActual = 'Coordinador';
let vendedoresData = [];

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// =======================================
// INICIALIZACIÓN
// =======================================

window.addEventListener('DOMContentLoaded', () => {
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 60000);
    cargarDatos();
});

// =======================================
// FUNCIONES PRINCIPALES
// =======================================

function actualizarFechaHora() {
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const año = now.getFullYear();
    const hora = String(now.getHours()).padStart(2, '0');
    const minuto = String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('fechaHora').textContent = `${dia}/${mes}/${año} ${hora}:${minuto}`;
}

function cargarDatos() {
    cargarVendedores();
    loadDashboard();
}

function cargarVendedores() {
    llamarAppScript('obtenerVendedores', {}).then(vendedores => {
        vendedoresData = vendedores;
        cargarVendedoresEnCompromiso();
    });
}

function cargarVendedoresEnCompromiso() {
    const select = document.getElementById('comp_vendedor');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Seleccionar --</option>';
    vendedoresData.forEach(v => {
        if (v.estado === 'Activo') {
            const option = document.createElement('option');
            option.value = v.nombre;
            option.textContent = v.nombre;
            select.appendChild(option);
        }
    });
}

function loadDashboard() {
    llamarAppScript('obtenerCompromisos', { mes: 'Junio' }).then(compromisos => {
        const total = compromisos.length;
        const completados = compromisos.filter(c => c.estado === 'Completado').length;
        
        const prospección = compromisos.filter(c => c.clasificacion === 'Prospección');
        const prospCompletados = prospección.filter(c => c.estado === 'Completado').length;
        
        const crecimiento = compromisos.filter(c => c.clasificacion === 'Crecimiento');
        const crecCompletados = crecimiento.filter(c => c.estado === 'Completado').length;
        
        const recuperado = compromisos.filter(c => c.clasificacion === 'Recuperado');
        const recupCompletados = recuperado.filter(c => c.estado === 'Completado').length;
        
        const porcCompletados = total > 0 ? Math.round((completados / total) * 100) : 0;
        const porcProsp = prospección.length > 0 ? Math.round((prospCompletados / prospección.length) * 100) : 0;
        const porcCrecim = crecimiento.length > 0 ? Math.round((crecCompletados / crecimiento.length) * 100) : 0;
        const porcRecup = recuperado.length > 0 ? Math.round((recupCompletados / recuperado.length) * 100) : 0;
        
        const html = `
            <div class="dashboard-card total">
                <h3>Compromisos Total</h3>
                <div class="big-number">${completados}/${total}</div>
                <div class="percentage">${porcCompletados}%</div>
            </div>
            <div class="dashboard-card prospección">
                <h3>Prospección</h3>
                <div class="big-number">${prospCompletados}/${prospección.length}</div>
                <div class="percentage">${porcProsp}%</div>
            </div>
            <div class="dashboard-card crecimiento">
                <h3>Crecimiento</h3>
                <div class="big-number">${crecCompletados}/${crecimiento.length}</div>
                <div class="percentage">${porcCrecim}%</div>
            </div>
            <div class="dashboard-card recuperado">
                <h3>Recuperados</h3>
                <div class="big-number">${recupCompletados}/${recuperado.length}</div>
                <div class="percentage">${porcRecup}%</div>
            </div>
        `;
        
        document.getElementById('dashboardContent').innerHTML = html;
    });
}

function cargarCompromisos() {
    const mes = document.getElementById('comp_mes').value;
    const estado = document.getElementById('comp_filtro_estado').value;
    
    llamarAppScript('obtenerCompromisos', { mes }).then(compromisos => {
        const filtrados = compromisos.filter(c => c.estado === estado);
        
        const tbody = document.getElementById('compromisosTableBody');
        tbody.innerHTML = '';
        
        if (filtrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Sin compromisos</td></tr>';
            return;
        }
        
        filtrados.forEach(c => {
            const row = `<tr>
                <td>${c.id}</td>
                <td>${c.mes}</td>
                <td>${c.vendedor}</td>
                <td>${c.cliente}</td>
                <td>${c.clasificacion}</td>
                <td>${c.estado}</td>
            </tr>`;
            tbody.innerHTML += row;
        });
    });
}

function cargarWBR() {
    llamarAppScript('obtenerCompromisos', { mes: 'Junio' }).then(compromisos => {
        const html = `
            <div class="compromiso-toggle-container">
                ${compromisos.map(c => `
                    <button class="toggle-btn gris" 
                            data-id="${c.id}" 
                            data-estado="gris"
                            onclick="toggleCompromiso('${c.id}', this)">
                        ${c.cliente} - ${c.clasificacion}
                    </button>
                `).join('')}
            </div>
        `;
        document.getElementById('wbrContent').innerHTML = html;
    });
}

function toggleCompromiso(idCompromiso, btnElement) {
    const estadoActual = btnElement.getAttribute('data-estado');
    let nuevoEstado;
    let nuevoTexto = btnElement.textContent.replace(/^[✓✗]\s/, '');
    
    if (estadoActual === 'gris') {
        nuevoEstado = 'completado';
        nuevoTexto = '✓ ' + nuevoTexto;
    } else if (estadoActual === 'completado') {
        nuevoEstado = 'no-completado';
        nuevoTexto = '✗ ' + nuevoTexto;
    } else {
        nuevoEstado = 'gris';
    }
    
    btnElement.textContent = nuevoTexto;
    
    // Actualizar clase CSS
    btnElement.classList.remove('gris', 'completado', 'no-completado');
    btnElement.classList.add(nuevoEstado);
    btnElement.setAttribute('data-estado', nuevoEstado);
    
    // Mapear a estado de Sheets
    const estadoSheet = nuevoEstado === 'completado' ? 'Completado' 
                      : nuevoEstado === 'no-completado' ? 'No Completado' 
                      : 'Pendiente';
    
    // Guardar en AppScript
    llamarAppScript('actualizarEstadoCompromiso', {
        idCompromiso: idCompromiso,
        completado: estadoSheet
    }).then(response => {
        if (response.exito) {
            // Recargar dashboard para ver cambios
            loadDashboard();
        }
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    if (sectionId === 'compromisos') {
        cargarCompromisos();
    } else if (sectionId === 'wbr') {
        cargarWBR();
    }
}
