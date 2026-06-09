let usuarioActual = 'Coordinador';
let vendedoresData = [];
let vendedorModalId = '';
let vendedorModalNombre = '';
let mesActual = 'Junio';
let semanaActual = '24';
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
    document.getElementById('comp_vendedor').addEventListener('change', cargarCompromisosGuardados);
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

// ===== COMPROMISOS =====

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

function cargarCompromisosGuardados() {
    const mes = document.getElementById('comp_mes').value;
    const vendedor = document.getElementById('comp_vendedor').value;
    
    if (!vendedor) {
        document.getElementById('compromisosTableBody').innerHTML = '<tr><td colspan="6">Selecciona un vendedor</td></tr>';
        return;
    }
    
    llamarAppScript('obtenerCompromisos', { mes }).then(compromisos => {
        const filtrados = compromisos.filter(c => 
            c.mes === mes && c.vendedor === vendedor
        );
        
        const tbody = document.getElementById('compromisosTableBody');
        tbody.innerHTML = '';
        
        if (filtrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Sin compromisos guardados</td></tr>';
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

function agregarCompromiso() {
    const mes = document.getElementById('comp_mes').value;
    const vendedor = document.getElementById('comp_vendedor').value;
    const cliente = document.getElementById('comp_cliente').value;
    const clasificacion = document.getElementById('comp_clasificacion').value;
    
    if (!vendedor || !cliente || !clasificacion) {
        alert('Completa todos los campos');
        return;
    }
    
    llamarAppScript('agregarCompromiso', {
        mes, vendedor, cliente, clasificacion,
        usuario: usuarioActual
    }).then(response => {
        if (response.exito) {
            document.getElementById('comp_cliente').value = '';
            document.getElementById('comp_clasificacion').value = '';
            cargarCompromisosGuardados();
            alert('Compromiso guardado ✅');
        }
    });
}

// ===== WBR =====

function mostrarTab(tabName) {
    document.getElementById('vista-pre-sesion').style.display = tabName === 'nueva-sesion' ? 'block' : 'none';
    document.getElementById('vista-post-sesion').style.display = 'none';
    document.getElementById('vista-historial').style.display = tabName === 'historial' ? 'block' : 'none';
    document.querySelectorAll('.wbr-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    if (tabName === 'historial') cargarHistorialWBR();
}

function crearNuevaWBR() {
    mesActual = document.getElementById('mes-display').textContent;
    semanaActual = document.getElementById('semana-display').textContent;
    
    document.getElementById('vista-pre-sesion').style.display = 'none';
    document.getElementById('vista-post-sesion').style.display = 'block';
    document.getElementById('titulo-sesion').textContent = `WBR - ${mesActual} Semana ${semanaActual}`;
    cargarVendedoresWBR(mesActual, semanaActual);
}

function cargarVendedoresWBR(mes, semana) {
    llamarAppScript('obtenerVendedores', {}).then(vendedores => {
        const container = document.getElementById('wbr-vendedores-container');
        container.innerHTML = '';
        const activos = vendedores.filter(v => v.estado === 'Activo');
        
        activos.forEach((vendedor, index) => {
            const acordeon = `
                <div class="wbr-vendedor" data-vendedor-id="${vendedor.id}">
                    <div class="wbr-vendedor-header" onclick="toggleVendedor(this)">
                        <div class="wbr-vendedor-info">
                            <div class="wbr-vendedor-nombre">${vendedor.nombre}</div>
                            <div class="wbr-vendedor-status">⚙️ En edición</div>
                        </div>
                        <div class="wbr-vendedor-toggle">▼</div>
                    </div>
                    <div class="wbr-vendedor-content ${index === 0 ? 'show' : ''}">
                        <div class="wbr-paso">
                            <div class="wbr-paso-titulo">PASO 1: Compromisos</div>
                            <div id="paso1-${vendedor.id}" style="display: flex; flex-direction: column; gap: 10px;"><div class="loading"><div class="spinner"></div></div></div>
                        </div>
                        <div class="wbr-paso">
                            <div class="wbr-paso-titulo">PASO 2: Descubrimientos/Retos</div>
                            <textarea class="wbr-textarea" id="paso2-${vendedor.id}" placeholder="¿Qué descubrieron?"></textarea>
                        </div>
                        <div class="wbr-paso">
                            <div class="wbr-paso-titulo">PASO 3: Acciones</div>
                            <button class="btn-primary" onclick="abrirModalAccion('${vendedor.id}', '${vendedor.nombre}')">➕ Agregar Acción</button>
                            <div id="paso3-${vendedor.id}"></div>
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
            <div class="compromiso-fila">
                <div class="compromiso-nombre">${c.cliente} - ${c.clasificacion}</div>
                <select class="compromiso-dropdown ${(c.estado || 'Pendiente').toLowerCase().replace(' ', '-')}" 
                        data-id="${c.id}" 
                        onchange="toggleCompromiso('${c.id}', this)">
                    <option value="Pendiente" ${c.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Completado" ${c.estado === 'Completado' ? 'selected' : ''}>Completado</option>
                    <option value="No Completado" ${c.estado === 'No Completado' ? 'selected' : ''}>No Completado</option>
                </select>
            </div>
        `).join('');
        
        document.getElementById('paso1-' + vendedorId).innerHTML = html || '<p>Sin compromisos</p>';
    });
}

function toggleCompromiso(idCompromiso, selectElement) {
    const nuevoEstado = selectElement.value;
    
    // Actualizar clase CSS según estado
    selectElement.classList.remove('pendiente', 'completado', 'no-completado');
    selectElement.classList.add(nuevoEstado.toLowerCase().replace(' ', '-'));
}

function cargarAccionesWBR(mes, vendedorId) {
    llamarAppScript('obtenerAcciones', { mes }).then(acciones => {
        // FILTRAR: solo NO completadas
        const filtradas = acciones.filter(a => a.estado !== 'COMPLETADO' && a.estado !== 'Completado');
        
        if (filtradas.length === 0) {
            document.getElementById('paso3-' + vendedorId).innerHTML = '<p style="color: #999; margin-top: 10px;">Sin acciones pendientes</p>';
            return;
        }
        
        const html = `
            <table class="wbr-tabla" style="margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th>Vencimiento</th>
                        <th>Responsable</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtradas.map(a => `
                        <tr>
                            <td>${a.tipo}</td>
                            <td>${a.descripcion}</td>
                            <td>${a.fecha_vencimiento || a.fecha}</td>
                            <td>${a.responsable}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('paso3-' + vendedorId).innerHTML = html;
    });
}

function abrirModalAccion(vendedorId, vendedorNombre) {
    vendedorModalId = vendedorId;
    vendedorModalNombre = vendedorNombre;
    document.getElementById('vendedorModalNombre').textContent = vendedorNombre;
    document.getElementById('modalAccion').style.display = 'flex';
    
    // Limpiar campos
    document.getElementById('accion_tipo').value = '';
    document.getElementById('accion_descripcion').value = '';
    document.getElementById('accion_vencimiento').value = '';
    document.getElementById('accion_responsable').value = '';
}

function cerrarModalAccion() {
    document.getElementById('modalAccion').style.display = 'none';
}

function guardarAccion() {
    const tipo = document.getElementById('accion_tipo').value;
    const descripcion = document.getElementById('accion_descripcion').value;
    const vencimiento = document.getElementById('accion_vencimiento').value;
    const responsable = document.getElementById('accion_responsable').value;
    
    if (!tipo || !descripcion || !vencimiento || !responsable) {
        alert('Completa todos los campos');
        return;
    }
    
    llamarAppScript('agregarAccion', {
        mes: mesActual,
        semana: semanaActual,
        tipo: tipo,
        vendedor: vendedorModalNombre,
        descripcion: descripcion,
        responsable: responsable,
        fecha: vencimiento,
        usuario: usuarioActual
    }).then(response => {
        if (response.exito) {
            cerrarModalAccion();
            cargarAccionesWBR(mesActual, vendedorModalId);
            alert('Acción guardada ✅');
        }
    });
}

function guardarVendedorWBR(vendedorId, vendedorNombre, mes, semana) {
    // 1. RECOPILAR ESTADOS DE COMPROMISOS (PASO 1)
    const paso1Selects = document.querySelectorAll(`[data-vendedor-id="${vendedorId}"] .compromiso-dropdown`);
    const estadosCompromisos = [];
    paso1Selects.forEach(select => {
        estadosCompromisos.push({
            id: select.getAttribute('data-id'),
            estado: select.value
        });
    });
    
    // 2. RECOPILAR DESCUBRIMIENTOS (PASO 2)
    const descubrimientos = document.getElementById('paso2-' + vendedorId).value;
    
    // 3. RECOPILAR ACCIONES (PASO 3) - desde tabla
    const paso3Table = document.querySelector(`[data-vendedor-id="${vendedorId}"] .wbr-tabla tbody`);
    const acciones = [];
    if (paso3Table) {
        paso3Table.querySelectorAll('tr').forEach(row => {
            acciones.push({
                tipo: row.cells[0]?.textContent,
                descripcion: row.cells[1]?.textContent,
                vencimiento: row.cells[2]?.textContent,
                responsable: row.cells[3]?.textContent
            });
        });
    }
    
    // 4. ENVIAR TODO A APPSCRIPT
    llamarAppScript('guardarWBRCompleto', {
        mes, semana, vendedor: vendedorNombre,
        estadosCompromisos: JSON.stringify(estadosCompromisos),
        descubrimientos: descubrimientos,
        acciones: JSON.stringify(acciones),
        usuario: usuarioActual
    }).then(response => {
        if (response.exito) {
            // Cambiar header a "Guardado"
            const header = document.querySelector(`[data-vendedor-id="${vendedorId}"] .wbr-vendedor-header`);
            header.innerHTML = `
                <div class="wbr-vendedor-info">
                    <div class="wbr-vendedor-nombre">${vendedorNombre}</div>
                    <div class="wbr-vendedor-status guardado">✅ Guardado</div>
                </div>
                <button class="btn-info" onclick="editarVendedorWBR('${vendedorId}')">Editar</button>
            `;
            
            // Cerrar acordeón
            const content = document.querySelector(`[data-vendedor-id="${vendedorId}"] .wbr-vendedor-content`);
            content.classList.remove('show');
            
            alert('Vendedor guardado ✅');
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
    if (sectionId === 'compromisos') cargarCompromisosGuardados();
}

function descargarPDF() {
    console.log('Descargando PDF...');
}
