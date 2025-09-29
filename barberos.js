const API_BASE_URL = 'http://localhost:8080/api';

let barberos = [];
let barberoEditando = null;
let vistaActual = 'grid';

document.addEventListener('DOMContentLoaded', function () {
    inicializarAOS();
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) adminPanel.classList.remove('d-none');

    cargarBarberos();
    configurarEventListeners();
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
    document.getElementById('btnGuardarBarbero').addEventListener('click', guardarBarbero);
    document.getElementById('buscarBarbero').addEventListener('input', filtrarBarberos);
    document.getElementById('filtroEspecialidad').addEventListener('change', filtrarBarberos);
    document.getElementById('crearBarberoModal').addEventListener('hidden.bs.modal', function () {
        limpiarFormularioBarbero();
        barberoEditando = null;
    });

    document.getElementById('fotoInput').addEventListener('change', function(e) {
        manejarSeleccionImagen(e);
    });
}


function manejarSeleccionImagen(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('fotoPreview');
    
    if (!file) {
        preview.innerHTML = '<span class="text-muted">No hay imagen seleccionada</span>';
        return;
    }

    if (!file.type.match('image.*')) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor selecciona un archivo de imagen válido',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        event.target.value = '';
        preview.innerHTML = '<span class="text-muted">No hay imagen seleccionada</span>';
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
            title: 'Error',
            text: 'La imagen es demasiado grande. Máximo 2MB permitido.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        event.target.value = '';
        preview.innerHTML = '<span class="text-muted">No hay imagen seleccionada</span>';
        return;
    }

    comprimirImagen(file, 800, 0.7)
        .then(blob => {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" class="img-fluid" style="max-height: 100px;" alt="Vista previa">`;
            };
            reader.readAsDataURL(blob);
            
            const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
            });
            
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(compressedFile);
            event.target.files = dataTransfer.files;
            
            console.log('✅ Imagen comprimida:', {
                original: `${(file.size / 1024).toFixed(2)} KB`,
                comprimida: `${(blob.size / 1024).toFixed(2)} KB`,
                reduccion: `${((1 - blob.size / file.size) * 100).toFixed(1)}%`
            });
        })
        .catch(error => {
            console.error('Error comprimiendo imagen:', error);
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" class="img-fluid" style="max-height: 100px;" alt="Vista previa">`;
            };
            reader.readAsDataURL(file);
        });
}

function comprimirImagen(file, maxWidth, calidad = 0.8) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
+            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(blob => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('No se pudo comprimir la imagen'));
                }
            }, 'image/jpeg', calidad);
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        if (file.size > 500 * 1024) {
            comprimirImagen(file, 600, 0.6)
                .then(blob => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        console.log(`📏 Tamaño base64 final: ${reader.result.length} caracteres`);
                        if (reader.result.length > 1000000) {
                            console.warn('⚠️ Imagen muy grande después de compresión');
                        }
                        resolve(reader.result);
                    };
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(blob);
                })
                .catch(error => {
                    console.error('Error en compresión, usando original:', error);
                    // Fallback a conversión normal
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                });
        } else {
            const reader = new FileReader();
            reader.onload = () => {
                console.log(`📏 Tamaño base64: ${reader.result.length} caracteres`);
                resolve(reader.result);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        }
    });
}


async function cargarBarberos() {
    try {
        mostrarLoading(true);
        const response = await fetch(`${API_BASE_URL}/barberos`);

        if (response.ok) {
            barberos = await response.json();
            mostrarBarberos(barberos);
            actualizarEstadisticas();
            actualizarContador();
        } else {
            throw new Error(`Error ${response.status}`);
        }
    } catch (error) {
        console.error('Error cargando barberos:', error);
        usarBarberosDePrueba();
    } finally {
        mostrarLoading(false);
    }
}

function mostrarBarberos(barberosMostrar) {
    const contenedor = document.getElementById('barberos-grid');
    const sinBarberos = document.getElementById('sin-barberos');

    if (!Array.isArray(barberosMostrar) || barberosMostrar.length === 0) {
        contenedor.innerHTML = '';
        sinBarberos.classList.remove('d-none');
        return;
    }

    sinBarberos.classList.add('d-none');

    if (vistaActual === 'grid') {
        contenedor.innerHTML = barberosMostrar.map(barbero => crearCardBarbero(barbero)).join('');
    } else {
        contenedor.innerHTML = barberosMostrar.map(barbero => crearFilaBarbero(barbero)).join('');
    }

    setTimeout(() => {
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                editarBarbero(btn.dataset.id);
            });
        });

        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                eliminarBarbero(btn.dataset.id);
            });
        });

        document.querySelectorAll('.btn-actualizar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                actualizarBarbero(btn.dataset.id);
            });
        });

        document.querySelectorAll('.btn-seleccionar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                seleccionarBarbero(btn.dataset.id, btn.dataset.nombre);
            });
        });
    }, 100);
}

function crearCardBarbero(barbero) {
    const experiencia = barbero.experiencia || 0;
    const especialidad = barbero.especialidad || 'Barbero Profesional';
    const id = barbero.id_barbero ?? barbero.id;

    return `
    <div class="col-lg-4 col-md-6" data-aos="fade-up">
      <div class="barbero-card card h-100 ${barbero.activo === false ? 'no-disponible' : 'disponible'}">
        <div class="card-body text-center p-4">
          ${barbero.foto
            ? `<img src="${barbero.foto}" alt="${barbero.nombre}" class="barbero-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
            : ''
          }
          ${!barbero.foto 
            ? `<div class="default-avatar"><i class="fas fa-user"></i></div>`
            : ''
          }

          <h4 class="card-title fw-bold">${barbero.nombre}</h4>
          <p class="text-muted mb-2">${especialidad}</p>

          <div class="mb-3">
            <span class="experiencia-badge">${experiencia} años de experiencia</span>
          </div>

          <p class="card-text small text-muted">
            ${barbero.descripcion || 'Barbero profesional con amplia experiencia en cortes clásicos y modernos.'}
          </p>

          <div class="rating mb-3">
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star-half-alt"></i>
          </div>

          <!-- Botones SIEMPRE visibles -->
          <div class="acciones-grupo">
            <button class="btn btn-actualizar btn-sm" data-id="${id}">
              <i class="fas fa-sync-alt me-1"></i>Actualizar
            </button>
            <button class="btn btn-editar btn-sm" data-id="${id}">
              <i class="fas fa-edit me-1"></i>Editar
            </button>
            <button class="btn btn-eliminar btn-sm" data-id="${id}">
              <i class="fas fa-trash me-1"></i>Eliminar
            </button>
          </div>

          <button class="btn btn-primary w-100 mt-2 btn-seleccionar" 
                  data-id="${id}" 
                  data-nombre="${barbero.nombre}">
            <i class="fas fa-calendar-plus me-2"></i>Seleccionar para Cita
          </button>
        </div>
      </div>
    </div>
  `;
}

function crearFilaBarbero(barbero) {
    const experiencia = barbero.experiencia || 0;
    const especialidad = barbero.especialidad || 'Barbero Profesional';
    const id = barbero.id_barbero ?? barbero.id;

    return `
    <div class="col-12" data-aos="fade-up">
      <div class="barbero-lista ${barbero.activo === false ? 'no-disponible' : 'disponible'}">
        <div class="row align-items-center">
          <div class="col-md-1 text-center">
            ${barbero.foto
              ? `<img src="${barbero.foto}" alt="${barbero.nombre}" class="barbero-image" style="width: 60px; height: 60px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
              : ''
            }
            ${!barbero.foto 
              ? `<div class="default-avatar" style="width: 60px; height: 60px; font-size: 1.5rem;">
                   <i class="fas fa-user"></i>
                 </div>`
              : ''
            }
          </div>
          <div class="col-md-3">
            <h5 class="mb-1">${barbero.nombre}</h5>
            <p class="text-muted mb-0 small">${especialidad}</p>
          </div>
          <div class="col-md-2 text-center">
            <span class="experiencia-badge">${experiencia} años</span>
          </div>
          <div class="col-md-3">
            <p class="mb-0 small text-muted">${barbero.descripcion || 'Barbero profesional'}</p>
          </div>
          <div class="col-md-3 text-end">
            <button class="btn btn-primary btn-sm me-1 btn-seleccionar" 
                    data-id="${id}" 
                    data-nombre="${barbero.nombre}">
              <i class="fas fa-calendar-plus me-1"></i>Seleccionar
            </button>

            <!-- Botones SIEMPRE visibles -->
            <div class="btn-group">
              <button class="btn btn-actualizar btn-sm me-1" data-id="${id}">
                <i class="fas fa-sync-alt"></i>
              </button>
              <button class="btn btn-editar btn-sm me-1" data-id="${id}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-eliminar btn-sm" data-id="${id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}


function editarBarbero(id) {
    barberoEditando = barberos.find(b => (b.id_barbero ?? b.id) == id);
    if (!barberoEditando) return;

    document.getElementById('modalTitulo').textContent = 'Editar Barbero';
    document.getElementById('btnGuardarBarbero').innerHTML = '<i class="fas fa-save me-2"></i>Actualizar Barbero';
    document.getElementById('barberoId').value = barberoEditando.id_barbero ?? barberoEditando.id ?? '';
    document.getElementById('nombre').value = barberoEditando.nombre || '';
    document.getElementById('especialidad').value = barberoEditando.especialidad || '';
    document.getElementById('experiencia').value = barberoEditando.experiencia || '';
    document.getElementById('edad').value = barberoEditando.edad || '';
    document.getElementById('telefono').value = barberoEditando.telefono || '';
    document.getElementById('descripcion').value = barberoEditando.descripcion || '';
    document.getElementById('horario').value = barberoEditando.horario || '';
    document.getElementById('email').value = barberoEditando.email || '';
    document.getElementById('activo').checked = barberoEditando.activo !== false;

    const preview = document.getElementById('fotoPreview');
    const fotoInput = document.getElementById('fotoInput');
    
    if (barberoEditando.foto) {
        preview.innerHTML = `<img src="${barberoEditando.foto}" class="img-fluid" style="max-height: 100px;" alt="Vista previa">`;
        fotoInput.value = '';
    } else {
        preview.innerHTML = '<span class="text-muted">No hay imagen seleccionada</span>';
        fotoInput.value = '';
    }

    const modal = new bootstrap.Modal(document.getElementById('crearBarberoModal'));
    modal.show();
}

async function actualizarBarbero(id) {
    const barbero = barberos.find(b => (b.id_barbero ?? b.id) == id);
    if (!barbero) return;

    try {
        mostrarLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        await Swal.fire({
            title: '¡Actualizado!',
            text: `La información de ${barbero.nombre} ha sido actualizada`,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            timer: 2000
        });

        await cargarBarberos();
    } catch (error) {
        console.error('Error actualizando barbero:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo actualizar la información del barbero',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    } finally {
        mostrarLoading(false);
    }
}

async function eliminarBarbero(id) {
    const barbero = barberos.find(b => (b.id_barbero ?? b.id) == id);
    if (!barbero) return;

    const confirmacion = await Swal.fire({
        title: '¿Eliminar barbero?',
        html: `¿Estás seguro de que deseas eliminar a <strong>"${barbero.nombre}"</strong>?<br><small class="text-muted">Esta acción no se puede deshacer</small>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545',
        reverseButtons: true
    });

    if (confirmacion.isConfirmed) {
        try {
            const response = await fetch(`${API_BASE_URL}/barberos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await Swal.fire({
                    title: '¡Eliminado!',
                    text: `El barbero ${barbero.nombre} ha sido eliminado correctamente`,
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                    timer: 2000
                });

                await cargarBarberos();
            } else {
                throw new Error('Error al eliminar el barbero');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo eliminar el barbero. Por favor intenta nuevamente.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    }
}

async function guardarBarbero() {
    const formulario = document.getElementById('formBarbero');
    const fotoInput = document.getElementById('fotoInput');

    if (!formulario.checkValidity()) {
        formulario.classList.add('was-validated');
        return;
    }

    try {
        mostrarLoading(true);
        
        let imagenBase64 = null;
        
        if (fotoInput.files.length > 0) {
            console.log('📷 Procesando imagen...');
            imagenBase64 = await convertirImagenABase64(fotoInput.files[0]);
            console.log('✅ Imagen convertida a base64');
        }

        const barberoData = {
            nombre: document.getElementById('nombre').value.trim(),
            especialidad: document.getElementById('especialidad').value,
            experiencia: parseInt(document.getElementById('experiencia').value) || 0,
            edad: parseInt(document.getElementById('edad').value) || null,
            telefono: document.getElementById('telefono').value.trim() || null,
            descripcion: document.getElementById('descripcion').value.trim() || null,
            horario: document.getElementById('horario').value || null,
            foto: imagenBase64,
            email: document.getElementById('email').value.trim() || null,
            activo: document.getElementById('activo').checked
        };

        console.log('📤 Enviando datos del barbero:', {
            ...barberoData,
            foto: barberoData.foto ? `base64 (${barberoData.foto.length} caracteres)` : 'null'
        });

        const idEditar = document.getElementById('barberoId').value || (barberoEditando && (barberoEditando.id_barbero ?? barberoEditando.id));

        if (idEditar) {
            await actualizarBarberoBackend(idEditar, barberoData);
        } else {
            await crearBarberoBackend(barberoData);
        }
    } catch (error) {
        console.error('❌ Error general:', error);
        Swal.fire({
            title: 'Error',
            html: `No se pudo guardar el barbero.<br><small>${error.message}</small>`,
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    } finally {
        mostrarLoading(false);
    }
}

async function crearBarberoBackend(barberoData) {
    console.log('🔄 Intentando crear barbero en el backend...');
    
    const response = await fetch(`${API_BASE_URL}/barberos`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(barberoData)
    });

    console.log('📨 Respuesta del servidor:', response.status, response.statusText);

    if (response.ok) {
        const barberoGuardado = await response.json();
        console.log('✅ Barbero creado exitosamente:', barberoGuardado);
        
        await mostrarExitoYCerrar('creado');
        await cargarBarberos();
    } else {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText || 'Error del servidor'}`);
    }
}

async function actualizarBarberoBackend(id, barberoData) {
    console.log('🔄 Actualizando barbero existente...');
    
    const response = await fetch(`${API_BASE_URL}/barberos/${id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(barberoData)
    });

    console.log('📨 Respuesta del servidor:', response.status);

    if (response.ok) {
        await mostrarExitoYCerrar('actualizado');
        await cargarBarberos();
    } else {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
    }
}

async function mostrarExitoYCerrar(accion) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('crearBarberoModal'));
    if (modal) modal.hide();

    await Swal.fire({
        title: '¡Éxito!',
        text: `Barbero ${accion} correctamente`,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        timer: 2000
    });
}

function limpiarFormularioBarbero() {
    document.getElementById('formBarbero').reset();
    document.getElementById('formBarbero').classList.remove('was-validated');
    document.getElementById('barberoId').value = '';
    document.getElementById('fotoPreview').innerHTML = '<span class="text-muted">No hay imagen seleccionada</span>';
}

function filtrarBarberos() {
    const busqueda = document.getElementById('buscarBarbero').value.toLowerCase();
    const filtroEspecialidad = document.getElementById('filtroEspecialidad').value;

    let barberosFiltrados = barberos;

    if (busqueda) {
        barberosFiltrados = barberosFiltrados.filter(barbero =>
            (barbero.nombre && barbero.nombre.toLowerCase().includes(busqueda)) ||
            (barbero.especialidad && barbero.especialidad.toLowerCase().includes(busqueda)) ||
            (barbero.descripcion && barbero.descripcion.toLowerCase().includes(busqueda))
        );
    }

    if (filtroEspecialidad) {
        barberosFiltrados = barberosFiltrados.filter(barbero =>
            barbero.especialidad && barbero.especialidad.toLowerCase().includes(filtroEspecialidad.toLowerCase())
        );
    }

    mostrarBarberos(barberosFiltrados);
    actualizarContador(barberosFiltrados.length);
}

function limpiarFiltros() {
    document.getElementById('buscarBarbero').value = '';
    document.getElementById('filtroEspecialidad').value = '';
    filtrarBarberos();
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

    mostrarBarberos(barberos);
}

function seleccionarBarbero(id, nombre) {
    localStorage.setItem('barberoSeleccionado', JSON.stringify({ id, nombre }));

    Swal.fire({
        title: '¡Barbero seleccionado!',
        text: `Has seleccionado a: ${nombre}`,
        icon: 'success',
        confirmButtonText: 'Continuar',
        timer: 2000
    }).then(() => {
        window.location.href = 'citas.html';
    });
}

function actualizarEstadisticas() {
    const totalBarberos = barberos.length;
    const experienciaPromedio = barberos.length > 0
        ? Math.round(barberos.reduce((sum, b) => sum + (b.experiencia || 0), 0) / barberos.length)
        : 0;
    const citasTotales = totalBarberos * 25;
    const especialidadesUnicas = new Set(barberos.map(b => b.especialidad)).size;

    document.getElementById('total-barberos').textContent = totalBarberos;
    document.getElementById('experiencia-promedio').textContent = experienciaPromedio;
    document.getElementById('citas-totales').textContent = citasTotales;
    document.getElementById('especialidades').textContent = especialidadesUnicas;
}


function actualizarContador(total = barberos.length) {
    document.getElementById('contadorBarberos').textContent =
        `${total} barbero${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
}

function mostrarLoading(mostrar) {
    const contenedor = document.getElementById('barberos-grid');
    if (mostrar) {
        contenedor.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="loading-spinner text-primary mb-3"></div>
        <p>Cargando barberos...</p>
      </div>
    `;
    }
}

function abrirModalCrear() {
    barberoEditando = null;
    limpiarFormularioBarbero();

    document.getElementById('modalTitulo').textContent = 'Crear Barbero';
    document.getElementById('btnGuardarBarbero').innerHTML = '<i class="fas fa-save me-2"></i>Guardar Barbero';

    const modal = new bootstrap.Modal(document.getElementById('crearBarberoModal'));
    modal.show();
}

function usarBarberosDePrueba() {
    barberos = [
        {
            id_barbero: 1,
            nombre: "Carlos Mendoza",
            especialidad: "Corte Clásico",
            experiencia: 10,
            edad: 35,
            descripcion: "Especialista en cortes tradicionales y técnicas clásicas",
            activo: true
        },
        {
            id_barbero: 2,
            nombre: "Javier López",
            especialidad: "Corte Moderno",
            experiencia: 7,
            edad: 28,
            descripcion: "Experto en tendencias actuales y estilos modernos",
            activo: true
        },
        {
            id_barbero: 3,
            nombre: "Miguel Ángel",
            especialidad: "Afeitado con Navaja",
            experiencia: 12,
            edad: 40,
            descripcion: "Maestro en la técnica tradicional de afeitado con navaja",
            activo: true
        }
    ];
    mostrarBarberos(barberos);
    actualizarEstadisticas();
    actualizarContador();
}

function recargarBarberos() {
    cargarBarberos();
}

// Funciones globales 

window.abrirModalCrear = abrirModalCrear;
window.guardarBarbero = guardarBarbero;
window.cambiarVista = cambiarVista;
window.seleccionarBarbero = seleccionarBarbero;
window.recargarBarberos = recargarBarberos;
window.limpiarFiltros = limpiarFiltros;
window.editarBarbero = editarBarbero;
window.actualizarBarbero = actualizarBarbero;
window.eliminarBarbero = eliminarBarbero;