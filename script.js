document.getElementById("year").textContent = new Date().getFullYear();

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz1FrEIblhsTKRP6O8ijOHOXZxNvmPxbARNQzmPKZPidsEUwuCCQYeFY2IEE5b5QBFStw/exec";
const form = document.getElementById("akuaiForm");
const modalConfirm = document.getElementById("modal-confirm");
const modalSuccess = document.getElementById("modal-success");
const modalMessage = document.getElementById("modal-message");

const TOTAL_INICIAL_COMBOS = 162;
let ultimoStockDomino = null;
let intervaloStock = null;

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

function mostrarMensaje(texto, titulo = "Akuai Eventos") {
  setText("message-title", titulo);
  setText("message-text", texto);
  if (modalMessage) modalMessage.style.display = "grid";
}

function cerrarMensaje() {
  if (modalMessage) modalMessage.style.display = "none";
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

function limpiarNombreArchivo(texto) {
  return String(texto || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]/g, "");
}

function mostrarFormulario() {
  document.getElementById("form-wrapper").style.display = "block";
  document.getElementById("cta-content").style.display = "none";
  document.getElementById("unete").scrollIntoView({ behavior: "smooth" });

  cargarStockVisual();
  cargarTasaBCV();
  iniciarStockEnTiempoReal();
}

function iniciarStockEnTiempoReal() {
  if (intervaloStock) clearInterval(intervaloStock);

  intervaloStock = setInterval(() => {
    cargarStockVisual();
  }, 15000);
}

function cerrarFormulario() {
  document.getElementById("form-wrapper").style.display = "none";
  document.getElementById("cta-content").style.display = "block";
}

function pintarStock(idTexto, idInput, cantidad) {
  const texto = document.getElementById(idTexto);
  const input = document.getElementById(idInput);

  if (!texto) return;

  if (cantidad <= 0) {
    texto.textContent = "AGOTADO";
    texto.style.color = "#c62828";
    if (input) input.disabled = true;
  } else {
    texto.textContent = `Disponible: ${cantidad}`;
    texto.style.color = "#2e7d32";
    if (input) input.disabled = false;
  }
}

async function cargarStockVisual() {
  try {
    setText("stock-message", "Cargando disponibilidad real...");

    const response = await fetch(`${WEB_APP_URL}?action=stock`);
    const data = await response.json();

    // 🔥 SI TODO ESTÁ AGOTADO
    if (data.cerrado) {
      document.getElementById("akuaiForm").style.display = "none";
      setText("stock-message", "🔥 VENTAS CERRADAS - TODO AGOTADO");
      setText("stock-progress-text", "AGOTADO");

      const barra = document.getElementById("stock-progress-fill");
      if (barra) {
        barra.style.width = "100%";
        barra.style.background = "#c62828";
      }

      return;
    }

    if (!data.ok) {
      throw new Error(data.error || "No se pudo cargar el stock.");
    }

    // 🔥 STOCK ACTUAL
    stockSabores = {
      "Catira": Number(data.stock["Catira"] || 0),
      "Pelúa": Number(data.stock["Pelúa"] || 0),
      "Reina Pepiada": Number(data.stock["Reina Pepiada"] || 0),
      "Rumbera": Number(data.stock["Rumbera"] || 0),
      "Akuai": Number(data.stock["Akuai"] || 0),
      "Dominó": Number(data.stock["Dominó"] || 0)
    };

    const disponiblesCombos = stockSabores["Dominó"];
    const vendidos = TOTAL_INICIAL_COMBOS - disponiblesCombos;
    const porcentaje = Math.max(0, Math.min(100, (vendidos / TOTAL_INICIAL_COMBOS) * 100));

    // 🔥 TEXTO INTELIGENTE
    let texto = "";

    if (disponiblesCombos <= 0) {
      texto = "🔥 AGOTADO";
    } else if (disponiblesCombos <= 10) {
      texto = `⚠️ Últimos ${disponiblesCombos} combos`;
    } else {
      texto = `${disponiblesCombos} disponibles de ${TOTAL_INICIAL_COMBOS}`;
    }

    setText("stock-progress-text", texto);

    // 🔥 BARRA ANIMADA
    const barra = document.getElementById("stock-progress-fill");

    if (barra) {
      barra.style.width = "0%";

      setTimeout(() => {
        barra.style.width = `${porcentaje}%`;

        // 🎨 COLOR DINÁMICO
        if (porcentaje >= 85) {
          barra.style.background = "#c62828"; // rojo
        } else if (porcentaje >= 55) {
          barra.style.background = "#f9a825"; // amarillo
        } else {
          barra.style.background = "#2e7d32"; // verde
        }
      }, 200);
    }

    // 🔥 DETECTAR VENTAS (ANIMACIÓN +1)
    if (ultimoStockDomino !== null && disponiblesCombos < ultimoStockDomino) {
      animarVentaDetectada(ultimoStockDomino - disponiblesCombos);
    }

    ultimoStockDomino = disponiblesCombos;

    // UI NORMAL
    setText("precio-combo-card", PRECIO_COMBO_USD);
    setText("stock-message", "Selecciona cantidades según disponibilidad real.");

    pintarStock("stock-catira", "flavor-catira", stockSabores["Catira"]);
    pintarStock("stock-pelua", "flavor-pelua", stockSabores["Pelúa"]);
    pintarStock("stock-reina", "flavor-reina", stockSabores["Reina Pepiada"]);
    pintarStock("stock-rumbera", "flavor-rumbera", stockSabores["Rumbera"]);
    pintarStock("stock-akuai", "flavor-akuai", stockSabores["Akuai"]);

  } catch (error) {
    console.warn("Error cargando stock:", error);
    setText("stock-message", "No se pudo cargar el stock. Intenta nuevamente.");
  }

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
      TASA_BCV = 0;
    }

  } catch (error) {
    console.warn("Error cargando tasa BCV:", error);
    TASA_BCV = 0;
  }

  actualizarResumenPedido();
}

function resetearSabores() {
  document.querySelectorAll("[data-sabor]").forEach(input => {
    input.value = 0;
  });

  document.querySelectorAll("[data-bebida]").forEach(input => {
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
      mostrarMensaje(`Ya elegiste los ${combos} sabor(es) necesarios.`);
      return;
    }

    if (valorActual >= disponible) {
      mostrarMensaje(`No hay más stock de ${sabor}. Disponible: ${disponible}.`);
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

function obtenerBebidasSeleccionadas() {
  const inputs = document.querySelectorAll("[data-bebida]");
  const bebidas = [];
  let total = 0;

  inputs.forEach(input => {
    const bebida = input.dataset.bebida;
    const cantidad = Number(input.value || 0);

    if (cantidad > 0) {
      bebidas.push({ bebida, cantidad });
      total += cantidad;
    }
  });

  return { bebidas, total };
}

function cambiarBebida(inputId, cambio) {
  const input = document.getElementById(inputId);
  const combos = Number(document.getElementById("f-combos").value || 1);
  const seleccion = obtenerBebidasSeleccionadas();

  let valorActual = Number(input.value || 0);

  if (cambio > 0) {
    if (seleccion.total >= combos) {
      mostrarMensaje(`Ya elegiste las ${combos} bebida(s) necesarias.`);
      return;
    }

    input.value = valorActual + 1;
  } else if (valorActual > 0) {
    input.value = valorActual - 1;
  }

  actualizarResumenPedido();
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
  const seleccionBebidas = obtenerBebidasSeleccionadas();
  const totalUsd = combos * PRECIO_COMBO_USD;
  const totalBs = totalUsd * TASA_BCV;

  setText("flavor-summary", `Has seleccionado ${seleccionSabores.total} de ${combos} sabor(es) a elección.`);

  const flavorSummary = document.getElementById("flavor-summary");
  if (flavorSummary) {
    flavorSummary.style.color = seleccionSabores.total === combos ? "#2e7d32" : "#777";
  }

  setText("drink-summary", `Has seleccionado ${seleccionBebidas.total} de ${combos} bebida(s).`);

  const drinkSummary = document.getElementById("drink-summary");
  if (drinkSummary) {
    drinkSummary.style.color = seleccionBebidas.total === combos ? "#2e7d32" : "#777";
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
  const seleccionBebidas = obtenerBebidasSeleccionadas();
  const modalidad = document.querySelector('input[name="modalidad"]:checked');
  const metodo = document.getElementById("f-metodo").value;
  const referencia = document.getElementById("f-referencia").value.trim();
  const capture = document.getElementById("f-capture").files[0];
  const totalUsd = combos * PRECIO_COMBO_USD;
  const totalBs = totalUsd * TASA_BCV;

  if (!modalidad) return mostrarMensaje("Selecciona si te quedarás en las ponencias o solo retirarás el pedido.");
  if (combos < 1) return mostrarMensaje("Debes seleccionar al menos 1 combo.");

  if (seleccion.total !== combos) {
    return mostrarMensaje(`La suma de sabores debe ser igual a la cantidad de combos. Seleccionaste ${seleccion.total} de ${combos}.`);
  }

  if (seleccionBebidas.total !== combos) {
    return mostrarMensaje(`La cantidad de bebidas debe ser igual a la cantidad de combos. Seleccionaste ${seleccionBebidas.total} de ${combos}.`);
  }

  if (!metodo) return mostrarMensaje("Selecciona un método de pago.");
  if (!referencia) return mostrarMensaje("Coloca la referencia de pago.");
  if (!capture) return mostrarMensaje("Debes subir el capture o comprobante de pago.");
  if (combos > stockSabores["Dominó"]) return mostrarMensaje(`No hay suficiente stock de Dominó. Disponible: ${stockSabores["Dominó"]}.`);

  for (let item of seleccion.sabores) {
    const disponible = Number(stockSabores[item.sabor] || 0);
    if (item.cantidad > disponible) {
      return mostrarMensaje(`No hay suficiente stock de ${item.sabor}. Disponible: ${disponible}.`);
    }
  }

  const resumenSabores = seleccion.sabores
    .map(item => `${item.sabor} x${item.cantidad}`)
    .join(", ");

  const resumenBebidas = seleccionBebidas.bebidas
    .map(item => `${item.bebida} x${item.cantidad}`)
    .join(", ");

  const extension = capture.name.includes(".")
    ? capture.name.substring(capture.name.lastIndexOf("."))
    : "";

  const referenciaLimpia = limpiarNombreArchivo(referencia);
  const nombreCaptureConReferencia = `${referenciaLimpia}_capture${extension}`;

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
    bebida: resumenBebidas,
    precio_combo_usd: PRECIO_COMBO_USD,
    total_usd: formatoUsd(totalUsd),
    tasa: TASA_BCV,
    total_bs: formatoBs(totalBs),
    metodo: metodo,
    referencia: referencia,
    capture_nombre: nombreCaptureConReferencia,
    capture_tipo: capture.type,
    capture_base64: await archivoABase64(capture)
  };

  setText("confirm-name", reservaPendiente.comprador);
  setText("confirm-email", reservaPendiente.email);
  setText("confirm-vendedor", reservaPendiente.vendedor);
  setText("confirm-modalidad", reservaPendiente.modalidad);
  setText("confirm-combo", `${combos} combo(s): Dominó x${combos} + ${resumenSabores}`);
  setText("confirm-bebida", resumenBebidas);
  setText("confirm-metodo", metodo);
  setText("confirm-referencia", referencia);
  setText("confirm-capture", nombreCaptureConReferencia);
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
    mostrarMensaje("No hay una reserva pendiente.");
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
    datos.append("capture_base64", reservaPendiente.capture_base64);
    datos.append("capture_nombre", reservaPendiente.capture_nombre);
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
    mostrarMensaje("Error al guardar la reserva: " + error.message, "No se pudo guardar");
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

function abrirPonente(img, nombre, titulo, desc) {
  document.getElementById("modal-img").src = img;
  document.getElementById("modal-nombre").textContent = nombre;
  document.getElementById("modal-titulo").textContent = titulo;
  document.getElementById("modal-desc").textContent = desc;

  document.getElementById("modal-ponente").style.display = "flex";
}

function cerrarPonente() {
  document.getElementById("modal-ponente").style.display = "none";
}
window.onclick = function(event) {
  const modal = document.getElementById("modal-ponente");
  if (event.target === modal) {
    cerrarPonente();
  }
};

function actualizarBarraStock(disponiblesCombos) {
  const vendidos = TOTAL_INICIAL_COMBOS - disponiblesCombos;
  const porcentaje = Math.max(0, Math.min(100, (vendidos / TOTAL_INICIAL_COMBOS) * 100));

  let texto = "";

  if (disponiblesCombos <= 0) {
    texto = "🔥 AGOTADO";
  } else if (disponiblesCombos <= 10) {
    texto = `⚠️ Últimos ${disponiblesCombos} combos`;
  } else {
    texto = `${disponiblesCombos} disponibles de ${TOTAL_INICIAL_COMBOS}`;
  }

  setText("stock-progress-text", texto);

  const barra = document.getElementById("stock-progress-fill");

  if (barra) {
    barra.style.width = `${porcentaje}%`;

    if (porcentaje >= 85) {
      barra.style.background = "#c62828";
    } else if (porcentaje >= 55) {
      barra.style.background = "#f9a825";
    } else {
      barra.style.background = "#2e7d32";
    }
  }
}

function animarVentaDetectada(cantidad = 1) {
  const hype = document.getElementById("stock-hype-message");
  if (!hype) return;

  hype.textContent = cantidad === 1
    ? "+1 combo vendido"
    : `+${cantidad} combos vendidos`;

  hype.classList.remove("show");
  void hype.offsetWidth;
  hype.classList.add("show");
}

async function actualizarStockEnTiempoReal() {
  try {
    const response = await fetch(`${WEB_APP_URL}?action=stock`);
    const data = await response.json();

    if (!data.ok) return;

    const nuevoStockDomino = Number(data.stock["Dominó"] || 0);

    stockSabores = {
      "Catira": Number(data.stock["Catira"] || 0),
      "Pelúa": Number(data.stock["Pelúa"] || 0),
      "Reina Pepiada": Number(data.stock["Reina Pepiada"] || 0),
      "Rumbera": Number(data.stock["Rumbera"] || 0),
      "Akuai": Number(data.stock["Akuai"] || 0),
      "Dominó": nuevoStockDomino
    };

    pintarStock("stock-catira", "flavor-catira", stockSabores["Catira"]);
    pintarStock("stock-pelua", "flavor-pelua", stockSabores["Pelúa"]);
    pintarStock("stock-reina", "flavor-reina", stockSabores["Reina Pepiada"]);
    pintarStock("stock-rumbera", "flavor-rumbera", stockSabores["Rumbera"]);
    pintarStock("stock-akuai", "flavor-akuai", stockSabores["Akuai"]);

    actualizarBarraStock(nuevoStockDomino);

    if (ultimoStockDomino !== null && nuevoStockDomino < ultimoStockDomino) {
      animarVentaDetectada(ultimoStockDomino - nuevoStockDomino);
    }

    ultimoStockDomino = nuevoStockDomino;

    if (data.cerrado || nuevoStockDomino <= 0) {
      setText("stock-message", "🔥 VENTAS CERRADAS - TODO AGOTADO");

      const submitBtn = document.querySelector(".submit-btn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Ventas cerradas";
      }
    }

  } catch (error) {
    console.warn("No se pudo actualizar stock en tiempo real:", error);
  }
}
