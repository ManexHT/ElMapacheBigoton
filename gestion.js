const API_BASE_URL = 'http://localhost:8080/api';

let serviciosData = [];
let barberosData = [];
let citasData = [];
let citaEditando = null;

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('citaForm')) {
        inicializarPaginaAgendar();
    }

    if (document.getElementById('tablaCitas')) {
        inicializarPaginaGestion();
    }
});

function inicializarPaginaAgendar() {
    inicializarAOS();
    configurarFechaMinima();
    cargarDatosIniciales();
    configurarEventListenersAgendar();
    verificarServicioPreSeleccionado();
}

function inicializarAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            easing: 'ease-in-out',
            once: true,
            mirror: false
        });
    }
}

function configurarFechaMinima() {
    const today = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.setAttribute('min', today);
        fechaInput.value = today;
    }
}

async function cargarDatosIniciales() {
    try {
        await Promise.all([
            cargarServicios(),
            cargarBarberos()
        ]);
        generarHorasDisponibles();
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        mostrarErrorCarga();
    }
}

function configurarEventListenersAgendar() {
    const nombreInput = document.getElementById('nombre');
    const telefonoInput = document.getElementById('telefono');
    const fechaInput = document.getElementById('fecha');

    if (nombreInput) nombreInput.addEventListener('input', validarNombre);
    if (telefonoInput) telefonoInput.addEventListener('input', validarTelefono);
    if (fechaInput) fechaInput.addEventListener('change', validarFecha);
    const citaForm = document.getElementById('citaForm');
    if (citaForm) {
        citaForm.addEventListener('submit', manejarEnvioFormulario);
    }

    const servicioSelect = document.getElementById('servicio');
    const barberoSelect = document.getElementById('barbero');
    const horaSelect = document.getElementById('hora');

    if (servicioSelect) servicioSelect.addEventListener('change', actualizarResumen);
    if (barberoSelect) barberoSelect.addEventListener('change', actualizarResumen);
    if (fechaInput) fechaInput.addEventListener('change', actualizarResumen);
    if (horaSelect) horaSelect.addEventListener('change', actualizarResumen);
}

function verificarServicioPreSeleccionado() {
    const servicioGuardado = localStorage.getItem('servicioSeleccionado');
    if (servicioGuardado) {
        const servicio = JSON.parse(servicioGuardado);
        setTimeout(() => {
            const selectServicio = document.getElementById('servicio');
            if (selectServicio) {
                selectServicio.value = servicio.id;
                localStorage.removeItem('servicioSeleccionado');
            }
        }, 1000);
    }
}

function inicializarPaginaGestion() {
    cargarCitas();
    cargarBarberosFiltro();
    configurarEventListenersGestion();
}

async function cargarCitas() {
    try {
        mostrarLoading(true);
        const response = await fetch(`${API_BASE_URL}/citas`);

        if (response.ok) {
            citasData = await response.json();
            console.log('Citas cargadas:', citasData);
            mostrarCitas(citasData);
            actualizarContadorCitas(citasData.length);
        } else {
            throw new Error(`Error ${response.status}`);
        }
    } catch (error) {
        console.error('Error al cargar citas:', error);
        mostrarError('Error al cargar citas: ' + error.message);
    } finally {
        mostrarLoading(false);
    }
}

async function cargarBarberosFiltro() {
    try {
        const response = await fetch(`${API_BASE_URL}/barberos`);

        if (response.ok) {
            const barberos = await response.json();
            llenarSelectBarberosFiltro(barberos);
        } else {
            throw new Error(`Error ${response.status}`);
        }
    } catch (error) {
        console.error('Error al cargar barberos:', error);
    }
}

function llenarSelectBarberosFiltro(barberos) {
    const selectBarbero = document.getElementById('barberoFiltro');
    if (!selectBarbero) return;

    selectBarbero.innerHTML = '<option value="">Todos los barberos</option>';

    barberos.forEach(barbero => {
        const option = document.createElement('option');
        option.value = barbero.id_barbero;
        option.textContent = barbero.nombre;
        selectBarbero.appendChild(option);
    });
}

function mostrarCitas(citas) {
    const tbody = document.querySelector('#tablaCitas tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (citas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-calendar-times fa-2x text-muted mb-2"></i>
                    <p class="text-muted">No hay citas programadas</p>
                </td>
            </tr>
        `;
        return;
    }

    citas.forEach(cita => {
        const row = crearFilaCita(cita);
        tbody.appendChild(row);
    });
}

function crearFilaCita(cita) {
    const row = document.createElement('tr');
    row.setAttribute('data-cita-id', cita.id_cita);
    const fecha = new Date(cita.fecha).toLocaleDateString('es-ES');
    const hora = cita.hora ? cita.hora.substring(0, 5) : '--:--';
    const estadoInfo = determinarEstadoCita(cita);

    row.innerHTML = `
        <td>${cita.clienteNombre || 'N/A'}</td>
        <td>${cita.servicioDescripcion || 'N/A'} - $${cita.servicioCosto || '0'} MXN</td>
        <td>${cita.barberoNombre || 'Sin asignar'}</td>
        <td>${fecha} ${hora}</td>
        <td><span class="badge ${estadoInfo.class} status-badge">${estadoInfo.texto}</span></td>
        <td>
            <button class="btn btn-sm btn-info btn-editar" data-cita-id="${cita.id_cita}">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-sm btn-danger btn-eliminar" data-cita-id="${cita.id_cita}">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </td>
    `;

    return row;
}

function determinarEstadoCita(cita) {
    const fechaCita = new Date(cita.fecha);
    const hoy = new Date();

    if (fechaCita < hoy) {
        return { texto: 'Completada', class: 'bg-secondary' };
    } else {
        return { texto: 'Pendiente', class: 'bg-warning' };
    }
}

function configurarEventListenersGestion() {
    document.addEventListener('click', function (e) {
        if (e.target.closest('.btn-editar')) {
            const btn = e.target.closest('.btn-editar');
            const citaId = btn.getAttribute('data-cita-id');
            editarCita(citaId);
        }

        if (e.target.closest('.btn-eliminar')) {
            const btn = e.target.closest('.btn-eliminar');
            const citaId = btn.getAttribute('data-cita-id');
            eliminarCita(citaId);
        }
    });

    const btnFiltrar = document.getElementById('aplicarFiltros'); 
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', aplicarFiltros);
    }

    const btnGuardarCambios = document.getElementById('guardarCambios');
    if (btnGuardarCambios) {
        console.log('Botón guardar cambios encontrado, agregando event listener');
        btnGuardarCambios.addEventListener('click', guardarCambiosCita);
    } else {
        console.error('Botón guardarCambios no encontrado en el DOM');
        setTimeout(() => {
            const btn = document.getElementById('guardarCambios');
            if (btn) {
                btn.addEventListener('click', guardarCambiosCita);
                console.log('Botón guardar encontrado después de timeout');
            }
        }, 1000);
    }
    document.getElementById('editarCitaModal')?.addEventListener('shown.bs.modal', function() {
        const btn = document.getElementById('guardarCambios');
        if (btn && !btn.hasListener) {
            btn.addEventListener('click', guardarCambiosCita);
            btn.hasListener = true;
            console.log('Event listener agregado al abrir modal');
        }
    });
}

async function editarCita(citaId) {
   try {
        const modal = document.getElementById('editarCitaModal');
        if (!modal) throw new Error('Modal de edición no encontrado');
        const cita = citasData.find(c => c.id_cita == citaId);
        if (!cita) throw new Error('Cita no encontrada');
        document.getElementById('cliente').value = cita.clienteNombre || '';
        document.getElementById('servicio').value = cita.servicioId || '';
        document.getElementById('barberoModal').value = cita.barberoId || ''; 
        document.getElementById('fechaModal').value = cita.fecha ? cita.fecha.split('T')[0] : '';
        document.getElementById('horaModal').value = cita.hora ? cita.hora.substring(0, 5) : '';
        document.getElementById('estadoModal').value = cita.estado || 'pendiente';
        citaEditando = cita;
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    } catch (error) {
        console.error('Error al preparar edición:', error);
        Swal.fire('Error', error.message, 'error');
    }
}


async function cargarServiciosModal() {
    try {
        const response = await fetch(`${API_BASE_URL}/servicios`);
        if (response.ok) {
            const servicios = await response.json();
            llenarSelectServiciosModal(servicios);
        }
    } catch (error) {
        console.error('Error al cargar servicios:', error);
    }
}

function llenarSelectServiciosModal(servicios) {
    const selectServicio = document.getElementById('editServicioId');
    if (!selectServicio) return;

    selectServicio.innerHTML = '<option value="">Seleccionar servicio</option>';

    servicios.forEach(servicio => {
        const option = document.createElement('option');
        option.value = servicio.id_servicio;
        option.textContent = `${servicio.descripcion} - $${servicio.costo} MXN`;
        option.selected = (servicio.id_servicio == citaEditando.servicioId);
        selectServicio.appendChild(option);
    });
}

async function cargarBarberosModal() {
    try {
        const response = await fetch(`${API_BASE_URL}/barberos`);
        if (response.ok) {
            const barberos = await response.json();
            llenarSelectBarberosModal(barberos);
        }
    } catch (error) {
        console.error('Error al cargar barberos:', error);
    }
}

function llenarSelectBarberosModal(barberos) {
    const selectBarbero = document.getElementById('editBarberoId');
    if (!selectBarbero) return;

    selectBarbero.innerHTML = '<option value="">Sin asignar</option>';

    barberos.forEach(barbero => {
        const option = document.createElement('option');
        option.value = barbero.id_barbero;
        option.textContent = barbero.nombre;
        option.selected = (barbero.id_barbero == citaEditando.barberoId);
        selectBarbero.appendChild(option);
    });
}

async function guardarCambiosCita() {
    console.log('Función guardarCambiosCita ejecutándose');
    
    if (!citaEditando) {
        console.error('No hay cita editando');
        Swal.fire('Error', 'No hay cita seleccionada para editar', 'error');
        return;
    }

    try {
        const cliente = document.getElementById('cliente');
        const servicio = document.getElementById('servicio');
        const fechaModal = document.getElementById('fechaModal');
        const horaModal = document.getElementById('horaModal');

        if (!cliente?.value.trim()) {
            Swal.fire('Error', 'El campo cliente es requerido', 'error');
            return;
        }

        if (!servicio?.value) {
            Swal.fire('Error', 'El campo servicio es requerido', 'error');
            return;
        }

        if (!fechaModal?.value) {
            Swal.fire('Error', 'El campo fecha es requerido', 'error');
            return;
        }

        if (!horaModal?.value) {
            Swal.fire('Error', 'El campo hora es requerido', 'error');
            return;
        }

        const btnGuardar = document.getElementById('guardarCambios');
        const originalText = btnGuardar.innerHTML;
        btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
        btnGuardar.disabled = true;

        const citaActualizada = {
            fecha: fechaModal.value,
            hora: horaModal.value + ':00',
            barberoId: document.getElementById('barberoModal').value ? 
                parseInt(document.getElementById('barberoModal').value) : null,
            servicioId: parseInt(servicio.value),
            clienteNombre: cliente.value.trim(),
            estado: document.getElementById('estadoModal').value
        };

        console.log('Datos a enviar:', citaActualizada);
        console.log('URL:', `${API_BASE_URL}/citas/${citaEditando.id_cita}`);

        const response = await fetch(`${API_BASE_URL}/citas/${citaEditando.id_cita}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(citaActualizada)
        });

        if (response.ok) {
            const modalElement = document.getElementById('editarCitaModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();

            await Swal.fire({
                title: '¡Actualizada!',
                text: 'La cita ha sido actualizada exitosamente.',
                icon: 'success',
                confirmButtonColor: '#0d6efd'
            });
            
            await cargarCitas();
            
        } else {
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}`);
        }

    } catch (error) {
        console.error('Error al guardar cambios:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo actualizar la cita: ' + error.message,
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
    } finally {
        const btnGuardar = document.getElementById('guardarCambios');
        if (btnGuardar) {
            btnGuardar.innerHTML = 'Guardar Cambios';
            btnGuardar.disabled = false;
        }
    }
}

async function eliminarCita(citaId) {
    try {
        const confirmacion = await Swal.fire({
            title: '¿Eliminar cita?',
            text: '¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545'
        });

        if (confirmacion.isConfirmed) {
            const response = await fetch(`${API_BASE_URL}/citas/${citaId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await Swal.fire('¡Eliminada!', 'La cita ha sido eliminada exitosamente.', 'success');
                await cargarCitas(); 
            } else {
                const errorText = await response.text();
                throw new Error(errorText);
            }
        }
    } catch (error) {
        console.error('Error al eliminar cita:', error);
        Swal.fire('Error', 'No se pudo eliminar la cita: ' + error.message, 'error');
    }
}


async function cargarServicios() {
    try {
        mostrarLoadingServicios(true);
        const response = await fetch(`${API_BASE_URL}/servicios`);

        if (response.ok) {
            serviciosData = await response.json();
            llenarSelectServicios(serviciosData);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Error cargando servicios:', error);
        usarServiciosDePrueba();
    } finally {
        mostrarLoadingServicios(false);
    }
}

async function cargarBarberos() {
    try {
        mostrarLoadingBarberos(true);
        const response = await fetch(`${API_BASE_URL}/barberos`);

        if (response.ok) {
            barberosData = await response.json();
            llenarSelectBarberos(barberosData);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Error cargando barberos:', error);
        usarBarberosDePrueba();
    } finally {
        mostrarLoadingBarberos(false);
    }
}

function llenarSelectServicios(servicios) {
    const selectServicio = document.getElementById('servicio');
    if (!selectServicio) return;

    selectServicio.innerHTML = '<option value="" selected disabled>Selecciona un servicio</option>';

    servicios.forEach(servicio => {
        const option = document.createElement('option');
        option.value = servicio.id_servicio;
        option.textContent = `${servicio.descripcion} - $${servicio.costo} MXN`;
        option.setAttribute('data-costo', servicio.costo);
        option.setAttribute('data-descripcion', servicio.descripcion);
        selectServicio.appendChild(option);
    });
}

function llenarSelectBarberos(barberos) {
    const selectBarbero = document.getElementById('barbero');
    if (!selectBarbero) return;

    selectBarbero.innerHTML = '<option value="" selected>Sin preferencia</option>';

    barberos.forEach(barbero => {
        const option = document.createElement('option');
        option.value = barbero.id_barbero;
        option.textContent = barbero.nombre;
        selectBarbero.appendChild(option);
    });
}

function generarHorasDisponibles() {
    const selectHora = document.getElementById('hora');
    if (!selectHora) return;

    selectHora.innerHTML = '<option value="" selected disabled>Selecciona una hora</option>';

    for (let hora = 9; hora <= 19; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
            const hora24 = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:00`;
            const hora12 = formato12h(hora, minuto);

            const option = document.createElement('option');
            option.value = hora24;
            option.textContent = hora12;
            selectHora.appendChild(option);
        }
    }
}

function validarNombre() {
    const input = document.getElementById('nombre');
    if (!input) return true;

    const value = input.value.trim();

    if (value.length < 2) {
        input.classList.add('is-invalid');
        return false;
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        input.classList.add('is-invalid');
        return false;
    }

    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    return true;
}

function validarTelefono() {
    const input = document.getElementById('telefono');
    if (!input) return true;

    const value = input.value.replace(/\D/g, '');

    if (value.length !== 10) {
        input.classList.add('is-invalid');
        return false;
    }

    input.value = value;
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    return true;
}

function validarFecha() {
    const input = document.getElementById('fecha');
    if (!input) return true;

    const fechaSeleccionada = new Date(input.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
        input.classList.add('is-invalid');
        Swal.fire('Fecha inválida', 'No puedes seleccionar una fecha pasada', 'warning');
        input.value = hoy.toISOString().split('T')[0];
        return false;
    }

    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    return true;
}

function validarFormulario() {
    const nombreValido = validarNombre();
    const telefonoValido = validarTelefono();
    const servicioValido = document.getElementById('servicio') ? document.getElementById('servicio').value !== '' : true;
    const fechaValida = validarFecha();
    const horaValida = document.getElementById('hora') ? document.getElementById('hora').value !== '' : true;

    return nombreValido && telefonoValido && servicioValido && fechaValida && horaValida;
}

async function manejarEnvioFormulario(e) {
    e.preventDefault();

    if (!validarFormulario()) {
        Swal.fire('Error', 'Por favor completa todos los campos requeridos correctamente', 'error');
        return;
    }

    await enviarCita();
}

async function enviarCita() {
    const submitBtn = document.querySelector('#citaForm button[type="submit"]');
    if (!submitBtn) return;

    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Agendando...';
        submitBtn.disabled = true;
        const datosCita = obtenerDatosFormulario();
        const confirmacion = await mostrarConfirmacion(datosCita);

        if (confirmacion) {
            const resultado = await enviarAlBackend(datosCita);
            await mostrarResultadoExitoso(resultado, datosCita);
            limpiarFormulario();
        }

    } catch (error) {
        await manejarError(error);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function obtenerDatosFormulario() {
    const servicioSelect = document.getElementById('servicio');
    const servicioOption = servicioSelect ? servicioSelect.options[servicioSelect.selectedIndex] : null;

    return {
        nombre: document.getElementById('nombre') ? document.getElementById('nombre').value.trim() : '',
        telefono: document.getElementById('telefono') ? document.getElementById('telefono').value : '',
        servicioId: servicioSelect ? servicioSelect.value : '',
        servicioDescripcion: servicioOption ? servicioOption.getAttribute('data-descripcion') : '',
        servicioCosto: servicioOption ? servicioOption.getAttribute('data-costo') : '',
        barberoId: document.getElementById('barbero') ? document.getElementById('barbero').value || null : null,
        barberoNombre: document.getElementById('barbero') ? document.getElementById('barbero').options[document.getElementById('barbero').selectedIndex].text : '',
        fecha: document.getElementById('fecha') ? document.getElementById('fecha').value : '',
        hora: document.getElementById('hora') ? document.getElementById('hora').value : '',
        comentarios: document.getElementById('comentarios') ? document.getElementById('comentarios').value.trim() : ''
    };
}

async function mostrarConfirmacion(datos) {
    const fechaFormateada = new Date(datos.fecha).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const [horaNum] = datos.hora.split(':');
    const horaFormateada = formato12h(parseInt(horaNum), 0);

    const { value: confirmar } = await Swal.fire({
        title: '¿Confirmar cita?',
        html: `
            <div class="text-start">
                <div class="border-bottom pb-2 mb-2">
                    <strong class="text-primary">Resumen de la cita</strong>
                </div>
                <p><strong>👤 Cliente:</strong> ${datos.nombre}</p>
                <p><strong>📞 Teléfono:</strong> ${datos.telefono}</p>
                <p><strong>✂️ Servicio:</strong> ${datos.servicioDescripcion} - $${datos.servicioCosto} MXN</p>
                <p><strong>👨‍💼 Barbero:</strong> ${datos.barberoId ? datos.barberoNombre : 'Sin preferencia'}</p>
                <p><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
                <p><strong>⏰ Hora:</strong> ${horaFormateada}</p>
                ${datos.comentarios ? `<p><strong>💬 Comentarios:</strong> ${datos.comentarios}</p>` : ''}
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, agendar cita',
        cancelButtonText: 'Revisar datos',
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d',
        width: '600px'
    });

    return confirmar;
}

async function enviarAlBackend(datosCita) {
    const cliente = await crearClienteTemporal(datosCita.nombre, datosCita.telefono);

    const citaData = {
        fecha: datosCita.fecha,
        hora: datosCita.hora,
        barberoId: datosCita.barberoId ? parseInt(datosCita.barberoId) : null,
        clienteId: cliente.id_cliente,
        clienteNombre: datosCita.nombre,
        servicioId: parseInt(datosCita.servicioId)
    };

    const response = await fetch(`${API_BASE_URL}/citas`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(citaData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
}

async function crearClienteTemporal(nombre, telefono) {
    try {
        const clienteData = {
            nombre: nombre,
            correo: `${nombre.replace(/\s+/g, '').toLowerCase()}@email.com`,
            contrasenia: "temp123",
            telefono: telefono
        };

        const response = await fetch(`${API_BASE_URL}/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(clienteData)
        });

        if (response.ok) {
            return await response.json();
        }
        throw new Error('Error creando cliente');
    } catch (error) {
        return {
            id_cliente: Math.floor(Math.random() * 1000) + 1,
            nombre: nombre,
            correo: `${nombre.replace(/\s+/g, '').toLowerCase()}@email.com`
        };
    }
}

async function mostrarResultadoExitoso(resultado, datos) {
    await Swal.fire({
        title: '¡Cita agendada! 🎉',
        html: `
            <div class="text-center">
                <i class="fas fa-check-circle text-success mb-3" style="font-size: 4rem;"></i>
                <h4 class="text-success">¡Reserva confirmada!</h4>
                <p class="mb-2"><strong>ID de cita:</strong> #${resultado.id_cita}</p>
                <p class="mb-2"><strong>Servicio:</strong> ${datos.servicioDescripcion}</p>
                <p class="mb-2"><strong>Fecha:</strong> ${new Date(datos.fecha).toLocaleDateString('es-ES')}</p>
                <p class="mb-3"><strong>Hora:</strong> ${formato12h(parseInt(datos.hora.split(':')[0]), 0)}</p>
                <div class="alert alert-info small">
                    <i class="fas fa-info-circle me-2"></i>
                    Te esperamos 15 minutos antes de tu cita
                </div>
            </div>
        `,
        icon: 'success',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0d6efd',
        width: '500px'
    });
}

function limpiarFormulario() {
    const citaForm = document.getElementById('citaForm');
    if (citaForm) {
        citaForm.reset();
        const fechaInput = document.getElementById('fecha');
        if (fechaInput) {
            fechaInput.value = new Date().toISOString().split('T')[0];
        }
        document.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
    }
}

async function manejarError(error) {
    console.error('Error agendando cita:', error);

    let mensajeError = 'No se pudo agendar la cita. ';
    if (error.message.includes('Error del servidor') || error.message.includes('Error')) {
        mensajeError += error.message;
    } else {
        mensajeError += 'Por favor intenta nuevamente.';
    }

    await Swal.fire({
        title: 'Error',
        text: mensajeError,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc3545'
    });
}
function formato12h(hora, minuto) {
    const periodo = hora >= 12 ? 'PM' : 'AM';
    const hora12 = hora % 12 || 12;
    return `${hora12}:${minuto.toString().padStart(2, '0')} ${periodo}`;
}

function mostrarLoadingServicios(mostrar) {
    const select = document.getElementById('servicio');
    if (select && mostrar) {
        select.innerHTML = '<option value="" disabled>Cargando servicios...</option>';
    }
}

function mostrarLoadingBarberos(mostrar) {
    const select = document.getElementById('barbero');
    if (select && mostrar) {
        select.innerHTML = '<option value="" disabled>Cargando barberos...</option>';
    }
}

function mostrarLoading(mostrar) {
    const tbody = document.querySelector('#tablaCitas tbody');
    if (!tbody) return;

    if (mostrar) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2 text-muted">Cargando citas...</p>
                </td>
            </tr>
        `;
    }
}

function mostrarErrorCarga() {
    Swal.fire({
        title: 'Error de conexión',
        text: 'No se pudieron cargar los datos. Usando información local.',
        icon: 'warning',
        timer: 3000
    });
}

function mostrarError(mensaje) {
    const tbody = document.querySelector('#tablaCitas tbody');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                <i class="fas fa-exclamation-triangle fa-2x text-danger mb-2"></i>
                <p class="text-danger">${mensaje}</p>
                <button class="btn btn-primary btn-sm" onclick="cargarCitas()">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </td>
        </tr>
    `;
}

function usarServiciosDePrueba() {
    serviciosData = [
        { id_servicio: 1, descripcion: "Corte de Cabello", costo: 150 },
        { id_servicio: 2, descripcion: "Arreglo de Barba", costo: 100 },
        { id_servicio: 3, descripcion: "Corte + Barba", costo: 220 },
        { id_servicio: 4, descripcion: "Afeitado Clásico", costo: 120 },
        { id_servicio: 5, descripcion: "Tinte de Barba", costo: 180 }
    ];
    llenarSelectServicios(serviciosData);
}

function usarBarberosDePrueba() {
    barberosData = [
        { id_barbero: 1, nombre: "Carlos Mendoza" },
        { id_barbero: 2, nombre: "Javier López" },
        { id_barbero: 3, nombre: "Miguel Ángel" }
    ];
    llenarSelectBarberos(barberosData);
}


function aplicarFiltros() {
    const fechaFiltro = document.getElementById('fechaFiltro')?.value;
    const barberoFiltro = document.getElementById('barberoFiltro')?.value;

    let citasFiltradas = citasData;

    if (fechaFiltro) {
        citasFiltradas = citasFiltradas.filter(cita => {
            const fechaCita = new Date(cita.fecha).toISOString().split('T')[0];
            return fechaCita === fechaFiltro;
        });
    }

    if (barberoFiltro) {
        citasFiltradas = citasFiltradas.filter(cita => {
            return cita.barberoId && cita.barberoId == barberoFiltro;
        });
    }

    mostrarCitas(citasFiltradas);
    actualizarContadorCitas(citasFiltradas.length); editarCita
}

function actualizarContadorCitas(total) {
    const contador = document.getElementById('contadorCitas');
    if (contador) {
        contador.textContent = `${total} citas`;
    }
}

window.recargarServicios = cargarServicios;
window.recargarBarberos = cargarBarberos;
window.cargarCitas = cargarCitas;
window.guardarCambiosCita = guardarCambiosCita;
window.aplicarFiltros = aplicarFiltros;
