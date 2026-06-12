(function () {
  const catalogEl = document.getElementById("catalog");
  const lineItemsEl = document.getElementById("lineItems");
  const sizePresetEl = document.getElementById("fSizePreset");
  const specsEl = document.getElementById("fSpecs");

  const fCliente = document.getElementById("fCliente");
  const fNumero = document.getElementById("fNumero");
  const fEntrega = document.getElementById("fEntrega");
  const fFecha = document.getElementById("fFecha");
  const fGarantia = document.getElementById("fGarantia");
  const fDeposito = document.getElementById("fDeposito");

  const tSubtotal = document.getElementById("tSubtotal");
  const tDeposito = document.getElementById("tDeposito");
  const tSaldo = document.getElementById("tSaldo");

  const previewWrap = document.getElementById("previewWrap");
  const previewDoc = document.getElementById("previewDoc");

  const PRICES_KEY = "novaCatalogPrices";
  const savedPrices = JSON.parse(localStorage.getItem(PRICES_KEY) || "{}");

  let lineItems = [];

  // ===== Catalogo de componentes =====
  COMPONENT_CATALOG.forEach((cat) => {
    const catDiv = document.createElement("div");
    catDiv.className = "catalog-cat";

    const h3 = document.createElement("h3");
    h3.textContent = cat.category;
    catDiv.appendChild(h3);

    cat.items.forEach((item) => {
      const key = `${cat.category}::${item.name}`;
      const price = savedPrices[key] !== undefined ? savedPrices[key] : item.price;

      const row = document.createElement("div");
      row.className = "catalog-item";

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = item.name;

      const priceInput = document.createElement("input");
      priceInput.type = "number";
      priceInput.className = "price";
      priceInput.min = "0";
      priceInput.step = "10";
      priceInput.value = price;
      priceInput.addEventListener("change", () => {
        savedPrices[key] = parseFloat(priceInput.value) || 0;
        localStorage.setItem(PRICES_KEY, JSON.stringify(savedPrices));
      });

      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.textContent = "+";
      addBtn.title = "Agregar a la cotizacion";
      addBtn.addEventListener("click", () => {
        addLineItem(item.name, parseFloat(priceInput.value) || 0);
      });

      row.appendChild(name);
      row.appendChild(priceInput);
      row.appendChild(addBtn);
      catDiv.appendChild(row);
    });

    catalogEl.appendChild(catDiv);
  });

  // ===== Presets de tamano (specs / equipo) =====
  TRAILER_SIZES.forEach((size) => {
    const opt = document.createElement("option");
    opt.value = size.id;
    opt.textContent = `Nova Food Trailer ${size.label}`;
    sizePresetEl.appendChild(opt);
  });

  sizePresetEl.addEventListener("change", () => {
    const size = TRAILER_SIZES.find((s) => s.id === sizePresetEl.value);
    if (!size) return;
    const lines = [
      ...size.specs,
      ...size.equipment.back.map((i) => i.name),
    ];
    specsEl.value = lines.join("\n");
  });

  // ===== Lineas de la cotizacion =====
  function addLineItem(desc, price) {
    lineItems.push({ desc, price });
    renderLineItems();
  }

  function renderLineItems() {
    lineItemsEl.innerHTML = "";
    lineItems.forEach((line, idx) => {
      const tr = document.createElement("tr");

      const tdDesc = document.createElement("td");
      const descInput = document.createElement("input");
      descInput.type = "text";
      descInput.className = "line-desc";
      descInput.value = line.desc;
      descInput.addEventListener("input", () => {
        lineItems[idx].desc = descInput.value;
      });
      tdDesc.appendChild(descInput);

      const tdPrice = document.createElement("td");
      tdPrice.className = "num";
      const priceInput = document.createElement("input");
      priceInput.type = "number";
      priceInput.className = "line-price";
      priceInput.min = "0";
      priceInput.step = "10";
      priceInput.value = line.price;
      priceInput.addEventListener("input", () => {
        lineItems[idx].price = parseFloat(priceInput.value) || 0;
        updateTotals();
      });
      tdPrice.appendChild(priceInput);

      const tdRemove = document.createElement("td");
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove";
      removeBtn.textContent = "x";
      removeBtn.addEventListener("click", () => {
        lineItems.splice(idx, 1);
        renderLineItems();
      });
      tdRemove.appendChild(removeBtn);

      tr.appendChild(tdDesc);
      tr.appendChild(tdPrice);
      tr.appendChild(tdRemove);
      lineItemsEl.appendChild(tr);
    });
    updateTotals();
  }

  function updateTotals() {
    const subtotal = lineItems.reduce((sum, l) => sum + (parseFloat(l.price) || 0), 0);
    const deposito = parseFloat(fDeposito.value) || 0;
    const saldo = subtotal - deposito;
    tSubtotal.textContent = formatMoney(subtotal);
    tDeposito.textContent = `- ${formatMoney(deposito)}`;
    tSaldo.textContent = formatMoney(saldo);
  }

  fDeposito.addEventListener("input", updateTotals);

  document.getElementById("addCustomLine").addEventListener("click", () => {
    addLineItem("", 0);
  });

  function formatMoney(n) {
    return `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // ===== Generar documento de cotizacion =====
  function buildPreview() {
    const subtotal = lineItems.reduce((sum, l) => sum + (parseFloat(l.price) || 0), 0);
    const deposito = parseFloat(fDeposito.value) || 0;
    const saldo = subtotal - deposito;

    const fechaVal = fFecha.value
      ? new Date(fFecha.value + "T00:00:00").toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
      : "";

    const rows = lineItems
      .filter((l) => l.desc.trim() !== "")
      .map(
        (l) => `
        <tr>
          <td>1</td>
          <td>${escapeHtml(l.desc)}</td>
          <td class="num">${formatMoney(l.price)}</td>
          <td class="num">${formatMoney(l.price)}</td>
        </tr>`
      )
      .join("");

    const specLines = specsEl.value
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .map((s) => `<li>${escapeHtml(s)}</li>`)
      .join("");

    previewDoc.innerHTML = `
      <div class="doc-header">
        <img src="assets/nova_logo.png" alt="Nova Food Trailer">
        <h1>NOVA</h1>
      </div>
      <div class="doc-tagline">F O O D &nbsp;&nbsp;&nbsp; T R A I L E R</div>
      <div class="doc-title">COTIZACION DE VENTA</div>

      <div class="doc-meta">
        <div>
          <div class="label">PREPARADO POR</div>
          <div class="value">Marcelo Ramos Schiaffino</div>
          <div class="label" style="margin-top:6px;">EMPRESA</div>
          <div class="value">Nova Food Trailer</div>
        </div>
        <div style="text-align:right;">
          <div class="label">FECHA</div>
          <div class="value">${escapeHtml(fechaVal)}</div>
          <div class="label" style="margin-top:6px;">NO. DE COTIZACION</div>
          <div class="value">${escapeHtml(fNumero.value)}</div>
        </div>
      </div>

      <div class="doc-section">Informacion del cliente</div>
      <table class="doc-client">
        <tr><td class="label">CLIENTE</td><td>${escapeHtml(fCliente.value)}</td></tr>
        <tr><td class="label">ENTREGA EN</td><td>${escapeHtml(fEntrega.value)}</td></tr>
        <tr><td class="label">GARANTIA</td><td>${escapeHtml(fGarantia.value)}</td></tr>
        <tr><td class="label">FORMA DE PAGO</td><td>Deposito inicial de ${formatMoney(deposito)} USD; saldo restante segun calendario de pagos acordado durante la construccion</td></tr>
      </table>

      <div class="doc-section">Componentes de la cotizacion</div>
      <table class="doc-product">
        <tr><th>CANT</th><th>DESCRIPCION</th><th class="num">PRECIO UNIT.</th><th class="num">TOTAL</th></tr>
        ${rows || `<tr><td colspan="4" style="text-align:center; color:#7c8aa6;">Sin componentes agregados</td></tr>`}
      </table>

      ${specLines ? `
      <div class="doc-section">Especificaciones y equipo incluido</div>
      <ul class="doc-list">${specLines}</ul>
      ` : ""}

      <div class="doc-section">Resumen de precio</div>
      <table class="doc-pricing">
        <tr><td class="label">Subtotal</td><td style="width:140px;">${formatMoney(subtotal)}</td></tr>
        <tr><td class="label">Deposito inicial</td><td>- ${formatMoney(deposito)}</td></tr>
        <tr class="total"><td class="label">SALDO RESTANTE</td><td>${formatMoney(saldo)}</td></tr>
      </table>

      <div class="doc-section">Terminos y notas</div>
      <div class="doc-note">
        <b>Garantia</b>
        Este trailer incluye la garantia indicada arriba, gestionada a traves de Nova Food Trailer, cubriendo defectos de fabricacion. La garantia no cubre mal uso, danos accidentales ni desgaste normal.
      </div>
      <div class="doc-note">
        <b>Calendario de pagos</b>
        El deposito inicial es requerido para iniciar la construccion. El saldo restante se pagara en abonos acordados durante el periodo de construccion en Monclova. El pago completo debe realizarse antes de la entrega.
      </div>
      <div class="doc-note">
        <b>Construccion y entrega</b>
        La construccion se realiza en Monclova, Mexico. La entrega estimada es en ${escapeHtml(fEntrega.value || "el destino acordado")} una vez completada la construccion y liquidado el pago.
      </div>

      <div class="doc-section">Aceptacion y firmas</div>
      <p style="font-size:12.5px; color:#5b6b8c;">Al firmar a continuacion, ambas partes aceptan los terminos descritos en esta cotizacion.</p>
      <div class="doc-signatures">
        <div class="doc-sig">Marcelo Ramos Schiaffino — Nova Food Trailer</div>
        <div class="doc-sig">${escapeHtml(fCliente.value || "Cliente")} — Cliente</div>
      </div>

      <div class="doc-footer">
        <b>Nova Food Trailer</b> &middot; Marcelo Ramos Schiaffino &middot; +1 (645) 235-3186 &middot; marceloramosch@gmail.com
      </div>
    `;

    previewWrap.classList.add("show");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  document.getElementById("btnPreview").addEventListener("click", () => {
    buildPreview();
    previewWrap.scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("btnPrint").addEventListener("click", () => {
    buildPreview();
    window.print();
  });

  document.getElementById("btnReset").addEventListener("click", () => {
    if (!confirm("Esto borrara los datos de la cotizacion actual (no afecta los precios del catalogo). Continuar?")) return;
    lineItems = [];
    renderLineItems();
    fCliente.value = "";
    fNumero.value = "";
    fEntrega.value = "";
    fFecha.value = "";
    fDeposito.value = "0";
    specsEl.value = "";
    sizePresetEl.value = "";
    previewWrap.classList.remove("show");
    updateTotals();
  });

  // Fecha por defecto: hoy
  fFecha.value = new Date().toISOString().slice(0, 10);

  renderLineItems();
})();
