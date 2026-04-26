document.getElementById("year").textContent = new Date().getFullYear();

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzvD68OutaasdqHyPdLr8zr7CLiMaTnCjgVkzNRZdqW0_1qaQamTuoXe1EJLtbg4epqUA/exec";
const form = document.getElementById("akuaiForm");
const modalConfirm = document.getElementById("modal-confirm");
const modalSuccess = document.getElementById("modal-success");

const PRECIO_COMBO_USD = 5;
let TASA_BCV = 0;
let reservaPendiente = null;

let stockSabores = {
  "Catira": 0,
  "Pelúa": 0,
  "Reina Pepiada": 0,
  "Rumbera": 0,
  "Akuai": 0,
  "Dominó": 0
};

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatoBs(monto) {
  return Number(monto || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatoUsd(monto) {
  return Number(monto || 0).toFixed(2);
}

function obtenerFechaCompra() {
  return new Date().toLocaleString("es-VE", {
    timeZone: "America/Caracas",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
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
    "Pelúa": 25,
    "Reina Pepiada": 25,
    "Rumbera": 25,
    "Akuai": 25,
    "Dominó": 162
  };

  setText("precio-combo-card", PRECIO_COMBO_USD);
  setText("stock-message", "Selecciona cantidades según disponibilidad.");
  setText("stock-catira", `Disponible: ${stockSabores["Catira"]}`);
  setText("stock-pelua", `Disponible: ${stockSabores["Pelúa"]}`);
  setText("stock-reina", `Disponible: ${stockSabores["Reina Pepiada"]}`);
  setText("stock-rumbera", `Disponible: ${stockSabores["Rumbera"]}`);
  setText("stock-akuai", `Disponible: ${stockSabores["Akuai"]}`);

  actualizarResumenPedido();
}

async function cargarTasaBCV() {
  try {
    setText("tasa-bcv-text", "Cargando...");
    setText("total-bs-text", "Cargando...");

    const response = await fetch(`${WEB_APP_URL}?action=bcv`);
    const data = await response.json();

    if (data.ok && Number(data.tasa) > 0) {
      TASA_BCV = Number(data.tasa);
    } else {
      console.warn("Respuesta sin tasa válida:", data);
      TASA_BCV = 0;
    }
  } catch (error) {
    console.warn("No se pudo cargar la tasa BCV:", error);
    TASA_BCV = 0;
  }

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

  if (!bloque || !datos) return;

  if (metodo === "Pago móvil" || metodo === "Transferencia") {
    bloque.classList.remove("payment-hidden");
  } else {
    bloque.classList.add("payment-hidden");
    datos.classList.remove("datos-pago-open");
  }
}

function togglePago() {
  const datos = document.getElementById("datos-pago");
  if (datos) datos.classList.toggle("datos-pago-open");
}

function actualizarResumenPedido() {
  const combos = Number(document.getElementById("f-combos").value || 1);
  const seleccionSabores = obtenerSaboresSeleccionados();
  const bebida = obtenerBebidaSeleccionada();
  const totalUsd = combos * PRECIO_COMBO_USD;
  const totalBs = totalUsd * TASA_BCV;

  setText("flavor-summary", `Has seleccionado ${seleccionSabores.total} de ${combos} sabor(es) a elección.`);

  const flavorSummary = document.getElementById("flavor-summary");
  if (flavorSummary) {
    flavorSummary.style.color = seleccionSabores.total === combos ? "#2e7d32" : "#777";
  }

  setText("drink-summary", bebida ? `Bebida seleccionada: ${bebida}` : "No has seleccionado bebida.");

  const drinkSummary = document.getElementById("drink-summary");
  if (drinkSummary) {
    drinkSummary.style.color = bebida ? "#2e7d32" : "#777";
  }

  setText("precio-combo-text", formatoUsd(PRECIO_COMBO_USD));
  setText("combos-total-text", combos);
  setText("total-usd-text", formatoUsd(totalUsd));

  if (TASA_BCV > 0) {
    setText("tasa-bcv-text", formatoBs(TASA_BCV));
    setText("total-bs-text", formatoBs(totalBs));
  } else {
    setText("tasa-bcv-text", "--");
    setText("total-bs-text", "--");
  }
}

function archivoABase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = String(reader.result).split(",")[1];
      resolve(base64);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

form.onsubmit = async function(e) {
  e.preventDefault();

  const combos = Number(document.getElementById("f-combos").value || 1);
  const seleccion = obtenerSaboresSeleccionados();
  const bebida = obtenerBebidaSeleccionada();
  const modalidad = document.querySelector('input[name="modalidad"]:checked');
  const metodo = document.getElementById("f-metodo").value;
  const referencia = document.getElementById("f-referencia").value.trim();
  const capture = document.getElementById("f-capture").files[0];
  const totalUsd = combos * PRECIO_COMBO_USD;
  const totalBs = totalUsd * TASA_BCV;

  if (!modalidad) return alert("Selecciona si te quedarás en las ponencias o solo retirarás el pedido.");
  if (combos < 1) return alert("Debes seleccionar al menos 1 combo.");
  if (seleccion.total !== combos) return alert(`La suma de sabores debe ser igual a la cantidad de combos. Seleccionaste ${seleccion.total} de ${combos}.`);
  if (!bebida) return alert("Selecciona una bebida.");
  if (!metodo) return alert("Selecciona un método de pago.");
  if (!referencia) return alert("Coloca la referencia de pago.");
  if (!capture) return alert("Debes subir el capture o comprobante de pago.");
  if (combos > stockSabores["Dominó"]) return alert(`No hay suficiente stock de Dominó. Disponible: ${stockSabores["Dominó"]}`);

  for (let item of seleccion.sabores) {
    const disponible = Number(stockSabores[item.sabor] || 0);
    if (item.cantidad > disponible) {
      return alert(`No hay suficiente stock de ${item.sabor}. Disponible: ${disponible}`);
    }
  }

  const resumenSabores = seleccion.sabores.map(item => `${item.sabor} x${item.cantidad}`).join(", ");

  reservaPendiente = {
    fecha: obtenerFechaCompra(),
    comprador: document.getElementById("f-nombre").value.trim(),
    cedula: document.getElementById("f-cedula").value.trim(),
    whatsapp: document.getElementById("f-whatsapp").value.trim(),
    email: document.getElementById("f-email").value.trim(),
    semestre: document.getElementById("f-semestre").value.trim(),
    vendedor: document.getElementById("f-vendedor").value.trim(),
    modalidad: modalidad.value,
    combos: combos,
    catira: seleccion.sabores.find(x => x.sabor === "Catira")?.cantidad || 0,
    pelua: seleccion.sabores.find(x => x.sabor === "Pelúa")?.cantidad || 0,
    reina: seleccion.sabores.find(x => x.sabor === "Reina Pepiada")?.cantidad || 0,
    rumbera: seleccion.sabores.find(x => x.sabor === "Rumbera")?.cantidad || 0,
    akuai: seleccion.sabores.find(x => x.sabor === "Akuai")?.cantidad || 0,
    domino: combos,
    bebida: bebida,
    precio_combo_usd: PRECIO_COMBO_USD,
    total_usd: formatoUsd(totalUsd),
    tasa: TASA_BCV,
    total_bs: formatoBs(totalBs),
    metodo: metodo,
    referencia: referencia,
    capture_nombre: capture.name,
    capture_tipo: capture.type,
    capture_base64: await archivoABase64(capture)
  };

  setText("confirm-name", reservaPendiente.comprador);
  setText("confirm-email", reservaPendiente.email);
  setText("confirm-vendedor", reservaPendiente.vendedor);
  setText("confirm-modalidad", reservaPendiente.modalidad);
  setText("confirm-combo", `${combos} combo(s): Dominó x${combos} + ${resumenSabores}`);
  setText("confirm-bebida", bebida);
  setText("confirm-metodo", metodo);
  setText("confirm-referencia", referencia);
  setText("confirm-capture", capture.name);
  setText("confirm-total-usd", `$${formatoUsd(totalUsd)}`);
  setText("confirm-tasa-bcv", TASA_BCV > 0 ? `Bs ${formatoBs(TASA_BCV)}` : "No disponible");
  setText("confirm-total-bs", TASA_BCV > 0 ? `Bs ${formatoBs(totalBs)}` : "No disponible");

  modalConfirm.style.display = "grid";
};

function cerrarConfirm() {
  modalConfirm.style.display = "none";
}

async function mostrarExito() {
  if (!reservaPendiente) {
    alert("No hay una reserva pendiente.");
    return;
  }

  try {
    const boton = document.querySelector(".btn-confirm");
    if (boton) {
      boton.disabled = true;
      boton.textContent = "Guardando...";
    }

    const datos = new URLSearchParams();
    datos.append("action", "reservar");
    datos.append("nombre", reservaPendiente.comprador);
    datos.append("cedula", reservaPendiente.cedula);
    datos.append("whatsapp", reservaPendiente.whatsapp);
    datos.append("email", reservaPendiente.email);
    datos.append("semestre", reservaPendiente.semestre);
    datos.append("vendedor", reservaPendiente.vendedor);
    datos.append("modalidad", reservaPendiente.modalidad);
    datos.append("combos", reservaPendiente.combos);
    datos.append("catira", reservaPendiente.catira);
    datos.append("pelua", reservaPendiente.pelua);
    datos.append("reina", reservaPendiente.reina);
    datos.append("rumbera", reservaPendiente.rumbera);
    datos.append("akuai", reservaPendiente.akuai);
    datos.append("bebida", reservaPendiente.bebida);
    datos.append("metodo", reservaPendiente.metodo);
    datos.append("referencia", reservaPendiente.referencia);
    datos.append("capture", reservaPendiente.capture_nombre);

    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      body: datos
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "No se pudo guardar la reserva.");
    }

    modalConfirm.style.display = "none";
    modalSuccess.style.display = "grid";
    form.reset();
    resetearSabores();
    actualizarResumenPedido();

  } catch (error) {
    alert("Error al guardar la reserva: " + error.message);
  } finally {
    const boton = document.querySelector(".btn-confirm");
    if (boton) {
      boton.disabled = false;
      boton.textContent = "Sí, reservar";
    }
  }
}

function enviarFinal() {
  modalSuccess.style.display = "none";
  reservaPendiente = null;
  cerrarFormulario();
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

  if (reloj) reloj.textContent = `${horas}:${minutos}`;
}

setInterval(actualizarHora, 1000);
actualizarHora();