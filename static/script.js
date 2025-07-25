// script.js completo con funcionalidad de editar comensales
let comensales = [];
let indexEditando = null;

const urlCalculadora = "/api-calculadora-asado";
const urlItems = "/api-items-asado";

document.addEventListener("DOMContentLoaded", () => {
    cargarItems();
});

function cargarItems() {
    fetch(urlItems)
        .then(res => res.json())
        .then(data => {
            const carnesContainer = document.getElementById("carnesContainer");
            const extrasContainer = document.getElementById("extrasContainer");
            carnesContainer.innerHTML = "";
            extrasContainer.innerHTML = "";

            data.carnes.forEach(item => carnesContainer.appendChild(crearCheckbox(item, "carnes")));
            data.extras.forEach(item => extrasContainer.appendChild(crearCheckbox(item, "extras")));
        })
        .catch(error => console.error("Error al cargar ítems:", error));
}

function crearCheckbox(nombre, tipo) {
    const div = document.createElement("div");
    div.className = "form-check";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "form-check-input";
    input.id = `${tipo}-${nombre}`;
    input.name = tipo;
    input.value = nombre;

    const label = document.createElement("label");
    label.className = "form-check-label";
    label.htmlFor = input.id;
    label.textContent = nombre;

    div.appendChild(input);
    div.appendChild(label);
    return div;
}

const btnDescargar = document.getElementById("descargarPDF");
if (btnDescargar) {
    btnDescargar.style.display = "inline-block";
    btnDescargar.onclick = descargarPDF;
}


function agregarComensal() {
    const nombre = document.getElementById("nombre").value.trim();
    const tipo = document.getElementById("tipo").value;
    const carnes = [...document.querySelectorAll('input[name="carnes"]:checked')].map(el => el.value);
    const extras = [...document.querySelectorAll('input[name="extras"]:checked')].map(el => el.value);

    if (!nombre) {
        alert("Por favor ingresá un nombre.");
        return;
    }

    const nuevo = { nombre, tipo, carnes, extras };

    if (indexEditando !== null) {
        comensales[indexEditando] = nuevo;
        indexEditando = null;
        document.getElementById("btnComensal").textContent = "Agregar Comensal";
        document.getElementById("btnCancelarEdicion").style.display = "none";
    } else {
        comensales.push(nuevo);
    }

    limpiarFormulario();
    actualizarTabla();
}

function editarComensal(index) {
    const c = comensales[index];
    document.getElementById("nombre").value = c.nombre;
    document.getElementById("tipo").value = c.tipo;

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

    c.carnes.forEach(nombre => {
        const el = document.getElementById(`carnes-${nombre}`);
        if (el) el.checked = true;
    });
    c.extras.forEach(nombre => {
        const el = document.getElementById(`extras-${nombre}`);
        if (el) el.checked = true;
    });

    indexEditando = index;
    document.getElementById("btnComensal").textContent = "Guardar cambios";
    document.getElementById("btnCancelarEdicion").style.display = "inline-block";
}

function cancelarEdicion() {
    limpiarFormulario();
    indexEditando = null;
    document.getElementById("btnComensal").textContent = "Agregar Comensal";
    document.getElementById("btnCancelarEdicion").style.display = "none";
}

function actualizarTabla() {
    const tbody = document.querySelector("#tabla-comensales tbody");
    tbody.innerHTML = "";

    comensales.forEach((c, index) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${c.nombre}</td>
            <td>${c.tipo}</td>
            <td>${[...c.carnes, ...c.extras].join(", ")}</td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editarComensal(${index})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="eliminarComensal(${index})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function eliminarComensal(index) {
    comensales.splice(index, 1);
    actualizarTabla();
    cancelarEdicion();
}

function limpiarFormulario() {
    document.getElementById("nombre").value = "";
    document.getElementById("tipo").value = "H";
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
}

function calcular() {
    fetch(urlCalculadora, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comensales }),
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("bloqueResultado").style.display = "block";
        mostrarResultado(data.lista_compras);
        document.getElementById("descargarPDF").style.display = "inline-block";
    });
}

function mostrarResultado(listaCompras) {
    const resultadoDiv = document.getElementById("resultado");
    resultadoDiv.innerHTML = "";

    if (!Object.keys(listaCompras).length) {
        resultadoDiv.innerHTML = "<p>No hay ítems para mostrar.</p>";
        return;
    }

    const table = document.createElement("table");
    table.className = "table table-striped";
    table.innerHTML = "<thead><tr><th>#</th><th>Ítem</th><th>Cantidad (g)</th></tr></thead>";
    const tbody = document.createElement("tbody");

    fetch(urlItems)
        .then(res => res.json())
        .then(data => {
            const carnes = data.carnes || [];
            const extras = data.extras || [];
            let index = 1;

            for (const [item, cantidad] of Object.entries(listaCompras)) {
                let tipo = carnes.includes(item) ? " (Carne)" : extras.includes(item) ? " (Extra)" : "";
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index++}</td>
                    <td>${item + tipo}</td>
                    <td>${cantidad.toFixed(1)} g</td>
                `;
                tbody.appendChild(row);
            }

            table.appendChild(tbody);
            resultadoDiv.appendChild(table);
        });
}

function descargarPDF() {
    const payload = {
        comensales: comensales.map(c => ({
            nombre: c.nombre,
            tipo: c.tipo,
            carnes: c.carnes,
            extras: c.extras
        }))
    };

    fetch('/api-calculadora-asado/exportar-pdf', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.blob())
    .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "lista_parrilla.pdf";
        a.click();
        URL.revokeObjectURL(url);
    })
    .catch(() => alert("Hubo un error al descargar el PDF"));
}
