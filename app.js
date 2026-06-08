// =======================================
// WBR SISTEMA v3 - APP.JS
// =======================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbypCXR2h_tN-IFtkZOf_Hx4w_CkAARa80_TUWTrPJxaCoqr09F2Wf5VKTruY80EYvq-/exec';

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
// FETCH
// =======================================

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
        console.error('Error:', error);
        return { exito: false, mensaje: 'Error de conexión' };
    }
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
        const tbody = document.getElementById('compromisoTableBody');
        tbody.innerHTML = '';
        if (compromisos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Sin compromisos</td></tr>';
        } else {
            compromisos.forEach(c => {
                const row = `<tr><td>${c.id.substring(0, 8)}...</td><td>${c.vendedor}</td><td>${c.cliente}</td><td>${c.clasificacion}</td><td>${c.estado}</td></tr>`;
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
        }
    });
}

// =======================================
// DASHBOARD
// =======================================

function loadDashboard() {
    llamarAppScript('obtenerCompromisos', { mes: 'Junio' }).then(compromisos => {
        let html = `<h3>Compromisos del mes: Junio</h3>`;
        const resumen = { 'Prospección': 0, 'Crecimiento': 0, 'Recuperado': 0 };
        compromisos.forEach(c => { resumen[c.clasificacion]++; });
        
        html += `<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div class="info-card"><strong>🔍 Prospección</strong><p style="font-size: 28px; color: #27ae60; font-weight: bold; margin-top: 10px;">${resumen['Prospección']}</p></div>
            <div class="info-card"><strong>📈 Crecimiento</strong><p style="font-size: 28px; color: #3498db; font-weight: bold; margin-top: 10px;">${resumen['Crecimiento']}</p></div>
            <div class="info-card"><strong>✅ Recuperados</strong><p style="font-size: 28px; color: #8e44ad; font-weight: bold; margin-top: 10px;">${resumen['Recuperado']}</p></div>
        </div>`;
        
        document.getElementById('dashboardContent').innerHTML = html;
    });
}

// =======================================
// WBR - HISTÓRICO CON ACORDEONES
// =======================================

function cargarWBRHistorico() {
    llamarAppScript('obtenerWBR', { mes: 'Junio' }).then(wbrs => {
        wbrHistorico = {};
        wbrs.forEach(w => {
            if (!wbrHistorico[w.mes]) wbrHistorico[w.mes] = [];
            wbrHistorico[w.mes].push(w);
        });
        generarAcordeones();
    });
}

function generarAcordeones() {
    const container = document.getElementById('wbrAccordionContainer');
    container.innerHTML = '';
    
    MESES.forEach(mes => {
        const accordion = document.createElement('div');
        accordion.className = 'accordion-month';
        
        const header = document.createElement('div');
        header.className = 'accordion-month-header collapsed';
        header.textContent = `📅 ${mes}`;
        header.onclick = () => toggleAccordion(header);
        
        const content = document.createElement('div');
        content.className = 'accordion-month-content';
        
        const semanasEnMes = SEMANAS_POR_MES[mes] || 4;
        for (let semana = 1; semana <= semanasEnMes; semana++) {
            const wbrExistente = wbrHistorico[mes]?.find(w => w.semana === semana);
            const weekRow = generarWeekRow(mes, semana, wbrExistente);
            content.appendChild(weekRow);
        }
        
        accordion.appendChild(header);
        accordion.appendChild(content);
        container.appendChild(accordion);
    });
}

function toggleAccordion(header) {
    const content = header.nextElementSibling;
    
    if (header.classList.contains('collapsed')) {
        header.classList.remove('collapsed');
        header.classList.add('expanded');
        content.classList.add('show');
    } else {
        header.classList.remove('expanded');
        header.classList.add('collapsed');
        content.classList.remove('show');
    }
}

function generarWeekRow(mes, semanaDelMes, wbrExistente) {
    // Calcular semana del año para este mes
    const mesIndex = MESES.indexOf(mes);
    const fechaEjemplo = new Date(2026, mesIndex, semanaDelMes * 7);
    const semanaDelAño = getWeekOfYear(fechaEjemplo);
    
    const row = document.createElement('div');
    row.className = 'week-row';
    
    const info = document.createElement('div');
    info.className = 'week-info';
    info.innerHTML = `<h4>📌 Semana ${semanaDelAño}</h4><p>${wbrExistente ? `Estado: ${wbrExistente.estado}` : 'Sin crear'}</p>`;
    
    const actions = document.createElement('div');
    actions.className = 'week-actions';
    
    if (!wbrExistente || wbrExistente.estado === 'Abierta') {
        const btnCrear = document.createElement('button');
        btnCrear.className = 'btn-primary';
        btnCrear.textContent = '✏️ Crear/Editar';
        btnCrear.onclick = () => abrirFormularioWBR(mes, semanaDelMes);
        actions.appendChild(btnCrear);
    }
    
    if (wbrExistente && wbrExistente.estado === 'Cerrada') {
        const btnVer = document.createElement('button');
        btnVer.className = 'btn-info';
        btnVer.textContent = '👁️ Ver Resumen';
        btnVer.onclick = () => verResumenWBR(mes, semanaDelMes);
        actions.appendChild(btnVer);
        
        const btnPDF = document.createElement('button');
        btnPDF.className = 'btn-warning';
        btnPDF.textContent = '📄 PDF';
        btnPDF.onclick = () => descargarPDFWBR(mes, semanaDelMes);
        actions.appendChild(btnPDF);
    }
    
    row.appendChild(info);
    row.appendChild(actions);
    return row;
}

// =======================================
// FORMULARIO WBR EN MODAL
// =======================================

function abrirFormularioWBR(mes, semana) {
    wbrActualEditando = { mes, semana };
    
    const modal = document.getElementById('wbrFormModal');
    document.getElementById('wbrFormTitle').textContent = `WBR - ${mes}, Semana ${semana}`;
    
    let html = '';
    vendedoresData.forEach(vendedor => {
        if (vendedor.estado === 'Activo') {
            html += generarSeccionVendedor(vendedor, mes, semana);
        }
    });
    
    document.getElementById('wbrFormContent').innerHTML = html;
    modal.style.display = 'block';
    
    vendedoresData.forEach(v => {
        if (v.estado === 'Activo') {
            cargarCompromisosEnForm(v.nombre, mes);
        }
    });
}

function generarSeccionVendedor(vendedor, mes, semana) {
    const vid = `v_${vendedor.id}`;
    
    return `
        <div style="background: #f9f9f9; padding: 20px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
            <h3>👤 ${vendedor.nombre}</h3>
            
            <div class="steps-container">
                <!-- PASO 1: Compromisos CON PALOMITA Y TACHE -->
                <div class="step">
                    <h4><span class="step-number">1</span>Compromisos</h4>
                    <div id="compromisos_${vid}" class="loading"><div class="spinner"></div></div>
                    <div style="margin-top: 10px; font-size: 11px; color: #999;">
                        ✓ = Completado | ✗ = No Completado
                    </div>
                </div>
                
                <!-- PASO 2: Descubrimientos y Retos (UN SOLO CAMPO) -->
                <div class="step">
                    <h4><span class="step-number">2</span>Desc. y Retos</h4>
                    <div class="form-group">
                        <label style="font-size: 12px;">Descubrimientos y Retos:</label>
                        <textarea id="resumen_${vid}" placeholder="Ej: Mercado en crecimiento. Falta presupuesto. Buena comunicación." style="min-height: 100px; font-size: 12px;"></textarea>
                    </div>
                </div>
                
                <!-- PASO 3: Actividades -->
                <div class="step">
                    <h4><span class="step-number">3</span>Actividades</h4>
                    <div class="form-group">
                        <label style="font-size: 12px;">Próxima semana:</label>
                        <textarea id="activ_${vid}" placeholder="Acciones para la próxima semana..." style="min-height: 100px; font-size: 12px;"></textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function cargarCompromisosEnForm(vendedorNombre, mes) {
    llamarAppScript('obtenerCompromisosPorVendedor', { mes, vendedor: vendedorNombre }).then(compromisos => {
        const vendedor = vendedoresData.find(v => v.nombre === vendedorNombre);
        if (vendedor) {
            const vid = `v_${vendedor.id}`;
            const container = document.querySelector(`#compromisos_${vid}`);
            
            if (compromisos.length === 0) {
                container.innerHTML = '<p style="color: #999; font-size: 12px;">Sin compromisos</p>';
            } else {
                container.innerHTML = compromisos.map(c => `
                    <div class="compromise-item">
                        <div style="display: flex; gap: 5px; margin-right: 8px;">
                            <input type="radio" name="estado_${c.id}" value="completado" class="comp-estado" data-vid="${vid}" data-compromiso="${c.id}" data-estado="Completado">
                            <span style="font-size: 11px; color: #27ae60; font-weight: bold;">✓</span>
                        </div>
                        <div style="display: flex; gap: 5px; margin-right: 10px;">
                            <input type="radio" name="estado_${c.id}" value="nocompletado" class="comp-estado" data-vid="${vid}" data-compromiso="${c.id}" data-estado="No Completado">
                            <span style="font-size: 11px; color: #e74c3c; font-weight: bold;">✗</span>
                        </div>
                        <label style="flex: 1; margin: 0; font-size: 13px;"><strong>${c.cliente}</strong></label>
                    </div>
                `).join('');
            }
        }
    });
}

function guardarWBRCompleta() {
    console.log('🔵 guardarWBRCompleta iniciada');
    
    if (!wbrActualEditando) {
        console.error('❌ wbrActualEditando no definido');
        return;
    }
    
    const { mes, semana } = wbrActualEditando;
    console.log('📅 Guardando WBR:', mes, 'Semana:', semana);
    
    setLoadingButton('btnGuardarWBR', true);
    mostrarMensaje('wbrMsg', 'Guardando...', 'success');
    
    const promesasGuardar = [];
    
    vendedoresData.forEach(vendedor => {
        if (vendedor.estado === 'Activo') {
            const vid = `v_${vendedor.id}`;
            console.log('👤 Procesando:', vendedor.nombre);
            
            const resumen = document.getElementById(`resumen_${vid}`)?.value || '';
            const actividades = document.getElementById(`activ_${vid}`)?.value || '';
            
            console.log('  Resumen:', resumen.substring(0, 20) + '...');
            console.log('  Actividades:', actividades.substring(0, 20) + '...');
            
            // Actualizar estado de compromisos (radio buttons: ✓ o ✗)
            document.querySelectorAll(`.comp-estado[data-vid="${vid}"]`).forEach(radio => {
                if (radio.checked) {
                    const idComp = radio.getAttribute('data-compromiso');
                    const estado = radio.getAttribute('data-estado');
                    const completado = estado === 'Completado';
                    
                    console.log('  ✓ Compromiso:', idComp, '→', estado);
                    
                    const promesa = llamarAppScript('actualizarEstadoCompromiso', {
                        idCompromiso: idComp,
                        completado: completado.toString()
                    });
                    
                    promesasGuardar.push(promesa);
                }
            });
            
            // Guardar resumen (Paso 2)
            if (resumen) {
                console.log('  📝 Guardando resumen en WBR_RESUMEN');
                const promesa = llamarAppScript('guardarWBRResumen', {
                    mes,
                    semana,
                    vendedor: vendedor.nombre,
                    descubrimientosRetos: resumen,
                    usuario: usuarioActual
                });
                promesasGuardar.push(promesa);
            }
            
            // Guardar actividades (Paso 3) como acciones
            if (actividades) {
                console.log('  ⚡ Guardando actividades en ACCIONES');
                const promesa = llamarAppScript('agregarAccion', {
                    mes,
                    semana,
                    tipo: 'Acción WBR',
                    vendedor: vendedor.nombre,
                    descripcion: actividades,
                    responsable: vendedor.nombre,
                    fecha: new Date().toISOString().split('T')[0],
                    usuario: usuarioActual
                });
                promesasGuardar.push(promesa);
            }
        }
    });
    
    console.log('🔄 Total de promesas:', promesasGuardar.length);
    
    Promise.all(promesasGuardar).then(results => {
        console.log('✅ Todas las promesas completadas:', results);
        
        llamarAppScript('cerrarWBR', { mes, semana }).then(response => {
            console.log('🔒 Respuesta cerrarWBR:', response);
            
            setLoadingButton('btnGuardarWBR', false);
            if (response.exito) {
                mostrarMensaje('wbrMsg', '✅ WBR guardada correctamente', 'success');
                setTimeout(() => {
                    cerrarWBRForm();
                    cargarWBRHistorico();
                }, 1000);
            } else {
                mostrarMensaje('wbrMsg', '❌ Error al cerrar WBR: ' + response.mensaje, 'error');
            }
        }).catch(err => {
            console.error('❌ Error en cerrarWBR:', err);
            setLoadingButton('btnGuardarWBR', false);
            mostrarMensaje('wbrMsg', '❌ Error: ' + err.toString(), 'error');
        });
    }).catch(err => {
        console.error('❌ Error en Promise.all:', err);
        setLoadingButton('btnGuardarWBR', false);
        mostrarMensaje('wbrMsg', '❌ Error al guardar: ' + err.toString(), 'error');
    });
}

function cerrarWBRForm() {
    document.getElementById('wbrFormModal').style.display = 'none';
}

function verResumenWBR(mes, semana) {
    mostrarMensaje('wbrMsg', 'Función en desarrollo', 'error');
}

function descargarPDFWBR(mes, semana) {
    mostrarMensaje('wbrMsg', 'Función en desarrollo', 'error');
}

// =======================================
// ESTADOS - GESTIÓN DE COMPROMISOS
// =======================================

function cargarEstados() {
    const mes = document.getElementById('estados_mes').value;
    llamarAppScript('obtenerCompromisos', { mes }).then(compromisos => {
        const container = document.getElementById('estadosContent');
        
        if (compromisos.length === 0) {
            container.innerHTML = '<p style="color: #999;">Sin compromisos para este mes</p>';
            return;
        }
        
        container.innerHTML = compromisos.map(c => `
            <div class="estado-item">
                <div class="estado-label">
                    <strong>${c.cliente}</strong>
                    <small>${c.vendedor} • ${c.clasificacion}</small>
                </div>
                <div class="estado-buttons">
                    <button class="btn-estado ${c.estado === 'Completado' ? 'completado' : ''}" 
                            onclick="seleccionarEstado('${c.id}', 'Completado')" 
                            data-estado="${c.id}">
                        ✓
                    </button>
                    <button class="btn-estado ${c.estado === 'No Completado' ? 'nocompletado' : ''}" 
                            onclick="seleccionarEstado('${c.id}', 'No Completado')" 
                            data-estado="${c.id}">
                        ✗
                    </button>
                </div>
            </div>
        `).join('');
    });
}

function seleccionarEstado(idCompromiso, nuevoEstado) {
    const botones = document.querySelectorAll(`[data-estado="${idCompromiso}"]`);
    botones.forEach(btn => btn.classList.remove('completado', 'nocompletado'));
    
    const botonSeleccionado = event.target;
    if (nuevoEstado === 'Completado') {
        botonSeleccionado.classList.add('completado');
    } else {
        botonSeleccionado.classList.add('nocompletado');
    }
    
    // Guardar el estado en un objeto para luego enviarlo
    if (!window.estadosCambiados) {
        window.estadosCambiados = {};
    }
    window.estadosCambiados[idCompromiso] = nuevoEstado;
}

function guardarEstados() {
    if (!window.estadosCambiados || Object.keys(window.estadosCambiados).length === 0) {
        mostrarMensaje('estadosMsg', 'No hay cambios para guardar', 'error');
        return;
    }
    
    console.log('💾 Guardando estados:', window.estadosCambiados);
    
    setLoadingButton('btnGuardarEstados', true);
    
    const promesas = [];
    for (const idComp in window.estadosCambiados) {
        const nuevoEstado = window.estadosCambiados[idComp];
        const completado = nuevoEstado === 'Completado';
        
        const promesa = llamarAppScript('actualizarEstadoCompromiso', {
            idCompromiso: idComp,
            completado: completado.toString()
        });
        
        promesas.push(promesa);
    }
    
    Promise.all(promesas).then(resultados => {
        console.log('✅ Respuestas:', resultados);
        setLoadingButton('btnGuardarEstados', false);
        
        const exitosos = resultados.filter(r => r.exito).length;
        if (exitosos === resultados.length) {
            mostrarMensaje('estadosMsg', `✅ ${exitosos} compromisos actualizados`, 'success');
            window.estadosCambiados = {};
            cargarEstados();
        } else {
            mostrarMensaje('estadosMsg', `⚠️ ${exitosos}/${resultados.length} actualizados`, 'error');
        }
    }).catch(err => {
        console.error('❌ Error:', err);
        setLoadingButton('btnGuardarEstados', false);
        mostrarMensaje('estadosMsg', '❌ Error al guardar: ' + err, 'error');
    });
}

function cargarAcciones() {
    const mes = document.getElementById('accion_mes').value;
    llamarAppScript('obtenerAcciones', { mes }).then(acciones => {
        const tbody = document.getElementById('accionTableBody');
        tbody.innerHTML = '';
        if (acciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Sin acciones</td></tr>';
        } else {
            acciones.forEach(a => {
                const row = `<tr><td>${a.tipo}</td><td>${a.vendedor}</td><td>${a.descripcion}</td><td>${a.responsable}</td><td>${a.fecha}</td><td>${a.estado}</td></tr>`;
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

    if (!descripcion || !responsable) {
        mostrarMensaje('accionMsg', 'Completa todos los campos', 'error');
        return;
    }

    setLoadingButton('btnAgregarAccion', true);
    llamarAppScript('agregarAccion', { mes, semana, tipo, vendedor, descripcion, responsable, fecha, usuario: usuarioActual }).then(response => {
        setLoadingButton('btnAgregarAccion', false);
        if (response.exito) {
            mostrarMensaje('accionMsg', '✅ Acción creada', 'success');
            document.getElementById('accion_descripcion').value = '';
            document.getElementById('accion_responsable').value = '';
            cargarAcciones();
        }
    });
}
