

(() => {
    /* Utilidades */
    const $ = sel => document.querySelector(sel);
    const $$ = sel => document.querySelectorAll(sel);

    const readUsers = () => JSON.parse(localStorage.getItem('users') || '[]');
    const saveUsers = u => localStorage.setItem('users', JSON.stringify(u));
    const getLogged = () => localStorage.getItem('loggedUser') || null;
    const setLogged = email => localStorage.setItem('loggedUser', email);
    const logout = () => { localStorage.removeItem('loggedUser'); window.location.href = 'index.html';}

    /* Autentificación (registro/login) */
    const regForm = $('#form-reg');
    if(regForm){
        regForm.addEventListener('submit', e => {
            e.preventDefault();
            const nombre = regForm.querySelector('[name=nombre]').value.trim();
            const edad = regForm.querySelector('[name=edad]').value.trim();
            const email = regForm.querySelector('[name=email]').value.trim().toLowerCase();
            const password = regForm.querySelector('[name=password]').value;       
            
            if(!nombre || !email || !password) { alert('Rellena los campos.'); return;}
            const users = readUsers();
            if(users.find(u => u.email === email)) { alert('Usuario ya existente'); return;}

            //Guardad datos básicos
            users.push({nombre, edad, email, password, perfil: { altura: null, peso: null, actividad: null, objetivo:null}});
            saveUsers(users);
            setLogged(email);
            window.location.href = 'inicio.html';
        });
    }

    const loginForm = $ ('#form-login');
    if(loginForm){
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = loginForm.querySelector('[name=email]').value.trim().toLowerCase();
            const password = loginForm.querySelector('[name=password]').value;
            const users = readUsers();
            const user = users.find(u => u.email === email && u.password === password);
            if(!user){ alert('Credenciales inválidas'); return;}
            setLogged(email);
            window.location.href = 'inicio.html';
        });
    }

    /* Header dinámico y Logout */
    const logged = getLogged();
    const logoutBtn = $('#logout-btn');
    if(logoutBtn) logoutBtn.addEventListener('click', e => { e.preventDefault(); logout();});

    /* Mostrar nombre en dashboard */
    const dashboardName = $('#dashboard-name');
    if(dashboardName){
        if(!logged){
            dashboardName.textContent = 'Usuario';
        }else{
            const user = readUsers().find(u => u.email === logged);
            dashboardName.textContent = user ? user.nombre : logged;
        }
    }

    /* CRUD con LocalStorage */
    // Estructura en localStorage: routines_{email} => array de {id, nombre, dia, grupo, ejercicios: [{nombre, series, reps}], updated}
    const rutinasKey = () =>{
        const email = getLogged();
        return `rutinas_${email || 'anon'}`;
    };

    const readRutinas = () => JSON.parse(localStorage.getItem(rutinasKey()) || '[]');
    const saveRutinas = arr => localStorage.setItem(rutinasKey(), JSON.stringify(arr));

    //Función para renderizar tarjetas en rutinas.html
    const renderRutinas = () => {
        const cont = $('#lista-rutinas');
        if(!cont) return;
        const rutinas = readRutinas();
        cont.innerHTML = '';
        if(rutinas.length === 0){
            cont.innerHTML = `<p class="sin-rutinas">Aún no has creado ninguna rutina.</p>`;
            return;
        }
        rutinas.forEach( r => {
            const div = document.createElement('article');
            div.className = 'rutina-card';
            div.innerHTML = `
                <h3>${r.nombre}</h3>
                <p>Día: ${r.dia} · Grupo: ${r.grupo}</p>
                <p>Última modificación: ${r.updated || '—'}</p>
                <div class="rutinas-acciones">
                <button class="btn-secundario btn-ver" data-id="${r.id}">Ver</button>
                <button class="btn-secundario btn-edit" data-id="${r.id}">Editar</button>
                <button class="btn-eliminar btn-del" data-id="${r.id}">Eliminar</button>
                </div>      
            `;
            cont.appendChild(div);
        });

        /* Listener botones */
        $$('.btn-del').forEach(b => b.addEventListener('click', (ev) => {
            const id = ev.target.dataset.id;
            if(!confirm('Eliminar rutina?')) return;
            const arr = readRutinas().filter(x => x.id !== id);
            saveRutinas(arr); renderRutinas();
        }));

        /* editar/ver -> por ahora será un alert */
        $$('.btn-edit').forEach(b => b.addEventListener('click', ev => {
            const id = ev.target.dataset.id;
            const r = readRutinas().find(x => x.id === id);
            if(!r) return alert('Rutina no encontrada');
            const nuevoNombre = prompt('Nuevo nombre de la rutina', r.nombre);
            if(nuevoNombre){
                r.nombre = nuevoNombre;
                r.updated = new Date().toISOString().split('T')[0];
                const arr = readRutinas().map(x => x.id === id ? r : x);
                saveRutinas(arr); renderRutinas();
            }
        }));

       $$('.btn-ver').forEach(b => b.addEventListener('click', ev => {
            const id = ev.target.dataset.id;
            const r = readRutinas().find(x => x.id === id);
            alert(`Rutina: ${r.nombre}\nDía: ${r.dia}\nGrupo: ${r.grupo}\nEjercicios: ${ (r.ejercicios||[]).map(e => e.nombre).join(', ') }`);
       }));
    };

    /* Crear nueva rutina simple con prompt
    (igual si no crear un form en html)*/
    const crearBtn = $('.btn-crear-rutina');
    if(crearBtn){
        crearBtn.addEventListener('click', () => {
            const nombre = prompt('Nombre de la rutina (ej:Día de Pecho');
            if(!nombre) return;
            const dia = prompt('Día [ej: Lunes]');
            const grupo = prompt('Grupo muscular (ej: Pecho)');
            const id = Date.now().toString(36);
            const rutinas = readRutinas();
            rutinas.push({id, nombre, dia, grupo, ejercicios: [], updated: new Date().toISOString().split('T')[0]});
            saveRutinas(rutinas);
            renderRutinas();
        });
    }
        /* Renderizar al cargar página de rutinas */
        if($('#lista-rutinas')) renderRutinas();

        /* Progreso: guardar peso */
        const progresoKey = () => {
            const email = getLogged();
            return `progreso_${email || 'anon'}`;
        };

        const readProgreso = () => JSON.parse(localStorage.getItem(progresoKey()) || '[]');
        const saveProgreso = arr => localStorage.setItem(progresoKey(), JSON.stringify(arr));

        /* Form de progreso */
        const progForm = $('#form-progreso');
        if(progForm){
            progForm.addEventListener('submit', e => {
                e.preventDefault();
                const peso = parseFloat(progForm.querySelector('[name=peso]').value);
                const fecha = progForm.querySelector('[name=fecha]').value;
                if(!peso || !fecha) { alert('Rellena peso y fecha'); return;}
                const arr = readProgreso();
                arr.push({peso, fecha});
                saveProgreso(arr);
                progForm.reset();
                renderTablaProgreso();
                actualizarGrafica();
            });
        }
            /* Render tabla*/
            const renderTablaProgreso = () => {
                const tbody = $('#tbody-progreso');
                if(!tbody) return;
                const arr = readProgreso().slice().reverse();
                if(arr.length ===0){
                    tbody.innerHTML= `<tr><td colspan="2" class="sin-datos">Aún no has registrado peso.</td></tr>`;
                    return;
                }
                tbody.innerHTML = arr.map(r =>`<tr><td>${r.peso}</td><td>${r.fecha}</td></tr>`).join('');
            };
            if ($('#tbody-progreso')) renderTablaProgreso();

            /* Gráfica (Cart.js) */
            let chartInstance = null;
            const ctx = document.getElementById('graficaPeso');
            const actualizarGrafica = () => {
                if(!ctx) return;
                const data = readProgreso().slice().sort((a,b)=> new Date(a.fecha)-new Date(b.fecha));
                const labels = data.map(d => d.fecha);
                const pesos = data.map(d => d.peso);

                /* Destruir previsto si existe */
                if(chartInstance) chartInstance.destroy();

                chartInstance = new Chart(ctx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Peso (kg)',
                            data: pesos,
                            tension: 0.25,
                            borderColor: '#e50000',
                            backgroundColor: 'rgba(229,5,5,0.06)',
                            fill: true,
                            pointRadius: 3,
                        }]
                    },
                    options: {
                        scales: {
                            x: {ticks: {color: '#fff'}},
                            y: {ticks: {color: '#fff'}}
                        },
                        plugins: {
                            legend: {labels: {color: '#fff'}}
                        },
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            };
            if(ctx) actualizarGrafica();

            /* Si se accede a una página privada sin login */
            const paginasPrivadas = ['inicio.html', 'rutinas.html', 'perfil.html', 'progreso.html'];
            const currentPage = window.location.pathname.split('/').pop();
            if(paginasPrivadas.includes(currentPage)){
                if(!getLogged()){
                    console.log('Usuario no logueado.')
                }
            }

/* Desplegable */

const menuBtn = $('#menu-btn');
const menuDesplegable = $('#menu-desplegable');

if(menuBtn){
    menuBtn.addEventListener('click', () => {
        menuDesplegable.style.display =
            (menuDesplegable.style.display === 'flex') ? 'none' : 'flex';
    });
}

/* Eliminar cuenta */

const deleteBtn = $('#delete-account-btn');

if(deleteBtn){
    deleteBtn.addEventListener('click', () => {
        const email = getLogged();
        if(!email){
            alert("No hay usuario logueado.");
            return;
        }

        const ok = confirm("¿Seguro que quieres eliminar tu cuenta? Esta acción es irreversible.");
        if(!ok) return;

        // borrar usuario
        let users = readUsers().filter(u => u.email !== email);
        saveUsers(users);

        // borrar sus rutinas
        localStorage.removeItem(`rutinas_${email}`);

        // borrar su progreso
        localStorage.removeItem(`progreso_${email}`);

        // cerrar sesión
        logout();
    });
}

/* Cerrar sesión desde menú */
const logoutBtn2 = $('#logout-btn2');
if(logoutBtn2){
    logoutBtn2.addEventListener('click', e => {
        e.preventDefault();
        logout();
    });
}

/* Perfil */
if(currentPage === 'perfil.html'){

    const $ = selector => document.querySelector(selector);

    const userEmail = getLogged();
    const users = readUsers();
    const user = users.find(u => u.email === userEmail);

    const pNombre = $("#p-nombre");
    const pGenero = $("#p-genero");
    const pEdad = $("#p-edad");
    const pAltura = $("#p-altura");
    const pPeso = $("#p-peso");
    const pActividad = $("#p-actividad");

    const formInfo = $("#form-info");
    const btnEditar = $("#btn-editar-info");

    const objetivoSelect = $("#objetivo-select");
    const objetivoLabel = $("#objetivo-label");
    const btnObjetivo = $("#guardar-objetivo");

    const btnCalorias = $("#btn-calcular");
    const caloriasRes = $("#calorias-res");

    /* Datos iniciales */
    const cargarDatos = () => {
        if(!user) return;

        pNombre.textContent = user.nombre || "-";
        pGenero.textContent = user.perfil.genero || "-";
        pEdad.textContent = user.edad || "-";
        pAltura.textContent = user.perfil.altura || "-";
        pPeso.textContent = user.perfil.peso || "-";

        let actTxt = "-";
        switch(user.perfil.actividad){
            case "1.2": actTxt = "Sedentario";break;
            case "1.375": actTxt = "Ligero";break;
            case "1.55": actTxt = "Moderado";break;
            case "1.725": actTxt = "Intenso";break;
            case "1.9": actTxt = "Atleta"; break;
        }
        pActividad.textContent = actTxt;

        objetivoLabel.textContent =
            user.perfil.objetivo
            ? user.perfil.objetivo.charAt(0).toUpperCase() + user.perfil.objetivo.slice(1)
            : "Sin objetivo seleccionado";
    };

    cargarDatos();

    /* Mostrar/ocultar formulario*/
    btnEditar.addEventListener("click", () => {
        formInfo.classList.toggle("hidden");
    });

    /* Guardar datos personales */
    formInfo.addEventListener("submit", e => {
        e.preventDefault();
        user.edad = formInfo.edad.value;
        user.perfil.genero = formInfo.genero.value;
        user.perfil.altura = formInfo.altura.value;
        user.perfil.peso = formInfo.peso.value;
        user.perfil.actividad = formInfo.actividad.value;

        saveUsers(users);
        cargarDatos();
        formInfo.classList.add("hidden");
    });
    /*Guardar objetivo*/
    btnObjetivo.addEventListener("click", () => {
        const obj = objetivoSelect.value;
        if(!obj) return alert("Selecciona un objetivo");

        user.perfil.objetivo = obj;
        saveUsers(users);
        cargarDatos();
        alert("Objetivo guardado.");
    });
    
    /* Calcular calorías */
    btnCalorias.addEventListener("click", () => {
        const { edad } = user;
        const { altura, genero, peso, actividad, objetivo } = user.perfil;

        if(!edad || !genero || !altura || !peso || !actividad || !objetivo)
            return alert("Completa toda la información y el objetivo.");

       if(genero === "hombre"){
        BMR = 88.36 + (13.4 *peso) + (4.8 * altura) - (5.7 * edad);        
       }else if(genero === "mujer"){
        BMR = 447.6 + (9.2 * peso) + (3.1 * altura) - (4.3 * edad);
       }else{
        /* si el usuario selecciona "otro" */
        BMR = 370 + (21*peso);
       }
       let TDEE = BMR * parseFloat(actividad);
       if(objetivo==="volumen") TDEE +=300;
       if(objetivo==="definicion") TDEE -= 300;

       caloriasRes.textContent = `Calorías recomendadas: ${Math.round(TDEE)} kcal/día`;
    })
}  
    
})();