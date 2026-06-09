// =======================================
// WBR SISTEMA v3 - APP.JS
// LÓGICA DE UI Y FUNCIONES
// (Conexión AppScript está en api-handler.js)
// =======================================

let usuarioActual = 'Coordinador';
let vendedoresData = [];
let wbrHistorico = {};
let wbrActualEditando = null;

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const SEMANAS_POR_MES = { 'Enero': 4, 'Febrero': 4, 'Marzo': 5, 'Abril': 4, 'Mayo': 5, 'Junio': 4, 'Julio': 5, 'Agosto': 4, 'Septiembre': 5, 'Octubre': 4, 'Noviembre': 5, 'Diciembre': 4 };

// =======================================
// INICIALIZACIÓN
// =======================================

window.addEventListener('DOMContentLoaded', () => {
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
    
    document.getElementById('fechaHora').textContent = `${dia}/${mes}/${año} ${hora}:${minuto}`;
}

function cargarDatos() {
    cargarVendedores();
    loadDashboard();
    cargarWBRHistorico();
}

// =======================================
// SECCIONES
// =======================================

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    if (sectionId === 'wbr') {
        cargarWBRHistorico();
    }
    
    if (sectionId === 'testacciones') {
        cargarVendedoresParaTestAcciones();
        cargarAccionesTest();
    }
    
    if (sectionId === 'testdesc') {
        cargarVendedoresParaTest();
    }
}

// =======================================
// UTILIDADES
// =======================================

function getWeekOfYear(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function setLoadingButton(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (btn) btn.disabled = loading;
}

function mostrarMensaje(elementId, mensaje, tipo) {
    const elemento = document.getElementById(elementId);
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${tipo}`;
    messageDiv.textContent = mensaje;
    elemento.innerHTML = '';
    elemento.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 4000);
}

// =======================================
// VENDEDORES
// =======================================

function cargarVendedores() {
    llamarAppScript('obtenerVendedores').then(vendedores => {
        vendedoresData = vendedores;
        
        const tbody = document.getElementById('vendedorTableBody');
        tbody.innerHTML = '';
        
        if (vendedores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No hay vendedores</td></tr>';
        } else {
            vendedores.forEach(v => {
                const row = `<tr>
                    <td>${v.id}</td>
                    <td>${v.nombre}</td>
                    <td><span class="badge badge-${v.estado.toLowerCase()}">${v.estado}</span></td>
                    <td>${v.estado === 'Activo' ? `<button class="btn-danger" onclick="pausarVendedor(${v.id})">Pausar</button>` : 'Pausado'}</td>
                </tr>`;
                tbody.innerHTML += row;
            });
        }
        
        actualizarSelectVendedores(vendedores);
    });
}

function actualizarSelectVendedores(vendedores) {
    const selects = ['compromiso_vendedor', 'accion_vendedor'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = '';
        vendedores.forEach(v => {
            if (v.estado === 'Activo') {
                select.innerHTML += `<option value="${v.nombre}">${v.nombre}</option>`;
            }
        });
    });
}

function agregarVendedor() {
    const nombre = document.getElementById('nuevoVendedor').value;
    if (!nombre) {
        mostrarMensaje('vendedorMsg', 'Ingresa un nombre', 'error');
        return;
    }
    
    setLoadingButton('btnAgregarVendedor', true);
    llamarAppScript('agregarVendedor', { nombre }).then(response => {
        setLoadingButton('btnAgregarVendedor', false);
        if (response.exito) {
            mostrarMensaje('vendedorMsg', '✅ Vendedor agregado', 'success');
            document.getElementById('nuevoVendedor').value = '';
            cargarVendedores();
        }
    });
}

function pausarVendedor(id) {
    llamarAppScript('pausarVendedor', { id }).then(response => {
        if (response.exito) cargarVendedores();
    });
}

// =======================================
// COMPROMISOS
// =======================================

function cargarCompromisos() {
    const mes = document.getElementById('compromiso_mes').value;
    llamarAppScript('obtenerCompromisos', { mes }).then(compromisos => {
        const tbody = document.getElementById('compromiso_tabla');
        tbody.innerHTML = '';
        if (compromisos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Sin compromisos</td></tr>';
        } else {
            compromisos.forEach(c => {
                const row = `<tr><td>${c.id.substring(0, 8)}...</td><td>${c.mes}</td><td>${c.vendedor}</td><td>${c.cliente}</td><td>${c.clasificacion}</td><td>${c.estado}</td></tr>`;
                tbody.innerHTML += row;
            });
        }
    });
}

function agregarCompromiso() {
    const mes = document.getElementById('compromiso_mes').value;
    const vendedor = document.getElementById('compromiso_vendedor').value;
    const cliente = document.getElementById('compromiso_cliente').value;
    const clasificacion = document.getElementById('compromiso_clasificacion').value;

    if (!cliente || !vendedor) {
        mostrarMensaje('compromisoMsg', 'Completa todos los campos', 'error');
        return;
    }

    setLoadingButton('btnAgregarCompromiso', true);
    llamarAppScript('agregarCompromiso', { mes, vendedor, cliente, clasificacion, usuario: usuarioActual }).then(response => {
        setLoadingButton('btnAgregarCompromiso', false);
        if (response.exito) {
            mostrarMensaje('compromisoMsg', '✅ Compromiso agregado', 'success');
            document.getElementById('compromiso_cliente').value = '';
            cargarCompromisos();
        } else {
            mostrarMensaje('compromisoMsg', '❌ Error: ' + response.mensaje, 'error');
        }
    });
}

// =======================================
// DASHBOARD
// =======================================

function loadDashboard() {
    const html = `
        <div class="info-card">
            <p><strong>Vendedores Activos:</strong> ${vendedoresData.filter(v => v.estado === 'Activo').length}</p>
        </div>
        <div class="info-card">
            <p><strong>Sistema Activo:</strong> ✅ Conectado a Google Sheets</p>
        </div>
    `;
    const dashDiv = document.getElementById('dashboardContent');
    if (dashDiv) dashDiv.innerHTML = html;
}

// =======================================
// ESTADOS - COMPROMISOS
// =======================================

function cargarEstados() {
    const mes = document.getElementById('estados_mes').value;
    
    document.getElementById('estadosContent').innerHTML = '<div class="loading"><div class="spinner"></div>Cargando...</div>';
    
    llamarAppScript('obtenerCompromisos', { mes }).then(compromisos => {
        if (compromisos.length === 0) {
            document.getElementById('estadosContent').innerHTML = '<p>No hay compromisos</p>';
            return;
        }
        
        const html = compromisos.map(c => `
            <div class="estado-item">
                <div class="estado-label">
                    <strong>${c.cliente} (${c.vendedor})</strong>
                    <small>${c.clasificacion} • ID: ${c.id}</small>
                </div>
                <select class="estado-select" id="estado_${c.id}">
                    <option value="Pendiente" ${c.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Completado" ${c.estado === 'Completado' ? 'selected' : ''}>Completado</option>
                    <option value="No Completado" ${c.estado === 'No Completado' ? 'selected' : ''}>No Completado</option>
                </select>
            </div>
        `).join('');
        
        document.getElementById('estadosContent').innerHTML = html;
    });
}

function guardarEstados() {
    const mes = document.getElementById('estados_mes').value;
    
    llamarAppScript('obtenerCompromisos', { mes }).then(compromisos => {
        compromisos.forEach(c => {
            const nuevoEstado = document.getElementById('estado_' + c.id).value;
            if (nuevoEstado !== c.estado) {
                llamarAppScript('actualizarEstadoCompromiso', {
                    idCompromiso: c.id,
                    completado: nuevoEstado === 'Completado'
                });
            }
        });
        mostrarMensaje('estadosMsg', '✅ Estados guardados', 'success');
    });
}

// =======================================
// WBR
// =======================================

function cargarWBRHistorico() {
    // Cargar meses disponibles para WBR
    document.getElementById('wbrMsg').textContent = 'Cargando WBR...';
    
    Promise.all(
        MESES.map(mes => llamarAppScript('obtenerWBR', { mes }))
    ).then(results => {
        wbrHistorico = {};
        MESES.forEach((mes, i) => {
            wbrHistorico[mes] = results[i];
        });
        
        renderizarWBRAccordeon();
    });
}

function renderizarWBRAccordeon() {
    const container = document.getElementById('wbrAccordionContainer');
    container.innerHTML = '';
    
    Object.keys(wbrHistorico).forEach(mes => {
        const wbrs = wbrHistorico[mes] || [];
        const mesDiv = document.createElement('div');
        mesDiv.className = 'accordion-month';
        
        const header = document.createElement('div');
        header.className = 'accordion-month-header collapsed';
        header.textContent = `${mes} (${wbrs.length} WBR)`;
        header.onclick = function() {
            this.classList.toggle('collapsed');
            this.classList.toggle('expanded');
            content.classList.toggle('show');
        };
        
        const content = document.createElement('div');
        content.className = 'accordion-month-content';
        
        if (wbrs.length === 0) {
            content.innerHTML = '<p>Sin WBR registradas</p>';
        } else {
            content.innerHTML = wbrs.map(w => `
                <div class="week-row">
                    <div class="week-info">
                        <h4>Semana ${w.semana}</h4>
                        <p>Estado: ${w.estado} • Usuario: ${w.usuario || 'N/A'}</p>
                    </div>
                    <div class="week-actions">
                        <button class="btn-primary" onclick="abrirWBRFormModal('${mes}', ${w.semana})">Editar</button>
                    </div>
                </div>
            `).join('');
        }
        
        mesDiv.appendChild(header);
        mesDiv.appendChild(content);
        container.appendChild(mesDiv);
    });
}

function abrirWBRFormModal(mes, semana) {
    wbrActualEditando = { mes, semana };
    
    llamarAppScript('obtenerCompromisosPorVendedor', { mes, vendedor: vendedoresData[0]?.nombre || '' }).then(compromisos => {
        let html = `<div class="form-group inline"><div><label>Mes:</label><input type="text" value="${mes}" readonly></div><div><label>Semana:</label><input type="number" value="${semana}" readonly></div></div>`;
        
        if (compromisos && compromisos.length > 0) {
            html += '<h3>Compromisos de la Semana</h3>';
            html += compromisos.map(c => `
                <div class="compromise-item">
                    <input type="checkbox" id="comp_${c.id}" ${c.estado === 'Completado' ? 'checked' : ''}>
                    <label for="comp_${c.id}">${c.cliente} (${c.clasificacion})</label>
                </div>
            `).join('');
        }
        
        html += '<div class="form-group"><label>Descubrimientos/Retos:</label><textarea id="wbrResumen" placeholder="Notas del WBR..."></textarea></div>';
        
        document.getElementById('wbrFormTitle').textContent = `WBR - ${mes} Semana ${semana}`;
        document.getElementById('wbrFormContent').innerHTML = html;
        document.getElementById('wbrFormModal').classList.add('show');
    });
}

function cerrarWBRForm() {
    document.getElementById('wbrFormModal').classList.remove('show');
}

function guardarWBRCompleta() {
    const resumen = document.getElementById('wbrResumen').value;
    
    llamarAppScript('guardarWBRResumen', {
        mes: wbrActualEditando.mes,
        semana: wbrActualEditando.semana,
        vendedor: vendedoresData[0]?.nombre || 'N/A',
        descubrimientosRetos: resumen,
        usuario: usuarioActual
    }).then(response => {
        if (response.exito) {
            cerrarWBRForm();
            cargarWBRHistorico();
            mostrarMensaje('wbrMsg', '✅ WBR guardada', 'success');
        }
    });
}

// =======================================
// ACCIONES
// =======================================

function cargarAcciones() {
    const mes = document.getElementById('accion_mes').value;
    
    llamarAppScript('obtenerAcciones', { mes }).then(acciones => {
        const tbody = document.getElementById('accionTableBody');
        tbody.innerHTML = '';
        
        if (acciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Sin acciones</td></tr>';
        } else {
            acciones.forEach(a => {
                const row = `<tr>
                    <td>${a.tipo}</td>
                    <td>${a.vendedor}</td>
                    <td>${a.descripcion}</td>
                    <td>${a.responsable}</td>
                    <td>${a.fecha}</td>
                    <td><span class="badge">${a.estado}</span></td>
                </tr>`;
                tbody.innerHTML += row;
            });
        }
    });
}

function agregarAccion() {
    const mes = document.getElementById('accion_mes').value;
    const semana = document.getElementById('accion_semana').value;
    const tipo = document.getElementById('accion_tipo').value;
    const vendedor = document.getElementById('accion_vendedor').value;
    const descripcion = document.getElementById('accion_descripcion').value;
    const responsable = document.getElementById('accion_responsable').value;
    const fecha = document.getElementById('accion_fecha').value;
    
    if (!descripcion || !responsable || !fecha) {
        mostrarMensaje('accionMsg', 'Completa todos los campos', 'error');
        return;
    }
    
    llamarAppScript('agregarAccion', {
        mes, semana, tipo, vendedor, descripcion, responsable, fecha, usuario: usuarioActual
    }).then(response => {
        if (response.exito) {
            mostrarMensaje('accionMsg', '✅ Acción creada', 'success');
            document.getElementById('accion_descripcion').value = '';
            document.getElementById('accion_responsable').value = '';
            document.getElementById('accion_fecha').value = '';
            cargarAcciones();
        }
    });
}

// =======================================
// TEST - ACTUALIZAR COMPROMISO
// =======================================

function testActualizar() {
    const id = document.getElementById('test_id').value.trim();
    const estado = document.getElementById('test_estado').value;
    
    if (!id) {
        mostrarMensaje('testMsg', 'Ingresa un ID de compromiso', 'error');
        return;
    }
    
    console.log('🔄 TEST: Actualizando', id, '→', estado);
    
    llamarAppScript('actualizarEstadoCompromiso', {
        idCompromiso: id,
        completado: estado === 'Completado'
    }).then(response => {
        console.log('📤 Respuesta:', response);
        
        if (response.exito) {
            mostrarMensaje('testMsg', '✅ ACTUALIZADO. Verifica Sheets', 'success');
        } else {
            mostrarMensaje('testMsg', '❌ Error: ' + response.mensaje, 'error');
        }
    }).catch(err => {
        console.error('❌ Error:', err);
        mostrarMensaje('testMsg', '❌ Fallo: ' + err, 'error');
    });
}

// =======================================
// TEST - DESCUBRIMIENTOS
// =======================================

function cargarVendedoresParaTest() {
    const select = document.getElementById('testdesc_vendedor');
    select.innerHTML = '';
    
    vendedoresData.forEach(v => {
        if (v.estado === 'Activo') {
            const option = document.createElement('option');
            option.value = v.nombre;
            option.textContent = v.nombre;
            select.appendChild(option);
        }
    });
}

function testDescGuardar() {
    const mes = document.getElementById('testdesc_mes').value;
    const semana = document.getElementById('testdesc_semana').value;
    const vendedor = document.getElementById('testdesc_vendedor').value;
    const texto = document.getElementById('testdesc_texto').value.trim();
    
    if (!mes || !semana || !vendedor || !texto) {
        mostrarMensaje('testdescMsg', '❌ Completa todos los campos', 'error');
        return;
    }
    
    console.log('📝 TEST DESC: Guardando', mes, 'Semana', semana, vendedor);
    
    llamarAppScript('guardarWBRResumen', {
        mes: mes,
        semana: semana,
        vendedor: vendedor,
        descubrimientosRetos: texto,
        usuario: usuarioActual
    }).then(response => {
        console.log('📤 Respuesta:', response);
        
        if (response.exito) {
            mostrarMensaje('testdescMsg', '✅ GUARDADO en WBR_RESUMEN', 'success');
            document.getElementById('testdesc_texto').value = '';
        } else {
            mostrarMensaje('testdescMsg', '❌ Error: ' + response.mensaje, 'error');
        }
    }).catch(err => {
        console.error('❌ Error:', err);
        mostrarMensaje('testdescMsg', '❌ Fallo: ' + err, 'error');
    });
}

// =======================================
// TEST - ACCIONES
// =======================================

function cargarVendedoresParaTestAcciones() {
    const select = document.getElementById('testa_vendedor');
    if (!select) return;
    select.innerHTML = '';
    
    vendedoresData.forEach(v => {
        if (v.estado === 'Activo') {
            const option = document.createElement('option');
            option.value = v.nombre;
            option.textContent = v.nombre;
            select.appendChild(option);
        }
    });
}

function testAccionGuardar() {
    const mes = document.getElementById('testa_mes').value;
    const descripcion = document.getElementById('testa_descripcion').value.trim();
    const responsable = document.getElementById('testa_responsable').value.trim();
    const fecha = document.getElementById('testa_fecha').value;
    const estado = document.getElementById('testa_estado').value;
    
    if (!mes || !descripcion || !responsable || !fecha) {
        mostrarMensaje('testaMsg', '❌ Completa todos los campos', 'error');
        return;
    }
    
    console.log('⚡ TEST ACCIÓN: Guardando acción');
    
    llamarAppScript('agregarAccion', {
        mes: mes,
        semana: 1,
        tipo: 'Acción',
        vendedor: 'Coordinador',
        descripcion: descripcion,
        responsable: responsable,
        fecha: fecha,
        usuario: usuarioActual
    }).then(response => {
        console.log('📤 Respuesta:', response);
        
        if (response.exito) {
            mostrarMensaje('testaMsg', '✅ GUARDADO en ACCIONES', 'success');
            document.getElementById('testa_descripcion').value = '';
            document.getElementById('testa_responsable').value = '';
            document.getElementById('testa_fecha').value = '';
        } else {
            mostrarMensaje('testaMsg', '❌ Error: ' + response.mensaje, 'error');
        }
    }).catch(err => {
        console.error('❌ Error:', err);
        mostrarMensaje('testaMsg', '❌ Fallo: ' + err, 'error');
    });
}

function cargarAccionesTest() {
    const mes = document.getElementById('listacc_mes').value;
    
    console.log('🔵 cargarAccionesTest: mes=' + mes);
    
    llamarAppScript('obtenerAcciones', { mes }).then(acciones => {
        console.log('📊 Acciones recibidas:', acciones);
        
        if (!acciones || acciones.length === 0) {
            document.getElementById('listaAccionesTest').innerHTML = '<p style="color: #999;">Sin acciones para este mes</p>';
            return;
        }
        
        const html = acciones.map(a => `
            <div style="background: white; padding: 15px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div>
                        <strong>${a.descripcion}</strong>
                        <small style="display: block; color: #666; margin-top: 3px;">
                            ${a.tipo} • ${a.vendedor} • Resp: ${a.responsable}
                        </small>
                    </div>
                    <div style="text-align: right; font-size: 12px; color: #999;">
                        ID: ${a.id}
                    </div>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <select id="estado_${a.id}" style="padding: 6px; border: 1px solid #bbb; border-radius: 3px; font-size: 13px;">
                        <option value="Pendiente" ${a.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="En Progreso" ${a.estado === 'En Progreso' ? 'selected' : ''}>En Progreso</option>
                        <option value="Completado" ${a.estado === 'Completado' ? 'selected' : ''}>Completado</option>
                    </select>
                    <button class="btn-primary" onclick="actualizarAccionTest('${a.id}')" style="padding: 6px 15px; font-size: 13px;">Actualizar</button>
                </div>
            </div>
        `).join('');
        
        document.getElementById('listaAccionesTest').innerHTML = html;
        console.log('✅ Acciones cargadas');
    }).catch(err => {
        console.error('❌ Error:', err);
        document.getElementById('listaAccionesTest').innerHTML = '<p style="color: red;">Error al cargar</p>';
    });
}

function actualizarAccionTest(idAccion) {
    const selectId = 'estado_' + idAccion;
    const nuevoEstado = document.getElementById(selectId).value;
    
    console.log('🔄 Actualizando acción', idAccion, '→', nuevoEstado);
    
    llamarAppScript('actualizarEstadoAccion', {
        idAccion: idAccion,
        estado: nuevoEstado
    }).then(response => {
        console.log('📤 Respuesta:', response);
        
        if (response.exito) {
            console.log('✅ Acción actualizada');
            mostrarMensaje('testaMsg', '✅ Acción actualizada', 'success');
        } else {
            console.error('❌ Error:', response.mensaje);
            mostrarMensaje('testaMsg', '❌ Error: ' + response.mensaje, 'error');
        }
    }).catch(err => {
        console.error('❌ Error:', err);
        mostrarMensaje('testaMsg', '❌ Fallo: ' + err, 'error');
    });
}
