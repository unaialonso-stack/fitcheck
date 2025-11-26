

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

            /*Guardad datos básicos*/
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
            if(!user){ mostrarAlerta('Credenciales inválidas'); return;}
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
            mostrarAlerta("No hay usuario logueado.");
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
        if(!obj) return mostrarAlerta("Selecciona un objetivo");

        user.perfil.objetivo = obj;
        saveUsers(users);
        cargarDatos();
        mostrarAlerta("Objetivo guardado.");
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
    });
    };
    
   /* CRUD con LocalStorage */
const rutinasKey = () => {
    const email = getLogged();
    return `rutinas_${email || 'anon'}`;
};

const readRutinas = () => JSON.parse(localStorage.getItem(rutinasKey()) || '[]');
const saveRutinas = arr => localStorage.setItem(rutinasKey(), JSON.stringify(arr));

/* Datos de ejercicios por grupo (ejemplo) */
const ejerciciosPorGrupo = {
    Pecho: [
        { nombre: "Press banca", img: "img/press-banca.png" },
        { nombre: "Aperturas con mancuernas", img: "img/aperturas.jpg" },
    ],
    Espalda: [
        { nombre: "Polea al pecho", img: "img/polea-al-pecho.png" },
        { nombre: "Remo con mancuerna", img: "img/remo-mancuerna.jpg" },
    ],
    Pierna: [
        { nombre: "Sentadilla", img: "img/sentadilla.png" },
        { nombre: "Prensa", img: "img/prensa.png" },
    ],
    Hombro: [
        { nombre: "Press militar", img: "img/press-militar.png" },
    ],
    "Bíceps": [
        { nombre: "Curl con barra", img: "img/curl-barra.png" }
    ],
    "Tríceps": [
        { nombre: "Fondos", img: "img/fondos.png" }
    ],
    "Full Body": [
        { nombre: "Burpees", img: "img/burpees.png" }
    ],
    "ABS": [
        { nombre: "Plancha", img: "img/plancha.png" }
    ]
};
/*** Estado temporal / helpers globales para agregar ejercicios ***/
let ejercicioTemp = null;        
let ejercicioTempImg = "";       
let rutinaActualId = null;       

/* Busca imagen por nombre recorriendo todos los grupos */
function buscarImagenEjercicio(nombre) {
    for (const g in ejerciciosPorGrupo) {
        const encontrado = ejerciciosPorGrupo[g].find(x => x.nombre === nombre);
        if (encontrado && encontrado.img) return encontrado.img;
    }
    return null;
}



/* Render de rutinas (lista) */
function renderRutinas() {
    const cont = document.querySelector('#lista-rutinas');
    if (!cont) return;

    const rutinas = readRutinas();
    cont.innerHTML = '';

    if (rutinas.length === 0) {
        cont.innerHTML = `<p class="sin-rutinas">Aún no has creado ninguna rutina.</p>`;
        return;
    }

    rutinas.forEach(r => {
        const div = document.createElement("article");
        div.className = "rutina-card";
        const gruposText = Array.isArray(r.grupo) ? r.grupo.join(", ") : (r.grupo || "");
        div.innerHTML = `
            <h3>${r.nombre}</h3>
            <p>Día: ${r.dia || "Libre"}</p>   
            <p>Grupos: ${gruposText}</p>
            <p>Ejercicios: ${r.ejercicios.length}</p>

            <div class="rutina-acciones">
                <button class="btn-secundario btn-ver" data-id="${r.id}">Ver</button>
                <button class="btn-secundario btn-edit" data-id="${r.id}">Editar</button>
                <button class="btn-eliminar btn-del" data-id="${r.id}">Eliminar</button>
            </div>
        `;
        cont.appendChild(div);
    });

    bindRutinasButtons();
}

/* Botones de cada tarjeta */
function bindRutinasButtons() {
    document.querySelectorAll(".btn-del").forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            if (!confirm("¿Eliminar rutina?")) return;
            const arr = readRutinas().filter(r => r.id !== id);
            saveRutinas(arr);
            renderRutinas();
        };
    });

    document.querySelectorAll(".btn-edit").forEach(btn => {
        btn.onclick = () => abrirEditar(btn.dataset.id);
    });

    document.querySelectorAll(".btn-ver").forEach(btn => {
        btn.onclick = () => verRutina(btn.dataset.id);
    });
}

/* Modales y elementos */
const modalCrear = document.querySelector("#modal-crear");
const btnAbrirCrear = document.querySelector("#btn-abrir-crear");
const btnCerrarCrear = document.querySelector("#cerrar-modal-crear");

const modalEjercicios = document.querySelector("#modal-ejercicios");
const gridEjercicios = document.getElementById("ejercicios-grid");
const btnCerrarModalEjercicios = document.getElementById("btn-cerrar-modal");
const cerrarEjerciciosX = document.getElementById("cerrar-ejercicios-x");

const modalVer = document.getElementById("modal-ver");
const cerrarVerX = document.getElementById("cerrar-ver-x");

const modalEditar = document.querySelector("#modal-editar");

/* Abrir / cerrar crear */
if (btnAbrirCrear) btnAbrirCrear.onclick = () => {
    const nombreInput = document.getElementById("rutina-nombre");
    if (nombreInput) nombreInput.value = "";
    document.querySelectorAll("#grupo-crear input").forEach(i => i.checked = false);
    modalCrear.classList.remove("hidden");
};
if (btnCerrarCrear) btnCerrarCrear.onclick = () => modalCrear.classList.add("hidden");

document.querySelector("#btn-crear-rutina").onclick = () => {
    const nombre = document.querySelector("#rutina-nombre").value.trim();
    const dia = document.querySelector("#rutina-dia").value.trim();

    /* leer checkboxes */
    const gruposNode = document.querySelectorAll("#grupo-crear input:checked");
    const grupos = Array.from(gruposNode).map(c => c.value);

    if (!nombre || grupos.length === 0) return mostrarAlerta("Nombre y al menos 1 grupo son obligatorios.");

    const nueva = {
        id: Date.now().toString(36),
        nombre,
        dia,
        grupo: grupos, 
        ejercicios: [],
        updated: new Date().toISOString().split("T")[0]
    };

    const arr = readRutinas();
    arr.push(nueva);
    saveRutinas(arr);

    modalCrear.classList.add("hidden");

    modalEjercicios.dataset.rutinaid = nueva.id;
    cargarEjerciciosGrupos(grupos);
    modalEjercicios.classList.remove("hidden");

    renderRutinas();
};

/* Cargar ejercicios combinados para uno o varios grupos */
function cargarEjerciciosGrupos(grupos) {
    gridEjercicios.innerHTML = "";

    const gruposArray = Array.isArray(grupos) ? grupos : [grupos];

    const vistos = new Set();
    const lista = [];

    gruposArray.forEach(g => {
        const items = ejerciciosPorGrupo[g];
        if (!items) return;
        items.forEach(i => {
            if (!vistos.has(i.nombre)) {
                vistos.add(i.nombre);
                lista.push(i);
            }
        });
    });

    if (lista.length === 0) {
        gridEjercicios.innerHTML = "<p style='opacity:.7'>No hay ejercicios para los grupos seleccionados.</p>";
        return;
    }

    lista.forEach(e => {
        const div = document.createElement("div");
        div.className = "ejercicio-card";
        div.dataset.ejercicio = e.nombre;

        div.innerHTML = `
            <img src="${e.img}" alt="${e.nombre}">
            <h4>${e.nombre}</h4>
            <button class="btn-card">Agregar</button>
        `;
        gridEjercicios.appendChild(div);
    });

    bindAgregarEjerciciosDesdeModal();
}

/* Cuando pulsas "Agregar" en modal-ejercicios */
function bindAgregarEjerciciosDesdeModal() {
    gridEjercicios.querySelectorAll(".ejercicio-card .btn-card").forEach(btn => {
        btn.onclick = (ev) => {
            ev.stopPropagation();
            const card = btn.closest(".ejercicio-card");
            const nombre = card.dataset.ejercicio;
            const imgEl = card.querySelector("img");
            const imgSrc = imgEl ? imgEl.src : buscarImagenEjercicio(nombre) || "";

            ejercicioTemp = nombre;
            ejercicioTempImg = imgSrc;
            rutinaActualId = modalEjercicios.dataset.rutinaid || modalEditar.dataset.id || null;

            const txt = document.getElementById("ejercicio-seleccionado");
            if (txt) txt.textContent = ejercicioTemp;

            const modalDetalles = document.getElementById("modal-detalles-ejercicio");
            if (modalDetalles) modalDetalles.classList.remove("hidden");

            const inputS = document.getElementById("input-series");
            if (inputS) inputS.focus();
        };
    });
}


/* Cerrar modal ejercicios (botones) */
if (btnCerrarModalEjercicios) btnCerrarModalEjercicios.onclick = () => {
    modalEjercicios.classList.add("hidden");
};
if (cerrarEjerciciosX) cerrarEjerciciosX.onclick = () => {
    modalEjercicios.classList.add("hidden");
}

/* Ver rutina */
function verRutina(id) {
    const r = readRutinas().find(x => x.id === id);
    if (!r) return;

    document.getElementById("ver-titulo").textContent = r.nombre;
    document.getElementById("ver-dia").textContent = "Día: " + (r.dia || "Libre");
    const grupoTxt = Array.isArray(r.grupo) ? r.grupo.join(", ") : (r.grupo || "");
    document.getElementById("ver-grupo").textContent = "Grupos: " + grupoTxt;

    const cont = document.getElementById("ver-lista");
    cont.innerHTML = "";

    if (!r.ejercicios || r.ejercicios.length === 0) {
        cont.innerHTML = `<p style="opacity:.7">Aún no hay ejercicios</p>`;
    } else {
        r.ejercicios.forEach((e, i) => {
            const p = document.createElement("div");
            p.className = "ver-ej";

            const name = e.nombre || "(sin nombre)";
            const series = e.series || 0;
            const reps = e.reps || 0;
            const peso = e.peso || (e.peso === 0 ? 0 : "");
            const imgSrc = e.img || buscarImagenEjercicio(e.nombre) || "";

            p.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;">
                    <button class="btn-secundario btn-ver-img" data-img="${imgSrc}" type="button">Ver imagen</button>

                    <div>
                        <div><strong>${i+1}. ${name}</strong></div>
                        <div style="opacity:.85">${series} x ${reps} ${peso ? `| ${peso} kg` : ""}</div>
                    </div>
                </div>
            `;
            cont.appendChild(p);
        });

        cont.querySelectorAll(".btn-ver-img").forEach(btn => {
    btn.onclick = () => {
        const src = btn.dataset.img;
        if (!src) return mostrarAlerta("No hay imagen disponible.");

        document.getElementById("img-view").src = src;
        document.getElementById("modal-img").classList.remove("hidden");
    };
});

/* cerrar modal imagen */
document.getElementById("cerrar-img").onclick = () =>
    document.getElementById("modal-img").classList.add("hidden");
    }

    modalVer.classList.remove("hidden");
}
if (cerrarVerX) cerrarVerX.onclick = () => modalVer.classList.add("hidden");

/* Editar rutina */
if (modalEditar) {
    const closeEditarBtn = document.getElementById("cerrar-modal-editar");
    if (closeEditarBtn) closeEditarBtn.onclick = () => modalEditar.classList.add("hidden");
}

function abrirEditar(id) {
    const rutina = readRutinas().find(r => r.id === id);
    if (!rutina) return;

    modalEditar.dataset.id = id;
    rutinaActualId = id;

    document.querySelector("#edit-nombre").value = rutina.nombre || "";
    const editDia = document.querySelector("#edit-dia");
    if (editDia) editDia.value = rutina.dia || "";

    document.querySelectorAll("#grupo-editar input").forEach(inp => {
        inp.checked = Array.isArray(rutina.grupo) ? rutina.grupo.includes(inp.value) : (rutina.grupo === inp.value);
    });

    renderEjerciciosEdit(rutina);
    modalEditar.classList.remove("hidden");
}

function renderEjerciciosEdit(rutina) {
    const cont = document.querySelector("#lista-ejercicios-edit");
    cont.innerHTML = "";

    (rutina.ejercicios || []).forEach((e, i) => {
        const div = document.createElement("div");
        div.className = "ej-row";
        const name = e.nombre || "(sin nombre)";
        const series = e.series || 0;
        const reps = e.reps || 0;

        div.innerHTML = `
            <strong>${name}</strong> — ${series}x${reps}
            <button data-i="${i}" class="btn-eliminar btn-del-ej">X</button>
        `;
        cont.appendChild(div);
    });

    /* Borrar ejercicio */
    cont.querySelectorAll(".btn-del-ej").forEach(btn => {
        btn.onclick = () => {
            const index = Number(btn.dataset.i);
            rutina.ejercicios.splice(index, 1);
            saveEjerciciosCambio(rutina);
        };
    });
}

function saveEjerciciosCambio(rutina) {
    const arr = readRutinas().map(r => r.id === rutina.id ? rutina : r);
    saveRutinas(arr);
    renderEjerciciosEdit(rutina);
}

/* Agregar ejercicio desde EDIT */
const btnAgregarDesdeEditar = document.querySelector("#btn-agregar-ejercicio");
if (btnAgregarDesdeEditar) {
    btnAgregarDesdeEditar.onclick = () => {
    modalEjercicios.dataset.rutinaid = rutinaActualId;

    const gruposSeleccionados = Array.from(document.querySelectorAll("#grupo-editar input:checked"))
                                    .map(c => c.value);

    const r = readRutinas().find(x => x.id === rutinaActualId);
    const grupos = gruposSeleccionados.length > 0 ? gruposSeleccionados : r.grupo;

    cargarEjerciciosGrupos(grupos); 
    modalEjercicios.classList.remove("hidden");
};
}

/* Guardar cambios del modal editar */
document.querySelector("#btn-guardar-cambios").onclick = () => {
    const id = modalEditar.dataset.id;
    const arr = readRutinas();
    const rutina = arr.find(r => r.id === id);
    if (!rutina) return;

    rutina.nombre = document.querySelector("#edit-nombre").value.trim();
    rutina.dia = document.querySelector("#edit-dia").value;

    /* leer checkboxes de edit */
    const gruposEditChecked = Array.from(document.querySelectorAll("#grupo-editar input:checked")).map(c => c.value);
    rutina.grupo = gruposEditChecked;

    rutina.updated = new Date().toISOString().split("T")[0];

    saveRutinas(arr);
    modalEditar.classList.add("hidden");
    renderRutinas();
};

/* Render inicial */
if (document.querySelector("#lista-rutinas")) renderRutinas();

/* Guardar ejercicio */
document.getElementById("guardar-ejercicio").onclick = () => {
    if (!ejercicioTemp || !rutinaActualId) return mostrarAlerta("Error inesperado.");

    const series = Number(document.getElementById("input-series").value);
    const reps   = Number(document.getElementById("input-reps").value);
    const peso   = Number(document.getElementById("input-peso").value);

    if (!series || !reps) return mostrarAlerta("Series y repeticiones son obligatorias.");

    const arr = readRutinas();
    const rutina = arr.find(r => r.id === rutinaActualId);
    if (!rutina) return;

    rutina.ejercicios.push({
        nombre: ejercicioTemp,
        series,
        reps,
        peso,
        img: ejercicioTempImg
    });

    saveRutinas(arr);

    document.getElementById("input-series").value = "";
    document.getElementById("input-reps").value = "";
    document.getElementById("input-peso").value = "";

    document.getElementById("modal-detalles-ejercicio").classList.add("hidden");
    renderRutinas();
};

/* Cancelar el modal de detalles */
document.getElementById("cerrar-detalles").onclick = () => {
    document.getElementById("modal-detalles-ejercicio").classList.add("hidden");
};
/* Alerta */
const alerta = document.getElementById("alerta");
function mostrarAlerta(msg) {
    if (!alerta) {
        window.alert(msg); 
        return;
    }
    alerta.textContent = msg;
    alerta.classList.remove("hidden");
    setTimeout(() => alerta.classList.add("hidden"), 2200);
}


    
})();