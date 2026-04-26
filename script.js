document.getElementById("year").textContent = new Date().getFullYear();

const form = document.getElementById("akuaiForm");
const modalConfirm = document.getElementById("modal-confirm");
const modalSuccess = document.getElementById("modal-success");

const PRECIO_COMBO_USD = 5;
let TASA_BCV = 0; // Luego aquí conectamos la tasa real del BCV desde Apps Script
let stockSabores = {
  "Catira": 0,
  "Pelúa": 0,
  "Reina Pepiada": 0,
  "Rumbera": 0,
  "Akuai": 0,
  "Dominó": 0
};

function formatoBs(monto) {
  return Number(monto || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatoUsd(monto) {
  return Number(monto || 0).toFixed(2);
}

function mostrarFormulario() {
  document.getElementById("form-wrapper").style.display = "block";
  document.getElementById("cta-content").style.display = "none";
  document.getElementById("unete").scrollIntoView({ behavior:"smooth" });
  cargarStockVisual();
  cargarTasaBCV();
}

function cerrarFormulario() {
  document.getElementById("form-wrapper").style.display = "none";
  document.getElementById("cta-content").style.display = "block";
}

function cargarStockVisual() {
  stockSabores = {
    "Catira": 25,
    "Pelúa": 20,
    "Reina Pepiada": 18,
    "Rumbera": 15,
    "Akuai": 12,
    "Dominó": 162
  };

  document.getElementById("precio-combo-card").textContent = PRECIO_COMBO_USD;
  document.getElementById("stock-message").textContent = "Selecciona cantidades según disponibilidad.";
  document.getElementById("stock-catira").textContent = `Disponible: ${stockSabores["Catira"]}`;
  document.getElementById("stock-pelua").textContent = `Disponible: ${stockSabores["Pelúa"]}`;
  document.getElementById("stock-reina").textContent = `Disponible: ${stockSabores["Reina Pepiada"]}`;
  document.getElementById("stock-rumbera").textContent = `Disponible: ${stockSabores["Rumbera"]}`;
  document.getElementById("stock-akuai").textContent = `Disponible: ${stockSabores["Akuai"]}`;

  actualizarResumenPedido();
}

function cargarTasaBCV() {
  // Temporal de prueba. Luego lo cambiamos por la tasa real del BCV vía Apps Script.
  TASA_BCV = 36.50;
  document.getElementById("tasa-bcv-text").textContent = formatoBs(TASA_BCV);
  actualizarResumenPedido();
}

function resetearSabores() {
  document.querySelectorAll("[data-sabor]").forEach(input => {
    input.value = 0;
  });
}

function cambiarSabor(inputId, cambio) {
  const input = document.getElementById(inputId);
  const combos = Number(document.getElementById("f-combos").value || 1);
  const seleccion = obtenerSaboresSeleccionados();

  let valorActual = Number(input.value || 0);
  const sabor = input.dataset.sabor;
  const disponible = Number(stockSabores[sabor] || 0);

  if (cambio > 0) {
    if (seleccion.total >= combos) {
      alert(`Ya elegiste los ${combos} sabor(es) necesarios.`);
      return;
    }

    if (valorActual >= disponible) {
      alert(`No hay más stock de ${sabor}. Disponible: ${disponible}`);
      return;
    }

    input.value = valorActual + 1;
  } else if (valorActual > 0) {
    input.value = valorActual - 1;
  }

  actualizarResumenPedido();
}

function obtenerSaboresSeleccionados() {
  const inputs = document.querySelectorAll("[data-sabor]");
  const sabores = [];
  let total = 0;

  inputs.forEach(input => {
    const sabor = input.dataset.sabor;
    const cantidad = Number(input.value || 0);

    if (cantidad > 0) {
      sabores.push({ sabor, cantidad });
      total += cantidad;
    }
  });

  return { sabores, total };
}

function obtenerBebidaSeleccionada() {
  const bebida = document.querySelector('input[name="bebida"]:checked');
  return bebida ? bebida.value : "";
}

function mostrarDatosPago() {
  const metodo = document.getElementById("f-metodo").value;
  const bloque = document.getElementById("bloque-datos-pago");
  const datos = document.getElementById("datos-pago");

  if (metodo === "Pago móvil" || metodo === "Transferencia") {
    bloque.classList.remove("payment-hidden");
  } else {
    bloque.classList.add("payment-hidden");
    datos.classList.remove("datos-pago-open");
  }
}

function togglePago() {
  document.getElementById("datos-pago").classList.toggle("datos-pago-open");
}

function actualizarResumenPedido() {
  const combos = Number(document.getElementById("f-combos").value || 1);
  const seleccionSabores = obtenerSaboresSeleccionados();
  const bebida = obtenerBebidaSeleccionada();
  const totalUsd = combos * PRECIO_COMBO_USD;
  const totalBs = totalUsd * TASA_BCV;

  document.getElementById("flavor-summary").textContent =
    `Has seleccionado ${seleccionSabores.total} de ${combos} sabor(es) a elección.`;

  document.getElementById("flavor-summary").style.color =
    seleccionSabores.total === combos ? "#2e7d32" : "#777";

  document.getElementById("drink-summary").textContent =
    bebida ? `Bebida seleccionada: ${bebida}` : "No has seleccionado bebida.";

  document.getElementById("drink-summary").style.color =
    bebida ? "#2e7d32" : "#777";

  document.getElementById("precio-combo-text").textContent = formatoUsd(PRECIO_COMBO_USD);
  document.getElementById("combos-total-text").textContent = combos;
  document.getElementById("total-usd-text").textContent = formatoUsd(totalUsd);

  if (TASA_BCV > 0) {
    document.getElementById("tasa-bcv-text").textContent = formatoBs(TASA_BCV);
    document.getElementById("total-bs-text").textContent = formatoBs(totalBs);
  } else {
    document.getElementById("tasa-bcv-text").textContent = "--";
    document.getElementById("total-bs-text").textContent = "--";
  }
}

form.onsubmit = function(e) {
  e.preventDefault();

  const combos = Number(document.getElementById("f-combos").value || 1);
  const seleccion = obtenerSaboresSeleccionados();
  const bebida = obtenerBebidaSeleccionada();
  const modalidad = document.querySelector('input[name="modalidad"]:checked');
  const metodo = document.getElementById("f-metodo").value;
  const referencia = document.getElementById("f-referencia").value;
  const capture = document.getElementById("f-capture").files[0];
  const totalUsd = combos * PRECIO_COMBO_USD;
  const totalBs = totalUsd * TASA_BCV;

  if (!modalidad) {
    alert("Selecciona si te quedarás en las ponencias o solo retirarás el pedido.");
    return;
  }

  if (combos < 1) {
    alert("Debes seleccionar al menos 1 combo.");
    return;
  }

  if (seleccion.total !== combos) {
    alert(`La suma de sabores debe ser igual a la cantidad de combos. Seleccionaste ${seleccion.total} de ${combos}.`);
    return;
  }

  if (!bebida) {
    alert("Selecciona una bebida.");
    return;
  }

  if (!metodo) {
    alert("Selecciona un método de pago.");
    return;
  }

  if (!referencia) {
    alert("Coloca la referencia de pago.");
    return;
  }

  if (!capture) {
    alert("Debes subir el capture o comprobante de pago.");
    return;
  }

  if (combos > stockSabores["Dominó"]) {
    alert(`No hay suficiente stock de Dominó. Disponible: ${stockSabores["Dominó"]}`);
    return;
  }

  for (let item of seleccion.sabores) {
    const disponible = Number(stockSabores[item.sabor] || 0);

    if (item.cantidad > disponible) {
      alert(`No hay suficiente stock de ${item.sabor}. Disponible: ${disponible}`);
      return;
    }
  }

  const resumenSabores = seleccion.sabores
    .map(item => `${item.sabor} x${item.cantidad}`)
    .join(", ");

  document.getElementById("confirm-name").textContent = document.getElementById("f-nombre").value;
  document.getElementById("confirm-email").textContent = document.getElementById("f-email").value;
  document.getElementById("confirm-vendedor").textContent = document.getElementById("f-vendedor").value;
  document.getElementById("confirm-modalidad").textContent = modalidad.value;
  document.getElementById("confirm-combo").textContent = `${combos} combo(s): Dominó x${combos} + ${resumenSabores}`;
  document.getElementById("confirm-bebida").textContent = bebida;
  document.getElementById("confirm-metodo").textContent = metodo;
  document.getElementById("confirm-referencia").textContent = referencia;
  document.getElementById("confirm-capture").textContent = capture.name;
  document.getElementById("confirm-total-usd").textContent = `$${formatoUsd(totalUsd)}`;
  document.getElementById("confirm-tasa-bcv").textContent = `Bs ${formatoBs(TASA_BCV)}`;
  document.getElementById("confirm-total-bs").textContent = `Bs ${formatoBs(totalBs)}`;

  modalConfirm.style.display = "grid";
};

function cerrarConfirm() {
  modalConfirm.style.display = "none";
}

function mostrarExito() {
  modalConfirm.style.display = "none";
  modalSuccess.style.display = "grid";
}

function enviarFinal() {
  modalSuccess.style.display = "none";
  alert("Vista de prueba: aquí conectaremos Apps Script para guardar en Sheets, subir el capture a Drive, descontar stock, tomar tasa BCV real y enviar ticket.");
}

const header = document.querySelector("header");
let headerH = header.offsetHeight;

window.addEventListener("resize", function() {
  headerH = header.offsetHeight;
});

window.addEventListener("scroll", function() {
  reveal();

  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }

  if (window.scrollY > headerH) {
    header.classList.add("is-sticky");
    document.body.style.paddingTop = headerH + "px";
  } else {
    header.classList.remove("is-sticky");
    document.body.style.paddingTop = "0px";
  }
});

function reveal() {
  const reveals = document.querySelectorAll(".reveal");

  for (let i = 0; i < reveals.length; i++) {
    const windowHeight = window.innerHeight;
    const elementTop = reveals[i].getBoundingClientRect().top;
    const elementVisible = 150;

    if (elementTop < windowHeight - elementVisible) {
      reveals[i].classList.add("active");
    }
  }
}

reveal();

function actualizarHora() {
  const ahora = new Date();
  const horas = ahora.getHours().toString().padStart(2,"0");
  const minutos = ahora.getMinutes().toString().padStart(2,"0");
  const reloj = document.getElementById("phone-clock");

  if (reloj) {
    reloj.textContent = `${horas}:${minutos}`;
  }
}

setInterval(actualizarHora, 1000);
actualizarHora();