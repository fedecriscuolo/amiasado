let comensales = [];
let comensalesData = [];

// Para Debbug
let carnes = [];
let extras = [];


const urlCalculadora = "/api-calculadora-asado";
const urlItems = "/api-items-asado";


document.addEventListener("DOMContentLoaded", () => {
    cargarItems();
});

function cargarItems() {
    fetch(urlItems)
        .then(res => res.json())
        .then(data => {
            const carnes = data.carnes || [];
            const extras = data.extras || [];

            const carnesContainer = document.getElementById("carnesContainer");
            const extrasContainer = document.getElementById("extrasContainer");

            carnes.forEach(item => {
                const checkbox = crearCheckbox(item, "carnes");
                carnesContainer.appendChild(checkbox);
            });

            extras.forEach(item => {
                const checkbox = crearCheckbox(item, "extras");
                extrasContainer.appendChild(checkbox);
            });
        })
        .catch(error => {
            console.error("Error al cargar ítems:", error);
        });
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

function agregarComensal() {
    const nombre = document.getElementById("nombre").value.trim();
    const tipo = document.getElementById("tipo").value;

    if (!nombre) {
        alert("Por favor ingresá un nombre.");
        return;
    }

    const carnesSeleccionadas = [...document.querySelectorAll('input[name="carnes"]:checked')].map(el => el.value);
    const extrasSeleccionados = [...document.querySelectorAll('input[name="extras"]:checked')].map(el => el.value);

    const comensal = {
        nombre,
        tipo,
        carnes: carnesSeleccionadas,
        extras: extrasSeleccionados
    };

    comensales.push(comensal);
    actualizarTabla();
    limpiarFormulario();
}

function actualizarTabla() {
    const tbody = document.querySelector("#tabla-comensales tbody");
    tbody.innerHTML = "";

    comensales.forEach((c, index) => {
        const fila = document.createElement("tr");

        const tdNombre = document.createElement("td");
        tdNombre.textContent = c.nombre;

        const tdTipo = document.createElement("td");
        tdTipo.textContent = c.tipo;

        const tdItems = document.createElement("td");
        tdItems.textContent = [...c.carnes, ...c.extras].join(", ");

        const tdAcciones = document.createElement("td");
        const btnEliminar = document.createElement("button");
        btnEliminar.className = "btn btn-sm btn-danger";
        btnEliminar.textContent = "Eliminar";
        btnEliminar.onclick = () => eliminarComensal(index);
        tdAcciones.appendChild(btnEliminar);

        fila.appendChild(tdNombre);
        fila.appendChild(tdTipo);
        fila.appendChild(tdItems);
        fila.appendChild(tdAcciones);

        tbody.appendChild(fila);
    });
}

function eliminarComensal(index) {
    comensales.splice(index, 1);
    actualizarTabla();
}

function limpiarFormulario() {
    document.getElementById("nombre").value = "";
    document.getElementById("tipo").value = "H";

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
}


function calcular() {
    const payload = { comensales };  // <-- acá se define correctamente
    console.log("Enviando payload:", payload); // debug

    fetch(urlCalculadora, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(data => {
        console.log("Respuesta recibida:", data); // debug
        document.getElementById("bloqueResultado").style.display = "block";
        mostrarResultado(data.lista_compras); // función para renderizar resultado
        document.getElementById("descargarPDF").style.display = "inline-block";

    })
    .catch(error => {
        console.error('Error al calcular:', error);
    });
}

function mostrarResultado(listaCompras) {
    const resultadoDiv = document.getElementById("resultado");
    resultadoDiv.innerHTML = ''; // Limpiar resultados anteriores

    if (Object.keys(listaCompras).length === 0) {
        resultadoDiv.innerHTML = "<p>No hay ítems para mostrar.</p>";
        return;
    }

    // Crear tabla
    const table = document.createElement("table");
    table.className = "table table-striped";

    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>#</th>
            <th>Ítem</th>
            <th>Cantidad (g)</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    let index = 1;
    for (const [item, cantidad] of Object.entries(listaCompras)) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index++}</td>
            <td>${item}</td>
            <td>${cantidad.toFixed(1)} g</td>
        `;
        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    resultadoDiv.appendChild(table);

    document.getElementById("descargarPDF").style.display = "inline-block";

    // Mostrar botón para descargar PDF
    const btnDescargar = document.getElementById("descargarPDF");
    btnDescargar.style.display = "inline-block";
    btnDescargar.onclick = () => descargarPDF(); // Llama a la función
    
}


function descargarPDF() {
    // Transformamos los datos actuales a la estructura esperada
    
    const comensalesFormateados = comensales.map(comensal => {
    return {
        nombre: comensal.nombre,
        tipo: comensal.tipo,
        carnes: comensal.carnes || [],
        extras: comensal.extras || []
    };
});


    const payload = { comensales: comensalesFormateados };
    console.log("Payload enviado al PDF:", payload);

    fetch('/api-calculadora-asado/exportar-pdf', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Error al descargar PDF");
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "lista_parrilla.pdf";
        a.click();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error("❌ Error al descargar PDF:", error);
        alert("Hubo un error al descargar el PDF");
    });
}



