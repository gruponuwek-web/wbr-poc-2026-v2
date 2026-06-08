// =======================================
// WBR SISTEMA v2 - APP.JS MEJORADO
// =======================================

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
// UTILIDADES
// =======================================

function setLoadingButton(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.disabled = loading;
    }
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
        } else {
            mostrarMensaje('vendedorMsg', '❌ Error al agregar vendedor', 'error');
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

    setLoadingButton('btnAgregarCompromiso', true);
    
    llamarAppScript('agregarCompromiso', { 
        mes, vendedor, cliente, clasificacion, usuario: usuarioActual 
    }).then(response => {
        setLoadingButton('btnAgregarCompromiso', false);
        if (response.exito) {
            mostrarMensaje('compromisoMsg', '✅ Compromiso agregado', 'success');
            document.getElementById('compromiso_cliente').value = '';
            cargarCompromisos();
        } else {
            mostrarMensaje('compromisoMsg', '❌ Error al agregar compromiso', 'error');
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
        
        html += `<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 20px;">
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
// WBR CON TABS
// =======================================

function abrirWBR() {
    const semana = semanaActual;
    
    setLoadingButton('btnAbrirWBR', true);
    
    llamarAppScript('abrirWBR', { 
        mes: mesActual, 
        semana: semana, 
        usuario: usuarioActual 
    }).then(response => {
        setLoadingButton('btnAbrirWBR', false);
        if (response.exito) {
            wbrAbierta = true;
            mostrarMensaje('wbrMsg', '✅ WBR abierta', 'success');
            document.getElementById('estadoWBR').textContent = 'ABIERTA';
            document.getElementById('cerrarWBRControles').style.display = 'block';
            cargarWBRConTabs();
        } else {
            mostrarMensaje('wbrMsg', '❌ Error al abrir WBR', 'error');
        }
    });
}

function cargarWBRConTabs() {
    const semana = semanaActual;
    const mes = mesActual;
    
    // Mostrar contenedor de tabs
    document.getElementById('wbrTabsContainer').style.display = 'block';
    
    // Crear tabs
    const tabsContainer = document.getElementById('wbrTabs');
    const contentContainer = document.getElementById('wbrVendedoresContent');
    
    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';
    
    let firstTab = true;
    
    vendedoresData.forEach((vendedor, idx) => {
        if (vendedor.estado === 'Activo') {
            // Crear tab
            const tab = document.createElement('button');
            tab.className = `wbr-tab ${firstTab ? 'active' : ''}`;
            tab.textContent = vendedor.nombre;
            tab.onclick = () => mostrarVendedorTab(vendedor.id);
            tabsContainer.appendChild(tab);
            
            // Crear contenido
            const vendorContent = document.createElement('div');
            vendorContent.id = `vendor_${vendedor.id}`;
            vendorContent.className = `vendor-content ${firstTab ? 'active' : ''}`;
            vendorContent.innerHTML = generarSectionVendedor(vendedor, semana, mes);
            contentContainer.appendChild(vendorContent);
            
            firstTab = false;
        }
    });
    
    // Cargar compromisos para el primer vendedor
    if (vendedoresData.length > 0) {
        const primerVendedor = vendedoresData.find(v => v.estado === 'Activo');
        if (primerVendedor) {
            cargarCompromisosDelVendedor(primerVendedor.nombre, mes);
        }
    }
}

function mostrarVendedorTab(vendedorId) {
    // Ocultar todos
    document.querySelectorAll('.vendor-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.wbr-tab').forEach(el => el.classList.remove('active'));
    
    // Mostrar seleccionado
    const vendorElement = document.getElementById(`vendor_${vendedorId}`);
    const tabButtons = document.querySelectorAll('.wbr-tab');
    
    const vendedor = vendedoresData.find(v => v.id === vendedorId);
    if (vendedor && vendorElement) {
        vendorElement.classList.add('active');
        
        // Activar tab correspondiente
        tabButtons.forEach(btn => {
            if (btn.textContent === vendedor.nombre) {
                btn.classList.add('active');
            }
        });
        
        // Cargar compromisos si aún no están
        const compromisosContainer = vendorElement.querySelector(`#compromisos_${vendedorId}`);
        if (compromisosContainer && compromisosContainer.textContent.includes('Cargando')) {
            cargarCompromisosDelVendedor(vendedor.nombre, mesActual);
        }
    }
}

function cargarCompromisosDelVendedor(vendedorNombre, mes) {
    llamarAppScript('obtenerCompromisosPorVendedor', { mes, vendedor: vendedorNombre }).then(compromisos => {
        const vendedor = vendedoresData.find(v => v.nombre === vendedorNombre);
        if (vendedor) {
            const container = document.querySelector(`#compromisos_${vendedor.id}`);
            if (container) {
                if (compromisos.length === 0) {
                    container.innerHTML = '<p style="color: #999;">Sin compromisos este mes</p>';
                } else {
                    container.innerHTML = compromisos.map(c => `
                        <div class="compromise-item">
                            <input type="checkbox" class="compromise-checkbox" 
                                data-vendedor="${vendedorNombre}" 
                                data-compromiso="${c.id}"
                                ${c.estado === 'Completado' ? 'checked' : ''}>
                            <label><strong>${c.cliente}</strong> - ${c.clasificacion}</label>
                        </div>
                    `).join('');
                    
                    // Agregar event listeners
                    container.querySelectorAll('.compromise-checkbox').forEach(checkbox => {
                        checkbox.addEventListener('change', (e) => {
                            const vendedor = e.target.getAttribute('data-vendedor');
                            const idCompromiso = e.target.getAttribute('data-compromiso');
                            const completado = e.target.checked;
                            console.log(`Compromiso ${idCompromiso}: ${completado}`);
                        });
                    });
                }
            }
        }
    });
}

function generarSectionVendedor(vendedor, semana, mes) {
    const vendedorId = vendedor.id;
    
    return `
        <div class="step">
            <h4>PASO 1: Compromisos del Mes</h4>
            <div id="compromisos_${vendedorId}" class="loading">
                <div class="spinner"></div>
                Cargando compromisos...
            </div>
        </div>
        
        <div class="step">
            <h4>PASO 2: Descubrimientos y Retos</h4>
            <div class="form-group">
                <label>Descubrimientos:</label>
                <textarea id="descubrimientos_${vendedorId}" placeholder="¿Qué descubriste esta semana?"></textarea>
            </div>
            <div class="form-group">
                <label>Retos:</label>
                <textarea id="retos_${vendedorId}" placeholder="¿Qué retos enfrentaste?"></textarea>
            </div>
        </div>
        
        <div class="step">
            <h4>PASO 3: Actividades de Seguimiento</h4>
            <div class="form-group">
                <label>Actividades para la próxima semana:</label>
                <textarea id="actividades_${vendedorId}" placeholder="¿Qué actividades realizarás?"></textarea>
            </div>
        </div>
    `;
}

function cerrarWBR() {
    const semana = semanaActual;
    
    setLoadingButton('btnCerrarWBR', true);
    
    // Primero: Guardar todos los detalles de cada vendedor
    const promesasGuardar = [];
    
    vendedoresData.forEach(vendedor => {
        if (vendedor.estado === 'Activo') {
            const vendedorId = vendedor.id;
            const descubrimientos = document.getElementById(`descubrimientos_${vendedorId}`)?.value || '';
            const retos = document.getElementById(`retos_${vendedorId}`)?.value || '';
            const actividades = document.getElementById(`actividades_${vendedorId}`)?.value || '';
            
            // Obtener estado de compromisos
            const compromisosCheckboxes = document.querySelectorAll(
                `.compromise-checkbox[data-vendedor="${vendedor.nombre}"]`
            );
            
            compromisosCheckboxes.forEach(checkbox => {
                const idCompromiso = checkbox.getAttribute('data-compromiso');
                const completado = checkbox.checked;
                const descripcion = checkbox.parentElement.querySelector('label').textContent;
                const clasificacion = descripcion.includes('Prospección') ? 'Prospección' : 
                                    descripcion.includes('Crecimiento') ? 'Crecimiento' : 'Recuperado';
                
                // Guardar cada detalle
                const promesa = llamarAppScript('guardarWBRDetalle', {
                    mes: mesActual,
                    semana: semana,
                    vendedor: vendedor.nombre,
                    idCompromiso: idCompromiso,
                    descripcion: descripcion,
                    clasificacion: clasificacion,
                    completado: completado.toString(),
                    descubrimientos: descubrimientos,
                    retos: retos,
                    actividades: actividades,
                    usuario: usuarioActual
                });
                
                promesasGuardar.push(promesa);
            });
        }
    });
    
    // Esperar a que se guarden todos los detalles
    Promise.all(promesasGuardar).then(() => {
        // Luego: Cerrar la WBR
        llamarAppScript('cerrarWBR', { 
            mes: mesActual, 
            semana: semana 
        }).then(response => {
            setLoadingButton('btnCerrarWBR', false);
            if (response.exito) {
                wbrAbierta = false;
                mostrarMensaje('wbrMsg', '✅ WBR cerrada y datos guardados', 'success');
                document.getElementById('estadoWBR').textContent = 'CERRADA';
                document.getElementById('cerrarWBRControles').style.display = 'none';
                document.getElementById('wbrTabsContainer').style.display = 'none';
            } else {
                mostrarMensaje('wbrMsg', '❌ Error al cerrar WBR', 'error');
            }
        });
    }).catch(error => {
        setLoadingButton('btnCerrarWBR', false);
        mostrarMensaje('wbrMsg', '❌ Error al guardar detalles', 'error');
        console.error('Error:', error);
    });
}

function generarPDFWBR() {
    const elemento = document.getElementById('wbrVendedoresContent');
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

    setLoadingButton('btnAgregarAccion', true);
    
    llamarAppScript('agregarAccion', { 
        mes, semana, tipo, vendedor, descripcion, responsable, fecha, usuario: usuarioActual 
    }).then(response => {
        setLoadingButton('btnAgregarAccion', false);
        if (response.exito) {
            mostrarMensaje('accionMsg', '✅ Acción creada', 'success');
            document.getElementById('accion_descripcion').value = '';
            document.getElementById('accion_responsable').value = '';
            cargarAcciones();
        } else {
            mostrarMensaje('accionMsg', '❌ Error al crear acción', 'error');
        }
    });
}
