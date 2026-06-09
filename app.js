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
            cargarAccionesWBR(mes, vendedor.id, vendedor.nombre);
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
                        data-vendedor-id="${vendedorId}"
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

function cargarAccionesWBR(mes, vendedorId, vendedorNombre) {
    llamarAppScript('obtenerAcciones', { mes }).then(acciones => {
        // FILTRAR: solo del vendedor seleccionado y NO completadas
        const filtradas = acciones.filter(a => 
            a.vendedor === vendedorNombre && 
            a.estado !== 'COMPLETADO' && 
            a.estado !== 'Completado'
        );
        
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
                    ${filtradas.map(a => {
                        const fecha = a.fecha_vencimiento || a.fecha;
                        const fechaFormato = formatearFecha(fecha);
                        return `
                            <tr>
                                <td>${a.tipo}</td>
                                <td>${a.descripcion}</td>
                                <td>${fechaFormato}</td>
                                <td>${a.responsable}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('paso3-' + vendedorId).innerHTML = html;
    });
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
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
            cargarAccionesWBR(mesActual, vendedorModalId, vendedorModalNombre);
            alert('Acción guardada ✅');
        }
    });
}

function guardarVendedorWBR(vendedorId, vendedorNombre, mes, semana) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PASO 1: FUNCIÓN EJECUTADA');
    console.log('═══════════════════════════════════════════════════════');
    console.log('vendedorId:', vendedorId);
    console.log('vendedorNombre:', vendedorNombre);
    console.log('mes:', mes);
    console.log('semana:', semana);
    
    // PASO 2: RECOPILAR ESTADOS
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PASO 2: BUSCANDO DROPDOWNS');
    console.log('═══════════════════════════════════════════════════════');
    
    const dropdowns = document.querySelectorAll(`[data-vendedor-id="${vendedorId}"] .compromiso-dropdown`);
    console.log('✅ Dropdowns encontrados:', dropdowns.length);
    
    const estadosCompromisos = [];
    dropdowns.forEach((dd, index) => {
        const id = dd.getAttribute('data-id');
        const estado = dd.value;
        console.log(`  Dropdown ${index}: id="${id}", estado="${estado}"`);
        estadosCompromisos.push({ id: id, estado: estado });
    });
    
    // PASO 3: RECOPILAR DESCUBRIMIENTOS
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PASO 3: BUSCANDO TEXTAREA');
    console.log('═══════════════════════════════════════════════════════');
    
    const textareaId = `paso2-${vendedorId}`;
    const textarea = document.getElementById(textareaId);
    const descubrimientos = textarea ? textarea.value : '';
    
    console.log('✅ Textarea encontrado:', !!textarea);
    console.log('✅ ID del textarea:', textareaId);
    console.log('✅ Contenido:', descubrimientos);
    
    // PASO 4: RECOPILAR ACCIONES - NO SE GUARDAN EN WBR, SOLO SE VISUALIZAN
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PASO 4: ACCIONES - SOLO VISUALIZACIÓN (NO SE GUARDAN)');
    console.log('═══════════════════════════════════════════════════════');
    
    // Las acciones se agregan mediante el botón "Agregar Acción"
    // No se envían al guardar WBR
    
    // PASO 5: ENVIAR A APPSCRIPT
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PASO 5: ENVIANDO A APPSCRIPT');
    console.log('═══════════════════════════════════════════════════════');
    
    const datosAEnviar = {
        mes: mes,
        semana: semana,
        vendedor: vendedorNombre,
        estadosCompromisos: JSON.stringify(estadosCompromisos),
        descubrimientos: descubrimientos,
        acciones: JSON.stringify([]), // VACÍO - Las acciones se guardan directamente con "Agregar Acción"
        usuario: usuarioActual
    };
    
    console.log('📤 Datos a enviar:');
    console.log('  mes:', datosAEnviar.mes);
    console.log('  semana:', datosAEnviar.semana);
    console.log('  vendedor:', datosAEnviar.vendedor);
    console.log('  estadosCompromisos:', datosAEnviar.estadosCompromisos);
    console.log('  descubrimientos:', datosAEnviar.descubrimientos);
    console.log('  acciones: VACÍO (se guardan con Agregar Acción)');
    console.log('  usuario:', datosAEnviar.usuario);
    
    llamarAppScript('guardarWBRCompleto', datosAEnviar).then(response => {
        console.log('');
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔵 PASO 6: RESPUESTA DE APPSCRIPT');
        console.log('═══════════════════════════════════════════════════════');
        console.log('response:', response);
        
        if (response.exito) {
            console.log('✅ ✅ ✅ GUARDADO EXITOSO ✅ ✅ ✅');
            
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
        } else {
            console.log('❌ ❌ ❌ ERROR ❌ ❌ ❌');
            console.log('Mensaje:', response.mensaje);
            alert('❌ Error: ' + response.mensaje);
        }
    }).catch(error => {
        console.log('');
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔴 PASO 7: ERROR EN LLAMADA');
        console.log('═══════════════════════════════════════════════════════');
        console.log('error:', error);
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

function descargarPDF() {
    console.log('Descargando PDF...');
}

// ===== GESTOR DE ACCIONES =====

// Variables globales para navegación
let semanaActualAcciones = obtenerSemanaActual();
let mesActualAcciones = obtenerMesActual();
let diaFiltroAcciones = null; // Para filtrar por día específico en vista mensual

function obtenerSemanaActual() {
    const hoy = new Date();
    const primerDia = new Date(hoy);
    primerDia.setDate(hoy.getDate() - hoy.getDay() + 1);
    return {
        numero: Math.ceil((hoy.getDate() - hoy.getDay()) / 7),
        inicio: primerDia,
        fin: new Date(primerDia.getTime() + 6 * 24 * 60 * 60 * 1000)
    };
}

function obtenerMesActual() {
    const hoy = new Date();
    return {
        mes: hoy.getMonth(),
        año: hoy.getFullYear()
    };
}

function cargarAccionesGestor() {
    llamarAppScript('obtenerAcciones', { mes: 'Junio' }).then(acciones => {
        const accionesNoCompletadas = acciones.filter(a => a.estado !== 'COMPLETADO' && a.estado !== 'Completado');
        mostrarVistaAcciones('semanal', accionesNoCompletadas);
    });
}

function avanzarSemana(direccion) {
    semanaActualAcciones.inicio.setDate(semanaActualAcciones.inicio.getDate() + (direccion * 7));
    semanaActualAcciones.fin.setDate(semanaActualAcciones.fin.getDate() + (direccion * 7));
    actualizarTituloSemana();
    
    llamarAppScript('obtenerAcciones', { mes: 'Junio' }).then(acciones => {
        const accionesNoCompletadas = acciones.filter(a => a.estado !== 'COMPLETADO' && a.estado !== 'Completado');
        renderizarVistaSemanal(accionesNoCompletadas);
    });
}

function avanzarMes(direccion) {
    mesActualAcciones.mes += direccion;
    if (mesActualAcciones.mes > 11) {
        mesActualAcciones.mes = 0;
        mesActualAcciones.año += 1;
    } else if (mesActualAcciones.mes < 0) {
        mesActualAcciones.mes = 11;
        mesActualAcciones.año -= 1;
    }
    diaFiltroAcciones = null;
    actualizarTituloMes();
    
    llamarAppScript('obtenerAcciones', { mes: 'Junio' }).then(acciones => {
        const accionesNoCompletadas = acciones.filter(a => a.estado !== 'COMPLETADO' && a.estado !== 'Completado');
        renderizarVistaMensual(accionesNoCompletadas);
    });
}

function actualizarTituloSemana() {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dia1 = semanaActualAcciones.inicio.getDate();
    const mes1 = meses[semanaActualAcciones.inicio.getMonth()];
    const dia2 = semanaActualAcciones.fin.getDate();
    const mes2 = meses[semanaActualAcciones.fin.getMonth()];
    const num = Math.ceil(semanaActualAcciones.inicio.getDate() / 7);
    
    let titulo = `Semana ${num} (${dia1}-${dia2} ${dia2 > dia1 ? mes1 : mes2})`;
    document.getElementById('semana-titulo').textContent = titulo;
}

function actualizarTituloMes() {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const titulo = `${meses[mesActualAcciones.mes]} ${mesActualAcciones.año}`;
    document.getElementById('mes-titulo').textContent = titulo;
}

function mostrarVistaAcciones(vista, acciones = null) {
    if (!acciones) {
        llamarAppScript('obtenerAcciones', { mes: 'Junio' }).then(acc => {
            acciones = acc.filter(a => a.estado !== 'COMPLETADO' && a.estado !== 'Completado');
            renderizarVista(vista, acciones);
        });
    } else {
        renderizarVista(vista, acciones);
    }
}

function renderizarVista(vista, acciones) {
    // Ocultar todas las vistas
    document.querySelectorAll('.acciones-vista').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.acciones-tab').forEach(t => t.classList.remove('active'));
    
    // Mostrar vista seleccionada
    document.getElementById('vista-' + vista).classList.add('active');
    document.querySelector('.acciones-tab[data-vista="' + vista + '"]').classList.add('active');
    
    if (vista === 'semanal') {
        actualizarTituloSemana();
        renderizarVistaSemanal(acciones);
    } else {
        actualizarTituloMes();
        renderizarVistaMensual(acciones);
    }
}

function renderizarVistaSemanal(acciones) {
    // Usar la semana navegada, NO siempre hoy
    const primerDia = new Date(semanaActualAcciones.inicio);
    
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    let kanbanHTML = '';
    
    // Generar columnas del kanban
    for (let i = 0; i < 7; i++) {
        const fecha = new Date(primerDia);
        fecha.setDate(primerDia.getDate() + i);
        
        const fechaStr = String(fecha.getDate()).padStart(2, '0') + '/' + String(fecha.getMonth() + 1).padStart(2, '0');
        const accionesDelDia = acciones.filter(a => {
            const fechaAccion = new Date(a.fecha);
            return fechaAccion.getDate() === fecha.getDate() && 
                   fechaAccion.getMonth() === fecha.getMonth();
        });
        
        let columnHTML = `
            <div class="kanban-column">
                <div class="kanban-header">${dias[i]}<br>${fechaStr}</div>
        `;
        
        accionesDelDia.forEach(acc => {
            columnHTML += `
                <div class="kanban-card ${(acc.estado || 'Pendiente').toLowerCase().replace(' ', '-')}" 
                     onclick="abrirModalCambiarEstado('${acc.id}', '${acc.tipo}', '${acc.descripcion}', '${acc.fecha}', '${acc.responsable}', '${acc.estado}')">
                    <div class="kanban-card-tipo">${acc.tipo}</div>
                    <div class="kanban-card-desc">${acc.descripcion.substring(0, 20)}...</div>
                    <div class="kanban-card-resp">${acc.responsable}</div>
                </div>
            `;
        });
        
        columnHTML += '</div>';
        kanbanHTML += columnHTML;
    }
    
    document.getElementById('kanban-semanal').innerHTML = kanbanHTML;
    renderizarAccionesClasificadas(acciones, 'semanal');
}

function renderizarVistaMensual(acciones) {
    const mes = mesActualAcciones.mes;
    const año = mesActualAcciones.año;
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    
    const nombrMes = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][mes];
    
    let calendarioHTML = `
        <div class="calendario-header">${nombrMes} ${año}</div>
        <div class="calendario-grid">
    `;
    
    // Agregar espacios vacíos antes del primer día
    for (let i = 0; i < primerDia.getDay(); i++) {
        calendarioHTML += '<div></div>';
    }
    
    // Agregar días del mes
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const accionesDelDia = acciones.filter(a => {
            const fechaAccion = new Date(a.fecha);
            return fechaAccion.getDate() === dia && fechaAccion.getMonth() === mes;
        });
        
        calendarioHTML += `
            <div class="calendario-dia" onclick="filtrarAccionesPorDia(${dia})">
                <div class="calendario-numero">${dia}</div>
                <div class="calendario-count">${accionesDelDia.length > 0 ? '[' + accionesDelDia.length + ']' : ''}</div>
            </div>
        `;
    }
    
    calendarioHTML += '</div>';
    document.getElementById('calendario-mensual').innerHTML = calendarioHTML;
    renderizarAccionesClasificadas(acciones, 'mensual');
}

function filtrarAccionesPorDia(dia) {
    diaFiltroAcciones = dia;
    
    llamarAppScript('obtenerAcciones', { mes: 'Junio' }).then(acciones => {
        const accionesNoCompletadas = acciones.filter(a => a.estado !== 'COMPLETADO' && a.estado !== 'Completado');
        const accionesDelDia = accionesNoCompletadas.filter(a => {
            const fechaAccion = new Date(a.fecha);
            return fechaAccion.getDate() === dia && fechaAccion.getMonth() === mesActualAcciones.mes;
        });
        renderizarAccionesClasificadas(accionesDelDia, 'mensual');
    });
}

function renderizarAccionesClasificadas(acciones, vista) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);
    
    // Función para parsear fecha DD/MM → Date object
    function parsearFecha(fechaStr) {
        if (!fechaStr) return null;
        
        // Si viene en formato "08/06" o "8/6"
        const partes = String(fechaStr).split('/');
        if (partes.length === 2) {
            const dia = parseInt(partes[0]);
            const mes = parseInt(partes[1]);
            const año = new Date().getFullYear(); // Asume año actual
            
            const fecha = new Date(año, mes - 1, dia); // mes-1 porque JS es 0-indexed
            fecha.setHours(0, 0, 0, 0);
            return fecha;
        }
        
        return null;
    }
    
    // Clasificar acciones
    const retrasadas = [];
    const hoyAcciones = [];
    const mañanaAcciones = [];
    const futuras = [];
    
    acciones.forEach(a => {
        const fechaAccion = parsearFecha(a.fecha);
        
        if (!fechaAccion) return; // Si no se pudo parsear, ignorar
        
        if (fechaAccion < hoy) {
            retrasadas.push(a);
        } else if (fechaAccion.getTime() === hoy.getTime()) {
            hoyAcciones.push(a);
        } else if (fechaAccion.getTime() === mañana.getTime()) {
            mañanaAcciones.push(a);
        } else {
            futuras.push(a);
        }
    });
    
    let html = '<div class="clasificada-grupo">';
    
    // Retrasadas
    if (retrasadas.length > 0) {
        html += `<div class="clasificada-titulo retrasadas">🔴 RETRASADAS (${retrasadas.length})</div>
                 <table class="clasificada-tabla"><tbody>`;
        retrasadas.forEach(a => {
            html += `<tr onclick="abrirModalCambiarEstado('${a.id}', '${a.tipo}', '${a.descripcion}', '${a.fecha}', '${a.responsable}', '${a.estado}')">
                        <td>${a.tipo}</td>
                        <td>${a.descripcion.substring(0, 15)}</td>
                        <td>${a.fecha}</td>
                        <td>${a.responsable}</td>
                        <td>${a.estado}</td>
                     </tr>`;
        });
        html += '</tbody></table>';
    }
    
    // Hoy
    if (hoyAcciones.length > 0) {
        html += `<div class="clasificada-titulo hoy">🟡 HOY (${hoyAcciones.length})</div>
                 <table class="clasificada-tabla"><tbody>`;
        hoyAcciones.forEach(a => {
            html += `<tr onclick="abrirModalCambiarEstado('${a.id}', '${a.tipo}', '${a.descripcion}', '${a.fecha}', '${a.responsable}', '${a.estado}')">
                        <td>${a.tipo}</td>
                        <td>${a.descripcion.substring(0, 15)}</td>
                        <td>${a.fecha}</td>
                        <td>${a.responsable}</td>
                        <td>${a.estado}</td>
                     </tr>`;
        });
        html += '</tbody></table>';
    }
    
    // Mañana
    if (mañanaAcciones.length > 0) {
        html += `<div class="clasificada-titulo manana">🟢 MAÑANA (${mañanaAcciones.length})</div>
                 <table class="clasificada-tabla"><tbody>`;
        mañanaAcciones.forEach(a => {
            html += `<tr onclick="abrirModalCambiarEstado('${a.id}', '${a.tipo}', '${a.descripcion}', '${a.fecha}', '${a.responsable}', '${a.estado}')">
                        <td>${a.tipo}</td>
                        <td>${a.descripcion.substring(0, 15)}</td>
                        <td>${a.fecha}</td>
                        <td>${a.responsable}</td>
                        <td>${a.estado}</td>
                     </tr>`;
        });
        html += '</tbody></table>';
    }
    
    html += '</div>';
    
    document.getElementById('clasificadas-' + vista).innerHTML = html;
}

function abrirModalCambiarEstado(idAccion, tipo, descripcion, fecha, responsable, estadoActual) {
    // Crear modal dinámico para cambiar estado
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>✏️ Cambiar Estado</h3>
            </div>
            
            <div style="margin-bottom: 15px;">
                <p><strong>Tipo:</strong> ${tipo}</p>
                <p><strong>Descripción:</strong> ${descripcion}</p>
                <p><strong>Vencimiento:</strong> ${formatearFecha(fecha)}</p>
                <p><strong>Responsable:</strong> ${responsable}</p>
            </div>
            
            <div class="form-group">
                <label>Estado:</label>
                <select id="select-estado" value="${estadoActual}">
                    <option value="Pendiente" ${estadoActual === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Completado" ${estadoActual === 'Completado' ? 'selected' : ''}>Completado</option>
                    <option value="Cancelada" ${estadoActual === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                </select>
            </div>
            
            <div class="modal-footer">
                <button class="btn-success" onclick="guardarEstadoAccion('${idAccion}')">Guardar</button>
                <button class="btn-danger" onclick="this.closest('.modal').remove()">Cerrar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function guardarEstadoAccion(idAccion) {
    const nuevoEstado = document.getElementById('select-estado').value;
    
    llamarAppScript('actualizarEstadoAccion', {
        idAccion: idAccion,
        estado: nuevoEstado
    }).then(response => {
        if (response.exito) {
            // Cerrar modal
            const modal = document.querySelector('.modal');
            if (modal) modal.remove();
            
            // Recargar vista actual
            const vistaActiva = document.querySelector('.acciones-vista.active');
            if (vistaActiva.id === 'vista-semanal') {
                llamarAppScript('obtenerAcciones', { mes: 'Junio' }).then(acciones => {
                    const accionesNoCompletadas = acciones.filter(a => a.estado !== 'COMPLETADO' && a.estado !== 'Completado');
                    renderizarVistaSemanal(accionesNoCompletadas);
                });
            } else {
                llamarAppScript('obtenerAcciones', { mes: 'Junio' }).then(acciones => {
                    const accionesNoCompletadas = acciones.filter(a => a.estado !== 'COMPLETADO' && a.estado !== 'Completado');
                    renderizarVistaMensual(accionesNoCompletadas);
                });
            }
            
            console.log('✅ Estado actualizado a: ' + nuevoEstado);
        } else {
            alert('❌ Error al actualizar estado');
        }
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    if (sectionId === 'compromisos') cargarCompromisosGuardados();
    if (sectionId === 'acciones') cargarAccionesGestor();
}
