document.addEventListener('DOMContentLoaded', () => {
  console.log('login.js cargado ✅');
  const container = document.getElementById('container');
  const signUpButton = document.getElementById('signUp');
  const signInButton = document.getElementById('signIn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const forgotPasswordLink = document.getElementById('forgotPassword');
  const notification = document.getElementById('notification');

  const API_BASE_URL = 'http://localhost:8080/api';

  const showNotification = (message, type = 'success') => {
    if (!notification) return alert(message);
    notification.textContent = message;
    notification.className = 'notification show ' + type;
    setTimeout(() => notification.classList.remove('show'), 3000);
  };

  try {
    if (window.particlesJS) {
      particlesJS('particles-js', {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: "#d4af37" },
          shape: { type: "circle", stroke: { width: 0, color: "#000" } },
          opacity: { value: 0.5, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false } },
          size: { value: 3, random: true, anim: { enable: true, speed: 2, size_min: 0.1, sync: false } },
          line_linked: { enable: true, distance: 150, color: "#d4af37", opacity: 0.4, width: 1 },
          move: { enable: true, speed: 1, direction: "none", random: true, straight: false, out_mode: "out", bounce: false,
            attract: { enable: true, rotateX: 600, rotateY: 1200 } }
        },
        interactivity: {
          detect_on: "canvas",
          events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" }, resize: true },
          modes: { grab: { distance: 140, line_linked: { opacity: 1 } }, push: { particles_nb: 4 } }
        },
        retina_detect: true
      });
    } else {
      console.warn('particles.js no disponible (ok).');
    }
  } catch (e) {
    console.warn('Error inicializando partículas (continuamos):', e);
  }

  if (signUpButton && container) {
    signUpButton.addEventListener('click', () => container.classList.add('right-panel-active'));
  }
  if (signInButton && container) {
    signInButton.addEventListener('click', () => container.classList.remove('right-panel-active'));
  }

  document.querySelectorAll('.floating-elements div').forEach((el, idx) => {
    el.style.animationDuration = `${15 + idx * 2}s`;
  });

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = document.getElementById('fullName')?.value?.trim();
      const age = Number(document.getElementById('age')?.value);
      const email = document.getElementById('emailRegister')?.value?.trim();
      const password = document.getElementById('passwordRegister')?.value;
      const confirmPassword = document.getElementById('confirmPassword')?.value;

      if (!fullName || !age || !email || !password || !confirmPassword) {
        showNotification('Completa todos los campos', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
      }
      if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
      }
      if (age < 13) {
        showNotification('Debes tener al menos 13 años para registrarte', 'error');
        return;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn?.textContent;
      if (submitBtn) { submitBtn.textContent = 'Registrando...'; submitBtn.disabled = true; }

      try {
        const clienteData = { nombre: fullName, correo: email, contrasenia: password };
        const resp = await fetch(`${API_BASE_URL}/clientes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clienteData)
        });

        if (resp.ok) {
          try { await resp.json(); } catch {}
          showNotification('¡Registro exitoso! Por favor inicia sesión.');
          registerForm.reset();
          setTimeout(() => container?.classList?.remove('right-panel-active'), 2000);
        } else {
          let errorMessage = `Error ${resp.status}`;
          try {
            const txt = await resp.text();
            if (txt) {
              try { errorMessage = JSON.parse(txt).message || JSON.parse(txt).error || txt; }
              catch { errorMessage = txt; }
            } else {
              errorMessage = `Error ${resp.status}: ${resp.statusText}`;
            }
          } catch {
            errorMessage = `Error ${resp.status}: ${resp.statusText}`;
          }
          showNotification(errorMessage, 'error');
        }
      } catch (err) {
        console.error('Error en registro:', err);
        if (err?.name === 'TypeError') {
          showNotification('No se puede conectar al servidor. Verifica que esté ejecutándose.', 'error');
        } else {
          showNotification('Error de conexión con el servidor', 'error');
        }
      } finally {
        if (submitBtn) { submitBtn.textContent = originalText || 'Registrarse'; submitBtn.disabled = false; }
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('emailLogin')?.value?.trim();
      const password = document.getElementById('passwordLogin')?.value;

      if (!email || !password) {
        showNotification('Por favor, completa todos los campos', 'error');
        return;
      }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn?.textContent;
      if (submitBtn) { submitBtn.textContent = 'Verificando...'; submitBtn.disabled = true; }

      try {
        const resp = await fetch(`${API_BASE_URL}/clientes/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo: email, contrasenia: password })
        });

        if (resp.ok) {
          const cliente = await resp.json().catch(() => ({}));
          sessionStorage.setItem('cliente', JSON.stringify(cliente));
          sessionStorage.setItem('isAuthenticated', 'true');
          showNotification('¡Inicio de sesión exitoso! Bienvenido a Barbería Elite.');
          loginForm.reset();
          setTimeout(() => { window.location.href = 'barberia.html'; }, 1500);
        } else {
          const txt = await resp.text();
          if (resp.status === 401) showNotification('Credenciales incorrectas', 'error');
          else if (resp.status === 404) showNotification('Endpoint no encontrado. Verifica la URL.', 'error');
          else if (resp.status === 500) showNotification('Error interno del servidor', 'error');
          else showNotification(`Error: ${resp.status} - ${txt}`, 'error');
        }
      } catch (err) {
        console.error('Error en login:', err);
        if (err?.name === 'TypeError') {
          showNotification('No se puede conectar al servidor. Verifica que esté ejecutándose.', 'error');
        } else {
          showNotification('Error de conexión con el servidor', 'error');
        }
      } finally {
        if (submitBtn) { submitBtn.textContent = originalText || 'Ingresar'; submitBtn.disabled = false; }
      }
    });
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showNotification('Se ha enviado un enlace para restablecer tu contraseña al correo electrónico.', 'warning');
    });
  }

  document.querySelectorAll('.social-icon').forEach(icon => {
    icon.addEventListener('mouseenter', function(){ this.querySelector('i').style.transform='scale(1.2)'; });
    icon.addEventListener('mouseleave', function(){ this.querySelector('i').style.transform='scale(1)'; });
  });

  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('mouseenter', function(){
      this.style.transform='translateY(-3px)';
      this.style.boxShadow='0 5px 15px rgba(0,0,0,.3)';
    });
    btn.addEventListener('mouseleave', function(){
      this.style.transform='translateY(0)';
      this.style.boxShadow='none';
    });
  });
});
