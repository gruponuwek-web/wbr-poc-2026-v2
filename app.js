// =======================================
// WBR SISTEMA v2 - APP.JS
// =======================================
// Toda la lógica en un solo archivo

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbypCXR2h_tN-IFtkZOf_Hx4w_CkAARa80_TUWTrPJxaCoqr09F2Wf5VKTruY80EYvq-/exec';

let usuarioActual = 'Coordinador';
let mesActual = 'Junio';
let semanaActual = obtenerSemanaActual();
let wbrAbierta = false;
let vendedoresData = [];

// =======================================
// INICIALIZACIÓN
// =======================================

window.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    setearFechaActual();
});

function setearFechaActual() {
    document.getElementById('semanaMostrada').textContent = semanaActual;
    document.getElementById('mesMostrado').textContent = mesActual;
}

function obtenerSemanaActual() {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), 0, 1);
    const diferencia = hoy - primerDia;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    return Math.ceil((dias + 1) / 7);
}

function cargarDatos() {
    cargarVendedores();
    loadDashboard();
}

// =======================================
// FETCH A APPS SCRIPT
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
        
        // Actualizar selects
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
    llamarAppScript('agregarVendedor', { nombre }).then(response => {
        if (response.exito) {
            mostrarMensaje('vendedorMsg', '✅ Vendedor agregado', 'success');
            document.getElementById('nuevoVendedor').value = '';
            cargarVendedores();
        }
    });
}

function pausarVendedor(id) {
    llamarAppScript('pausarVendedor', { id }).then(response => {
        if (response.exito) {
            cargarVendedores();
        }
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
                const row = `<tr>
                    <td>${c.id.substring(0, 8)}...</td>
                    <td>${c.vendedor}</td>
                    <td>${c.cliente}</td>
                    <td>${c.clasificacion}</td>
                    <td>${c.estado}</td>
                </tr>`;
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

    llamarAppScript('agregarCompromiso', { 
        mes, vendedor, cliente, clasificacion, usuario: usuarioActual 
    }).then(response => {
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
    const mes = mesActual;
    llamarAppScript('obtenerCompromisos', { mes }).then(compromisos => {
        let html = `<h3>Compromisos del mes: ${mes}</h3>`;
        
        const resumen = {
            'Prospección': 0,
            'Crecimiento': 0,
            'Recuperado': 0
        };
        
        compromisos.forEach(c => {
            resumen[c.clasificacion]++;
        });
        
        html += `<div class="grid-2">
            <div class="info-card">
                <strong>🔍 Prospección</strong>
                <p style="font-size: 28px; color: #27ae60; font-weight: bold; margin-top: 10px;">${resumen['Prospección']}</p>
            </div>
            <div class="info-card">
                <strong>📈 Crecimiento</strong>
                <p style="font-size: 28px; color: #3498db; font-weight: bold; margin-top: 10px;">${resumen['Crecimiento']}</p>
            </div>
            <div class="info-card">
                <strong>✅ Recuperados</strong>
                <p style="font-size: 28px; color: #8e44ad; font-weight: bold; margin-top: 10px;">${resumen['Recuperado']}</p>
            </div>
        </div>`;
        
        document.getElementById('dashboardContent').innerHTML = html;
    });
}

// =======================================
// WBR
// =======================================

function abrirWBR() {
    const semana = semanaActual;
    
    llamarAppScript('abrirWBR', { 
        mes: mesActual, 
        semana: semana, 
        usuario: usuarioActual 
    }).then(response => {
        if (response.exito) {
            wbrAbierta = true;
            mostrarMensaje('wbrMsg', '✅ WBR abierta', 'success');
            document.getElementById('estadoWBR').textContent = 'ABIERTA';
            document.getElementById('cerrarWBRControles').style.display = 'block';
            cargarWBRConVendedores();
        }
    });
}

function cargarWBRConVendedores() {
    const semana = semanaActual;
    const mes = mesActual;
    
    // Cargar todos los vendedores y sus compromisos
    const container = document.getElementById('vendedoresWBRContainer');
    container.innerHTML = '<div class="loading">Cargando vendedores...</div>';
    
    llamarAppScript('obtenerCompromisosPorVendedor', { mes, vendedor: '' }).then(() => {
        let html = '';
        
        vendedoresData.forEach(vendedor => {
            if (vendedor.estado === 'Activo') {
                html += generarSectionVendedor(vendedor, semana, mes);
            }
        });
        
        container.innerHTML = html;
        
        // Agregar event listeners a los checkboxes
        document.querySelectorAll('.compromise-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const vendedor = e.target.getAttribute('data-vendedor');
                const idCompromiso = e.target.getAttribute('data-compromiso');
                const completado = e.target.checked;
                guardarEstadoCompromiso(mes, semana, vendedor, idCompromiso, completado);
            });
        });
    });
}

function generarSectionVendedor(vendedor, semana, mes) {
    const vendedorNombre = vendedor.nombre;
    
    return `
    <div class="vendor-section">
        <h3>👤 ${vendedorNombre}</h3>
        
        <div class="step">
            <h4>PASO 1: Compromisos del Mes</h4>
            <div id="compromisos_${vendedor.id}" class="loading">Cargando compromisos...</div>
        </div>
        
        <div class="step">
            <h4>PASO 2: Descubrimientos y Retos</h4>
            <div class="form-group">
                <label>Descubrimientos:</label>
                <textarea id="descubrimientos_${vendedor.id}" placeholder="¿Qué descubriste esta semana?"></textarea>
            </div>
            <div class="form-group">
                <label>Retos:</label>
                <textarea id="retos_${vendedor.id}" placeholder="¿Qué retos enfrentaste?"></textarea>
            </div>
        </div>
        
        <div class="step">
            <h4>PASO 3: Actividades de Seguimiento</h4>
            <div class="form-group">
                <label>Actividades para la próxima semana:</label>
                <textarea id="actividades_${vendedor.id}" placeholder="¿Qué actividades realizarás?"></textarea>
            </div>
        </div>
    </div>
    `;
}

function guardarEstadoCompromiso(mes, semana, vendedor, idCompromiso, completado) {
    // Esta función se llamará cuando cambie un checkbox
    // Por ahora solo guarda el estado localmente, se sincroniza al cerrar WBR
    console.log(`Compromiso ${idCompromiso} para ${vendedor}: ${completado}`);
}

function cerrarWBR() {
    const semana = semanaActual;
    
    // Guardar todos los detalles de vendedores
    vendedoresData.forEach(vendedor => {
        if (vendedor.estado === 'Activo') {
            const descubrimientos = document.getElementById(`descubrimientos_${vendedor.id}`)?.value || '';
            const retos = document.getElementById(`retos_${vendedor.id}`)?.value || '';
            const actividades = document.getElementById(`actividades_${vendedor.id}`)?.value || '';
            
            // Aquí irían las llamadas para guardar los detalles
            console.log(`Guardando detalles de ${vendedor.nombre}`);
        }
    });
    
    llamarAppScript('cerrarWBR', { 
        mes: mesActual, 
        semana: semana 
    }).then(response => {
        if (response.exito) {
            wbrAbierta = false;
            mostrarMensaje('wbrMsg', '✅ WBR cerrada correctamente', 'success');
            document.getElementById('estadoWBR').textContent = 'CERRADA';
            document.getElementById('cerrarWBRControles').style.display = 'none';
        }
    });
}

function generarPDFWBR() {
    const elemento = document.getElementById('vendedoresWBRContainer');
    const opt = {
        margin: 10,
        filename: `WBR_Semana_${semanaActual}_${mesActual}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    html2pdf().set(opt).from(elemento).save();
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
                    <td>${a.estado}</td>
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

    if (!descripcion || !responsable) {
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
            cargarAcciones();
        }
    });
}

// =======================================
// UTILIDADES
// =======================================

function mostrarMensaje(elementId, mensaje, tipo) {
    const elemento = document.getElementById(elementId);
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${tipo}`;
    messageDiv.textContent = mensaje;
    elemento.innerHTML = '';
    elemento.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 4000);
}
