const API_BASE_URL = 'http://localhost:8080/api';

let servicios = [];
let servicioEditando = null;
let vistaActual = 'grid';

document.addEventListener('DOMContentLoaded', function() {
    inicializarAOS();
    cargarServicios();
    configurarEventListeners();
    verificarModoAdmin();
});

function inicializarAOS() {
    AOS.init({
        duration: 1000,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });
}

function configurarEventListeners() {
    document.getElementById('btnGuardarServicio').addEventListener('click', guardarServicio);
    document.getElementById('buscarServicio').addEventListener('input', filtrarServicios);
    document.getElementById('filtroPrecio').addEventListener('change', filtrarServicios);
    document.getElementById('crearServicioModal').addEventListener('hidden.bs.modal', function() {
        limpiarFormularioServicio();
        servicioEditando = null;
    });
}


async function cargarServicios() {
    try {
        mostrarLoading(true);
        const response = await fetch(`${API_BASE_URL}/servicios`);
        
        if (response.ok) {
            servicios = await response.json();
            mostrarServicios(servicios);
            actualizarContador();
        } else {
            throw new Error(`Error ${response.status}`);
        }
    } catch (error) {
        console.error('Error cargando servicios:', error);
        usarServiciosDePrueba();
    } finally {
        mostrarLoading(false);
    }
}

function mostrarServicios(serviciosMostrar) {
    const contenedor = document.getElementById('servicios-grid');
    const sinServicios = document.getElementById('sin-servicios');
    
    if (serviciosMostrar.length === 0) {
        contenedor.innerHTML = '';
        sinServicios.classList.remove('d-none');
        return;
    }
    
    sinServicios.classList.add('d-none');
    
    if (vistaActual === 'grid') {
        contenedor.innerHTML = serviciosMostrar.map(servicio => crearCardServicio(servicio)).join('');
    } else {
        contenedor.innerHTML = serviciosMostrar.map(servicio => crearFilaServicio(servicio)).join('');
    }
    
    setTimeout(() => {
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                editarServicio(btn.dataset.id);
            });
        });
        
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                eliminarServicio(btn.dataset.id);
            });
        });
    }, 100);
}

function crearCardServicio(servicio) {
  const duracion = servicio.duracion || 45;

  return `
    <div class="col-lg-4 col-md-6" data-aos="fade-up">
      <div class="service-card card h-100">
        <div class="card-body text-center p-4">
          <div class="service-icon">
            <i class="fas ${obtenerIconoServicio(servicio.descripcion)}"></i>
          </div>
          <h4 class="card-title fw-bold">${servicio.descripcion}</h4>
          <p class="card-text text-muted">${servicio.detalles || 'Servicio profesional de calidad'}</p>
          <div class="price-tag d-inline-block mb-3">$${servicio.costo} MXN</div>
          <ul class="feature-list text-start">
            <li>Duración: ${duracion} minutos</li>
            <li>Productos premium</li>
            <li>Resultados garantizados</li>
            <li>Atención personalizada</li>
          </ul>
          <div class="duration-badge d-inline-block mb-3">${duracion} min</div>

          <!-- Botones siempre visibles -->
          <div class="servicio-acciones mt-3">
            <button class="btn btn-outline-primary btn-sm btn-editar" data-id="${servicio.id_servicio}">
              <i class="fas fa-edit me-1"></i>Editar
            </button>
            <button class="btn btn-outline-danger btn-sm btn-eliminar" data-id="${servicio.id_servicio}">
              <i class="fas fa-trash me-1"></i>Eliminar
            </button>
          </div>

          <button class="btn btn-primary w-100 btn-booking mt-2"
            onclick="seleccionarServicio(${servicio.id_servicio}, '${servicio.descripcion}', ${servicio.costo})">
            <i class="fas fa-calendar-plus me-2"></i>Reservar Ahora
          </button>
        </div>
      </div>
    </div>
  `;
}


function crearFilaServicio(servicio) {
  const duracion = servicio.duracion || 45;

  return `
    <div class="col-12" data-aos="fade-up">
      <div class="servicio-lista">
        <div class="row align-items-center">
          <div class="col-md-2 text-center">
            <i class="fas ${obtenerIconoServicio(servicio.descripcion)} fa-2x text-primary"></i>
          </div>
          <div class="col-md-4">
            <h5 class="mb-1">${servicio.descripcion}</h5>
            <p class="text-muted mb-0 small">${servicio.detalles || 'Servicio profesional'}</p>
          </div>
          <div class="col-md-2 text-center">
            <span class="price-tag">$${servicio.costo}</span>
          </div>
          <div class="col-md-2 text-center">
            <span class="duration-badge">${duracion} min</span>
          </div>
          <div class="col-md-2 text-end">
            <button class="btn btn-primary btn-sm me-1"
              onclick="seleccionarServicio(${servicio.id_servicio}, '${servicio.descripcion}', ${servicio.costo})">
              <i class="fas fa-calendar-plus"></i>
            </button>
            <button class="btn btn-outline-primary btn-sm btn-editar me-1" data-id="${servicio.id_servicio}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm btn-eliminar" data-id="${servicio.id_servicio}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}


function obtenerIconoServicio(descripcion) {
    const desc = descripcion.toLowerCase();
    if (desc.includes('corte') && desc.includes('barba')) return 'fa-user-check';
    if (desc.includes('corte')) return 'fa-cut';
    if (desc.includes('barba')) return 'fa-air-freshener';
    if (desc.includes('afeitado')) return 'fa-sharp fa-regular fa-scissors';
    if (desc.includes('tinte')) return 'fa-palette';
    if (desc.includes('tratamiento')) return 'fa-spa';
    return 'fa-scissors';
}


function abrirModalCrear() {
    servicioEditando = null;
    document.getElementById('modalTitulo').textContent = 'Crear Nuevo Servicio';
    document.getElementById('btnGuardarServicio').innerHTML = '<i class="fas fa-save me-2"></i>Crear Servicio';
    
    const modal = new bootstrap.Modal(document.getElementById('crearServicioModal'));
    modal.show();
}

function editarServicio(id) {
    servicioEditando = servicios.find(s => s.id_servicio == id);
    if (!servicioEditando) return;
    
    document.getElementById('modalTitulo').textContent = 'Editar Servicio';
    document.getElementById('btnGuardarServicio').innerHTML = '<i class="fas fa-save me-2"></i>Actualizar Servicio';
    document.getElementById('servicioId').value = servicioEditando.id_servicio;
    document.getElementById('descripcion').value = servicioEditando.descripcion;
    document.getElementById('costo').value = servicioEditando.costo;
    document.getElementById('duracion').value = servicioEditando.duracion || '45';
    document.getElementById('categoria').value = servicioEditando.categoria || 'corte';
    document.getElementById('detalles').value = servicioEditando.detalles || '';
    document.getElementById('disponible').checked = servicioEditando.disponible !== false;
    
    const modal = new bootstrap.Modal(document.getElementById('crearServicioModal'));
    modal.show();
}

async function guardarServicio() {
    const formulario = document.getElementById('formServicio');
    
    if (!formulario.checkValidity()) {
        formulario.classList.add('was-validated');
        return;
    }
    
    try {
        const servicioData = {
            descripcion: document.getElementById('descripcion').value.trim(),
            costo: parseFloat(document.getElementById('costo').value),
            duracion: parseInt(document.getElementById('duracion').value),
            categoria: document.getElementById('categoria').value,
            detalles: document.getElementById('detalles').value.trim(),
            disponible: document.getElementById('disponible').checked
        };
        
        let response;
        if (servicioEditando) {
            response = await fetch(`${API_BASE_URL}/servicios/${servicioEditando.id_servicio}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(servicioData)
            });
        } else {
            response = await fetch(`${API_BASE_URL}/servicios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(servicioData)
            });
        }
        
        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('crearServicioModal'));
            modal.hide();
            
            await Swal.fire({
                title: '¡Éxito!',
                text: servicioEditando ? 'Servicio actualizado correctamente' : 'Servicio creado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });
            
            await cargarServicios();
        } else {
            throw new Error('Error al guardar el servicio');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo guardar el servicio. Por favor intenta nuevamente.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

async function eliminarServicio(id) {
    const servicio = servicios.find(s => s.id_servicio == id);
    if (!servicio) return;
    
    const confirmacion = await Swal.fire({
        title: '¿Eliminar servicio?',
        html: `¿Estás seguro de que deseas eliminar el servicio <strong>"${servicio.descripcion}"</strong>?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545'
    });
    
    if (confirmacion.isConfirmed) {
        try {
            const response = await fetch(`${API_BASE_URL}/servicios/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await Swal.fire({
                    title: '¡Eliminado!',
                    text: 'El servicio ha sido eliminado correctamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });
                
                await cargarServicios();
            } else {
                throw new Error('Error al eliminar el servicio');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo eliminar el servicio.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    }
}

function limpiarFormularioServicio() {
    document.getElementById('formServicio').reset();
    document.getElementById('formServicio').classList.remove('was-validated');
    document.getElementById('servicioId').value = '';
}


function filtrarServicios() {
    const busqueda = document.getElementById('buscarServicio').value.toLowerCase();
    const filtroPrecio = document.getElementById('filtroPrecio').value;
    
    let serviciosFiltrados = servicios;
    
    if (busqueda) {
        serviciosFiltrados = serviciosFiltrados.filter(servicio =>
            servicio.descripcion.toLowerCase().includes(busqueda) ||
            (servicio.detalles && servicio.detalles.toLowerCase().includes(busqueda))
        );
    }
    
    if (filtroPrecio) {
        serviciosFiltrados = serviciosFiltrados.filter(servicio => {
            switch (filtroPrecio) {
                case '0-100': return servicio.costo <= 100;
                case '101-200': return servicio.costo > 100 && servicio.costo <= 200;
                case '201-300': return servicio.costo > 200 && servicio.costo <= 300;
                case '301+': return servicio.costo > 300;
                default: return true;
            }
        });
    }
    
    mostrarServicios(serviciosFiltrados);
    actualizarContador(serviciosFiltrados.length);
}

function limpiarFiltros() {
    document.getElementById('buscarServicio').value = '';
    document.getElementById('filtroPrecio').value = '';
    filtrarServicios();
}


function cambiarVista(tipo) {
    vistaActual = tipo;
    const btnGrid = document.querySelector('[onclick="cambiarVista(\'grid\')"]');
    const btnList = document.querySelector('[onclick="cambiarVista(\'list\')"]');
    
    if (tipo === 'grid') {
        btnGrid.classList.add('filter-active');
        btnList.classList.remove('filter-active');
    } else {
        btnList.classList.add('filter-active');
        btnGrid.classList.remove('filter-active');
    }
    
    mostrarServicios(servicios);
}

function seleccionarServicio(id, nombre, precio) {
    const servicioSeleccionado = { id, nombre, precio };
    
    const selectedServiceDiv = document.getElementById('selected-service');
    selectedServiceDiv.innerHTML = `
        <strong>${nombre}</strong><br>
        <small class="text-success">$${precio} MXN</small>
    `;
    
    const bookingBtn = document.getElementById('booking-btn');
    bookingBtn.classList.remove('btn-primary');
    bookingBtn.classList.add('btn-success');
    
    localStorage.setItem('servicioSeleccionado', JSON.stringify(servicioSeleccionado));
    
    Swal.fire({
        title: '¡Servicio seleccionado!',
        text: `Has seleccionado: ${nombre} - $${precio} MXN`,
        icon: 'success',
        confirmButtonText: 'Continuar',
        timer: 2000
    });
}


function actualizarContador(total = servicios.length) {
    document.getElementById('contadorServicios').textContent = `${total} servicio${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
}

function mostrarLoading(mostrar) {
    const contenedor = document.getElementById('servicios-grid');
    if (mostrar) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="loading-spinner text-primary mb-3"></div>
                <p>Cargando servicios...</p>
            </div>
        `;
    }
}

function usarServiciosDePrueba() {
    servicios = [
        {
            id_servicio: 1,
            descripcion: "Corte de Cabello",
            costo: 150,
            duracion: 45,
            categoria: "corte",
            detalles: "Corte profesional con las últimas tendencias"
        },
        {
            id_servicio: 2,
            descripcion: "Arreglo de Barba",
            costo: 100,
            duracion: 30,
            categoria: "barba",
            detalles: "Dale forma y estilo a tu barba"
        },
        {
            id_servicio: 3,
            descripcion: "Corte + Barba",
            costo: 220,
            duracion: 75,
            categoria: "combo",
            detalles: "Combo completo para lucir impecable"
        }
    ];
    mostrarServicios(servicios);
    actualizarContador();
}

function recargarServicios() {
    cargarServicios();
}


window.abrirModalCrear = abrirModalCrear;
window.cambiarVista = cambiarVista;
window.seleccionarServicio = seleccionarServicio;
window.recargarServicios = recargarServicios;
window.limpiarFiltros = limpiarFiltros;