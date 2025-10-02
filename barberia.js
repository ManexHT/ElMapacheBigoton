document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        duration: 1000,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });

    cargarDatosBarberia();
});

const API_BASE_URL = 'http://localhost:8080/api';

async function fetchBarberos() {
    try {
        const response = await fetch(${API_BASE_URL}/barberos);
        
        if (!response.ok) {
            throw new Error(Error ${response.status}: ${response.statusText});
        }
        
        const barberos = await response.json();
        return barberos;
    } catch (error) {
        console.error('Error al cargar barberos:', error);
        return [
            {
                id_barbero: 1,
                nombre: "Carlos Mendoza",
                especialidad: "Corte Clásico",
                experiencia: 10,
                descripcion: "Especialista en cortes tradicionales y técnicas clásicas",
                foto: "barbero1.jpeg",
                activo: true
            },
            {
                id_barbero: 2,
                nombre: "Javier López",
                especialidad: "Corte Moderno",
                experiencia: 7,
                descripcion: "Expertos en tendencias actuales y estilos modernos",
                foto: "barbero2.jpeg",
                activo: true
            },
            {
                id_barbero: 3,
                nombre: "Miguel Ángel",
                especialidad: "Afeitado con Navaja",
                experiencia: 12,
                descripcion: "Maestro en la técnica tradicional de afeitado con navaja",
                foto: "barbero3.jpeg",
                activo: true
            }
        ];
    }
}

async function fetchServicios() {
    try {
        const response = await fetch(${API_BASE_URL}/servicios);
        
        if (!response.ok) {
            throw new Error(Error ${response.status}: ${response.statusText});
        }
        
        const servicios = await response.json();
        return servicios;
    } catch (error) {
        console.error('Error al cargar servicios:', error);
        return [
            {
                id_servicio: 1,
                descripcion: "Corte de Cabello",
                costo: 150,
                duracion: 45,
                detalles: "Corte profesional con las últimas tendencias",
                disponible: true
            },
            {
                id_servicio: 2,
                descripcion: "Arreglo de Barba",
                costo: 100,
                duracion: 30,
                detalles: "Dale forma y estilo a tu barba",
                disponible: true
            },
            {
                id_servicio: 3,
                descripcion: "Corte + Barba",
                costo: 220,
                duracion: 75,
                detalles: "Combo completo para lucir impecable",
                disponible: true
            },
            {
                id_servicio: 4,
                descripcion: "Tinte de Cabello",
                costo: 200,
                duracion: 60,
                detalles: "Color profesional para un look renovado",
                disponible: true
            }
        ];
    }
}

async function fetchInfoBarberia() {
    try {
        const response = await fetch(${API_BASE_URL}/barberia/info);
        
        if (!response.ok) {
            throw new Error(Error ${response.status}: ${response.statusText});
        }
        
        const info = await response.json();
        return info;
    } catch (error) {
        console.error('Error al cargar información de la barbería:', error);
        return {
            nombre: "Barbería El Mapache Bigotón",
            descripcion: "Donde el estilo se encuentra con la tradición. Cortes clásicos y modernos para el hombre contemporáneo.",
            horario: "Lunes a Sábado: 9:00 AM - 7:00 PM\nDomingo: 10:00 AM - 4:00 PM",
            contacto: "📞 (123) 456-7890\n📧 info@elmapachebigoton.com\n📍 Calle Principal #123, Ciudad",
            galeria: [
                { imagen: "galeria1.jpeg", titulo: "Trabajo de calidad" },
                { imagen: "galeria2.jpeg", titulo: "Ambiente acogedor" },
                { imagen: "galeria3.jpeg", titulo: "Resultados impecables" }
            ]
        };
    }
}

async function cargarDatosBarberia() {
    try {
        mostrarLoading();
            const [infoBarberia, servicios, barberos] = await Promise.all([
            fetchInfoBarberia(),
            fetchServicios(),
            fetchBarberos()
        ]);
        
        actualizarInterfaz(infoBarberia, servicios, barberos);
        mostrarBienvenida(infoBarberia.nombre);
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarError('Error al cargar los datos de la barbería. Por favor, recarga la página.');
    }
}

function mostrarLoading() {
    const contenedores = ['servicios-container', 'barberos-container', 'galeria-container'];
    
    contenedores.forEach(contenedorId => {
        const contenedor = document.getElementById(contenedorId);
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="col-12 loading">
                    <div class="spinner-border text-primary loading-spinner" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2">Cargando información...</p>
                </div>
            `;
        }
    });
}

function mostrarError(mensaje) {
    const contenedores = ['servicios-container', 'barberos-container', 'galeria-container'];
    
    contenedores.forEach(contenedorId => {
        const contenedor = document.getElementById(contenedorId);
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="col-12">
                    <div class="error-message">
                        <p>${mensaje}</p>
                        <button class="btn btn-primary mt-2" onclick="cargarDatosBarberia()">Reintentar</button>
                    </div>
                </div>
            `;
        }
    });
}

function actualizarInterfaz(infoBarberia, servicios, barberos) {
    if (document.getElementById('nombre-barberia')) {
        document.getElementById('nombre-barberia').textContent = infoBarberia.nombre;
    }
    if (document.getElementById('descripcion-barberia')) {
        document.getElementById('descripcion-barberia').textContent = infoBarberia.descripcion;
    }
    if (document.getElementById('footer-nombre')) {
        document.getElementById('footer-nombre').textContent = infoBarberia.nombre;
    }
    if (document.getElementById('footer-descripcion')) {
        document.getElementById('footer-descripcion').textContent = infoBarberia.descripcion;
    }
    if (document.getElementById('horario-texto')) {
        document.getElementById('horario-texto').innerHTML = infoBarberia.horario.replace(/\n/g, '<br>');
    }
    if (document.getElementById('contacto-info')) {
        document.getElementById('contacto-info').innerHTML = infoBarberia.contacto.replace(/\n/g, '<br>');
    }
    
    if (document.getElementById('anio-barberia')) {
        document.getElementById('anio-barberia').textContent = infoBarberia.nombre;
    }
    
    cargarServicios(servicios);
    cargarBarberos(barberos);
    if (infoBarberia.galeria) {
        cargarGaleria(infoBarberia.galeria);
    }
}

function cargarServicios(servicios) {
    const contenedor = document.getElementById('servicios-container');
    
    if (!contenedor || !servicios) return;
    
    const serviciosHTML = servicios.map((servicio, index) => {
        const icono = obtenerIconoServicio(servicio.descripcion);
        
        return `
            <div class="col-md-3 mb-4" data-aos="fade-up" data-aos-delay="${index * 100}">
                <div class="card h-100 shadow">
                    <div class="card-body text-center">
                        <div class="service-icon mb-3">${icono}</div>
                        <h5 class="card-title">${servicio.descripcion}</h5>
                        <p class="card-text">${servicio.detalles || 'Servicio profesional de calidad'}</p>
                        <p class="fw-bold text-primary">$${servicio.costo} MXN</p>
                        ${servicio.duracion ? <small class="text-muted">Duración: ${servicio.duracion} min</small> : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    contenedor.innerHTML = serviciosHTML;
}

function obtenerIconoServicio(descripcion) {
    const desc = descripcion.toLowerCase();
    if (desc.includes('corte') && desc.includes('barba')) return '💈';
    if (desc.includes('corte')) return '✂';
    if (desc.includes('barba')) return '🧔';
    if (desc.includes('afeitado')) return '🪒';
    if (desc.includes('tinte')) return '🎨';
    if (desc.includes('tratamiento')) return '💆';
    return '💈';
}

function cargarBarberos(barberos) {
    const contenedor = document.getElementById('barberos-container');
    
    if (!contenedor || !barberos) return;
    
    const barberosHTML = barberos.map((barbero, index) => {
        if (barbero.activo === false) return '';
        
        return `
            <div class="col-md-4 mb-4" data-aos="fade-up" data-aos-delay="${index * 100}">
                <div class="card text-center h-100">
                    <img src="${barbero.foto || 'https://via.placeholder.com/300x300/007bff/ffffff?text=Barbero'}" 
                         class="card-img-top barbero-img" 
                         alt="${barbero.nombre}"
                         onerror="this.src='https://via.placeholder.com/300x300/007bff/ffffff?text=Barbero'">
                    <div class="card-body">
                        <h5 class="card-title">${barbero.nombre}</h5>
                        <p class="text-muted mb-2">${barbero.especialidad || 'Barbero Profesional'}</p>
                        <p class="card-text">${barbero.descripcion || 'Barbero profesional con amplia experiencia.'}</p>
                        ${barbero.experiencia ? <span class="badge bg-primary">${barbero.experiencia} años de experiencia</span> : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    contenedor.innerHTML = barberosHTML;
}

function cargarGaleria(galeria) {
    const contenedor = document.getElementById('galeria-container');
    
    if (!contenedor || !galeria) return;
    
    const galeriaHTML = galeria.map((item, index) => `
        <div class="col-md-4 mb-4" data-aos="zoom-in" data-aos-delay="${(index + 1) * 100}">
            <div class="galeria-item">
                <img src="${item.imagen}" 
                     class="img-fluid rounded shadow galeria-img" 
                     alt="${item.titulo}"
                     onerror="this.src='https://via.placeholder.com/400x300/6c757d/ffffff?text=Imagen+${index + 1}'">
                <div class="text-center mt-2">
                    <small class="text-muted">${item.titulo}</small>
                </div>
            </div>
        </div>
    `).join('');
    
    contenedor.innerHTML = galeriaHTML;
}

function mostrarBienvenida(nombreBarberia) {
    setTimeout(() => {
        Swal.fire({
            title: ¡Bienvenido a ${nombreBarberia}!,
            text: 'Descubre nuestros servicios y agenda tu cita hoy mismo.',
            icon: 'info',
            confirmButtonText: '¡Empezar!',
            confirmButtonColor: '#0d6efd'
        });
    }, 1000);
}

window.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        const img = e.target;
        if (img.classList.contains('barbero-img')) {
            img.src = 'https://via.placeholder.com/300x300/007bff/ffffff?text=Barbero';
        } else if (img.classList.contains('galeria-img')) {
            img.src = 'https://via.placeholder.com/400x300/6c757d/ffffff?text=Imagen';
        }
    }
}, true);

window.recargarDatos = function() {
    cargarDatosBarberia();
};

window.seleccionarServicio = function(id, nombre, precio) {
    const servicioSeleccionado = { id, nombre, precio };
    localStorage.setItem('servicioSeleccionado', JSON.stringify(servicioSeleccionado));
    
    Swal.fire({
        title: '¡Servicio seleccionado!',
        text: Has seleccionado: ${nombre} - $${precio} MXN,
        icon: 'success',
        confirmButtonText: 'Continuar',
        timer: 2000
    }).then(() => {
        window.location.href = 'citas.html';
    });
};

window.seleccionarBarbero = function(id, nombre) {
    localStorage.setItem('barberoSeleccionado', JSON.stringify({ id, nombre }));
    
    Swal.fire({
        title: '¡Barbero seleccionado!',
        text: Has seleccionado a: ${nombre},
        icon: 'success',
        confirmButtonText: 'Continuar',
        timer: 2000
    }).then(() => {
        window.location.href = 'citas.html';
    });
};
