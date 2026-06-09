let usuarioActual = 'Coordinador';
let vendedoresData = [];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

window.addEventListener('DOMContentLoaded', () => {
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 60000);
    cargarDatos();
});

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

function mostrarTab(tabName) {
    document.getElementById('vista-pre-sesion').style.display = tabName === 'nueva-sesion' ? 'block' : 'none';
    document.getElementById('vista-post-sesion').style.display = 'none';
    document.getElementById('vista-historial').style.display = tabName === 'historial' ? 'block' : 'none';
    document.querySelectorAll('.wbr-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    if (tabName === 'historial') cargarHistorialWBR();
}

function crearNuevaWBR() {
    document.getElementById('vista-pre-sesion').style.display = 'none';
    document.getElementById('vista-post-sesion').style.display = 'block';
    const mes = document.getElementById('mes-display').textContent;
    const semana = document.getElementById('semana-display').textContent;
    document.getElementById('titulo-sesion').textContent = `WBR - ${mes} Semana ${semana}`;
    cargarVendedoresWBR(mes, semana);
}

function cargarVendedoresWBR(mes, semana) {
    llamarAppScript('obtenerVendedores', {}).then(vendedores => {
        const container = document.getElementById('wbr-vendedores-container');
        container.innerHTML = '';
        vendedores.filter(v => v.estado === 'Activo').forEach(vendedor => {
            const acordeon = `
                <div class="wbr-vendedor" data-vendedor-id="${vendedor.id}">
                    <div class="wbr-vendedor-header" onclick="toggleVendedor(this)">
                        <div class="wbr-vendedor-info">
                            <div class="wbr-vendedor-nombre">${vendedor.nombre}</div>
                            <div class="wbr-vendedor-status">⚙️ En edición</div>
                        </div>
                        <div class="wbr-vendedor-toggle">▼</div>
                    </div>
                    <div class="wbr-vendedor-content show">
                        <div class="wbr-paso">
                            <div class="wbr-paso-titulo">PASO 1: Compromisos</div>
                            <div id="paso1-${vendedor.id}"><div class="loading"><div class="spinner"></div></div></div>
                        </div>
                        <div class="wbr-paso">
                            <div class="wbr-paso-titulo">PASO 2: Descubrimientos/Retos</div>
                            <textarea class="wbr-textarea" id="paso2-${vendedor.id}" placeholder="¿Qué descubrieron?"></textarea>
                        </div>
                        <div class="wbr-paso">
                            <div class="wbr-paso-titulo">PASO 3: Acciones</div>
                            <button class="btn-primary" onclick="abrirModalAccion('${vendedor.id}', '${vendedor.nombre}')">➕ Agregar Acción</button>
                            <div id="paso3-${vendedor.id}"><div class="loading"><div class="spinner"></div></div></div>
                        </div>
                        <div style="margin-top: 20px; display: flex; gap: 10px;">
                            <button class="btn-success" onclick="guardarVendedorWBR('${vendedor.id}', '${vendedor.nombre}', '${mes}', '${semana}')">Guardar</button>
                            <button class="btn-danger" onclick="cancelarVendedorWBR('${vendedor.id}')">Cancelar</button>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += acordeon;
            cargarCompromisosWBR(mes, vendedor.nombre, vendedor.id);
            cargarAccionesWBR(mes, vendedor.id);
        });
    });
}

function toggleVendedor(header) {
    const content = header.nextElementSibling;
    content.classList.toggle('show');
    const toggle = header.querySelector('.wbr-vendedor-toggle');
    toggle.textContent = content.classList.contains('show') ? '▼' : '▶';
}

function cargarCompromisosWBR(mes, vendedor, vendedorId) {
    llamarAppScript('obtenerCompromisos', { mes }).then(compromisos => {
        const filtrados = compromisos.filter(c => c.vendedor === vendedor);
        const html = filtrados.map(c => `
            <button class="toggle-btn gris" data-id="${c.id}" data-estado="gris" onclick="toggleCompromiso('${c.id}', this)">
                ${c.cliente} - ${c.clasificacion}
            </button>
        `).join('');
        document.getElementById('paso1-' + vendedorId).innerHTML = html;
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
    btnElement.classList.remove('gris', 'completado', 'no-completado');
    btnElement.classList.add(nuevoEstado);
    btnElement.setAttribute('data-estado', nuevoEstado);
}

function cargarAccionesWBR(mes, vendedorId) {
    llamarAppScript('obtenerAcciones', { mes }).then(acciones => {
        const filtradas = acciones.filter(a => a.estado !== 'COMPLETADO');
        if (filtradas.length === 0) {
            document.getElementById('paso3-' + vendedorId).innerHTML = '<p>Sin acciones</p>';
            return;
        }
        const html = `
            <table class="wbr-tabla">
                <thead><tr><th>Tipo</th><th>Descripción</th><th>Vencimiento</th><th>Responsable</th></tr></thead>
                <tbody>
                    ${filtradas.map(a => `<tr><td>${a.tipo}</td><td>${a.descripcion}</td><td>${a.fecha_vencimiento || a.fecha}</td><td>${a.responsable}</td></tr>`).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('paso3-' + vendedorId).innerHTML = html;
    });
}

function abrirModalAccion(vendedorId, vendedorNombre) {
    console.log('Modal Acciones:', vendedorNombre);
}

function guardarVendedorWBR(vendedorId, vendedorNombre, mes, semana) {
    const descubrimientos = document.getElementById('paso2-' + vendedorId).value;
    llamarAppScript('guardarWBRResumen', {
        mes, semana, vendedor: vendedorNombre,
        descubrimientosRetos: descubrimientos,
        usuario: usuarioActual
    }).then(response => {
        if (response.exito) {
            const header = document.querySelector(`[data-vendedor-id="${vendedorId}"] .wbr-vendedor-header`);
            header.innerHTML = `
                <div class="wbr-vendedor-info">
                    <div class="wbr-vendedor-nombre">${vendedorNombre}</div>
                    <div class="wbr-vendedor-status guardado">✅ Guardado</div>
                </div>
                <button class="btn-info" onclick="editarVendedorWBR('${vendedorId}')">Editar</button>
            `;
            const content = document.querySelector(`[data-vendedor-id="${vendedorId}"] .wbr-vendedor-content`);
            content.classList.remove('show');
        }
    });
}

function editarVendedorWBR(vendedorId) {
    const content = document.querySelector(`[data-vendedor-id="${vendedorId}"] .wbr-vendedor-content`);
    content.classList.add('show');
    const header = document.querySelector(`[data-vendedor-id="${vendedorId}"] .wbr-vendedor-header`);
    const nombre = header.querySelector('.wbr-vendedor-nombre').textContent;
    header.innerHTML = `
        <div class="wbr-vendedor-info">
            <div class="wbr-vendedor-nombre">${nombre}</div>
            <div class="wbr-vendedor-status">⚙️ En edición</div>
        </div>
        <div class="wbr-vendedor-toggle">▼</div>
    `;
}

function cerrarWBR() {
    document.getElementById('vista-post-sesion').style.display = 'none';
    document.getElementById('vista-pre-sesion').style.display = 'block';
    console.log('WBR Cerrada');
}

function cargarHistorialWBR() {
    const lista = document.getElementById('wbr-historial-list');
    lista.innerHTML = '<p>Cargando historial...</p>';
}

function cancelarVendedorWBR(vendedorId) {
    const content = document.querySelector(`[data-vendedor-id="${vendedorId}"] .wbr-vendedor-content`);
    content.classList.remove('show');
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    if (sectionId === 'compromisos') cargarCompromisos();
}

function descargarPDF() {
    console.log('Descargando PDF...');
}
