(async function () {
  // Espera a que la nube sincronice los datos (modo local resuelve al instante)
  await (window.__novaReady || Promise.resolve());

  // Guarda en localStorage y, si la nube está activa, también la sube
  function syncSet(key, value) {
    localStorage.setItem(key, value);
    if (window.NovaCloud && window.NovaCloud.enabled) {
      window.NovaCloud.push(key, value);
    }
  }

  const catalogEl = document.getElementById("catalog");
  const lineItemsEl = document.getElementById("lineItems");
  const sizePresetEl = document.getElementById("fSizePreset");
  const specsEl = document.getElementById("fSpecs");

  const fClientSelect = document.getElementById("fClientSelect");
  const fCliente = document.getElementById("fCliente");
  const fContacto = document.getElementById("fContacto");
  const fNumero = document.getElementById("fNumero");
  const fEntrega = document.getElementById("fEntrega");
  const fFecha = document.getElementById("fFecha");
  const fGarantia = document.getElementById("fGarantia");
  const fDeposito = document.getElementById("fDeposito");
  const fIdioma = document.getElementById("fIdioma");

  const tSubtotal = document.getElementById("tSubtotal");
  const tDeposito = document.getElementById("tDeposito");
  const tSaldo = document.getElementById("tSaldo");

  const previewWrap = document.getElementById("previewWrap");
  const previewDoc = document.getElementById("previewDoc");

  const quickAddInput = document.getElementById("quickAddInput");
  const quickAddPrice = document.getElementById("quickAddPrice");
  const catalogList = document.getElementById("catalogList");

  const PRICES_KEY = "novaCatalogPrices";
  const CLIENTS_KEY = "novaClients";
  const QUOTES_KEY = "novaQuotes";

  const savedPrices = JSON.parse(localStorage.getItem(PRICES_KEY) || "{}");
  let clients = JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]");
  let quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || "[]");

  let lineItems = [];
  let currentQuoteId = null;

  // ===== Catalogo plano (para autocompletar / cotizacion rapida) =====
  const flatCatalog = [];
  COMPONENT_CATALOG.forEach((cat) => {
    cat.items.forEach((item) => {
      flatCatalog.push({ category: cat.category, name: item.name, price: item.price });
    });
  });

  // ===== Catalogo de componentes (panel) =====
  COMPONENT_CATALOG.forEach((cat) => {
    const catDiv = document.createElement("div");
    catDiv.className = "catalog-cat";

    const h3 = document.createElement("h3");
    h3.textContent = cat.category;
    catDiv.appendChild(h3);

    cat.items.forEach((item) => {
      const key = `${cat.category}::${item.name}`;
      const price = savedPrices[key] !== undefined ? savedPrices[key] : item.price;
      item.price = price; // mantener catalogo en memoria sincronizado con precios guardados

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
        const val = parseFloat(priceInput.value) || 0;
        savedPrices[key] = val;
        item.price = val;
        syncSet(PRICES_KEY, JSON.stringify(savedPrices));
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

  // Datalist para cotizacion rapida
  flatCatalog.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item.name;
    opt.label = `${item.name} - $${item.price}`;
    catalogList.appendChild(opt);
  });

  quickAddInput.addEventListener("input", () => {
    const match = flatCatalog.find(
      (i) => i.name.toLowerCase() === quickAddInput.value.toLowerCase()
    );
    if (match) {
      quickAddPrice.value = match.price;
    }
  });

  document.getElementById("quickAddBtn").addEventListener("click", () => {
    const desc = quickAddInput.value.trim();
    if (!desc) return;
    const price = parseFloat(quickAddPrice.value) || 0;
    addLineItem(desc, price);
    quickAddInput.value = "";
    quickAddPrice.value = 0;
    quickAddInput.focus();
  });

  quickAddInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("quickAddBtn").click();
    }
  });

  // ===== Presets de tamano (specs / equipo como lineas con precio) =====
  TRAILER_SIZES.forEach((size) => {
    const opt = document.createElement("option");
    opt.value = size.id;
    opt.textContent = `Nova Food Trailer ${size.label}`;
    sizePresetEl.appendChild(opt);
  });

  sizePresetEl.addEventListener("change", () => {
    const size = TRAILER_SIZES.find((s) => s.id === sizePresetEl.value);
    if (!size) return;
    addLineItem(`8' x ${size.length}' Food Trailer - Unidad base`, size.price);
    size.specs.forEach((s) => addLineItem(s, 0));
    size.equipment.back.forEach((i) => addLineItem(i.name, 0));
    sizePresetEl.value = "";
  });

  // ===== Lineas de la cotizacion =====
  function addLineItem(desc, price) {
    lineItems.push({ desc, price });
    renderLineItems();
  }

  let dragSrcIndex = null;

  function renderLineItems() {
    lineItemsEl.innerHTML = "";
    lineItems.forEach((line, idx) => {
      const tr = document.createElement("tr");
      tr.draggable = true;

      tr.addEventListener("dragstart", (e) => {
        dragSrcIndex = idx;
        tr.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });
      tr.addEventListener("dragend", () => {
        tr.classList.remove("dragging");
      });
      tr.addEventListener("dragover", (e) => {
        e.preventDefault();
        tr.classList.add("drag-over");
      });
      tr.addEventListener("dragleave", () => {
        tr.classList.remove("drag-over");
      });
      tr.addEventListener("drop", (e) => {
        e.preventDefault();
        tr.classList.remove("drag-over");
        if (dragSrcIndex === null || dragSrcIndex === idx) return;
        const moved = lineItems.splice(dragSrcIndex, 1)[0];
        lineItems.splice(idx, 0, moved);
        dragSrcIndex = null;
        renderLineItems();
      });

      const tdHandle = document.createElement("td");
      tdHandle.className = "drag-handle";
      tdHandle.textContent = "⠇";
      tdHandle.title = "Arrastrar para reordenar";
      tr.appendChild(tdHandle);

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
    return { subtotal, deposito, saldo };
  }

  fDeposito.addEventListener("input", updateTotals);

  document.getElementById("addCustomLine").addEventListener("click", () => {
    addLineItem("", 0);
  });

  function formatMoney(n) {
    return `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // ===== CRM: clientes =====
  function persistClients() {
    syncSet(CLIENTS_KEY, JSON.stringify(clients));
  }

  function renderClientSelect() {
    fClientSelect.innerHTML = '<option value="">-- nuevo cliente --</option>';
    clients.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      fClientSelect.appendChild(opt);
    });
  }

  fClientSelect.addEventListener("change", () => {
    const client = clients.find((c) => c.id === fClientSelect.value);
    if (!client) return;
    fCliente.value = client.name;
    fContacto.value = client.contacto || "";
    fEntrega.value = client.ciudad || "";
  });

  function renderClientsTable() {
    const tbody = document.getElementById("clientsTable");
    tbody.innerHTML = "";
    if (clients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#7c8aa6;">Sin clientes todavia</td></tr>';
      return;
    }
    clients.forEach((c) => {
      const tr = document.createElement("tr");
      const quoteCount = quotes.filter((q) => q.clientId === c.id).length;
      tr.innerHTML = `
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.contacto || "")}</td>
        <td>${escapeHtml(c.ciudad || "")}</td>
        <td></td>
        <td>${escapeHtml(c.notas || "")}</td>
        <td>${quoteCount}</td>
        <td class="actions-cell"></td>
      `;
      const statusTd = tr.children[3];
      const statusSelect = document.createElement("select");
      ["Lead", "Cotizado", "Aceptado", "Perdido"].forEach((s) => {
        const o = document.createElement("option");
        o.value = s;
        o.textContent = s;
        if (s === c.status) o.selected = true;
        statusSelect.appendChild(o);
      });
      statusSelect.addEventListener("change", () => {
        c.status = statusSelect.value;
        persistClients();
      });
      statusTd.appendChild(statusSelect);

      const actionsTd = tr.children[6];
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn-small";
      delBtn.textContent = "Eliminar";
      delBtn.addEventListener("click", () => {
        if (!confirm(`Eliminar al cliente "${c.name}"?`)) return;
        clients = clients.filter((x) => x.id !== c.id);
        persistClients();
        renderClientsTable();
        renderClientSelect();
      });
      actionsTd.appendChild(delBtn);

      tbody.appendChild(tr);
    });
  }

  document.getElementById("btnAddClient").addEventListener("click", () => {
    const name = document.getElementById("cNombre").value.trim();
    if (!name) {
      alert("Escribe el nombre del cliente");
      return;
    }
    clients.push({
      id: "c" + Date.now(),
      name,
      contacto: document.getElementById("cContacto").value.trim(),
      ciudad: document.getElementById("cCiudad").value.trim(),
      status: document.getElementById("cEstatus").value,
      notas: document.getElementById("cNotas").value.trim(),
    });
    persistClients();
    document.getElementById("cNombre").value = "";
    document.getElementById("cContacto").value = "";
    document.getElementById("cCiudad").value = "";
    document.getElementById("cNotas").value = "";
    renderClientsTable();
    renderClientSelect();
  });

  function findOrCreateClient(name, contacto, ciudad) {
    if (!name) return null;
    let client = clients.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (!client) {
      client = {
        id: "c" + Date.now(),
        name,
        contacto: contacto || "",
        ciudad: ciudad || "",
        status: "Cotizado",
        notas: "",
      };
      clients.push(client);
    } else {
      if (contacto) client.contacto = contacto;
      if (ciudad) client.ciudad = ciudad;
      if (client.status === "Lead") client.status = "Cotizado";
    }
    persistClients();
    return client;
  }

  // ===== Cotizaciones guardadas =====
  function persistQuotes() {
    syncSet(QUOTES_KEY, JSON.stringify(quotes));
  }

  function renderQuotesTable() {
    const tbody = document.getElementById("quotesTable");
    tbody.innerHTML = "";
    if (quotes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#7c8aa6;">Sin cotizaciones guardadas todavia</td></tr>';
      return;
    }
    quotes
      .slice()
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .forEach((q) => {
        const subtotal = q.lineItems.reduce((sum, l) => sum + (parseFloat(l.price) || 0), 0);
        const saldo = subtotal - (parseFloat(q.deposito) || 0);

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(q.number || "")}</td>
          <td>${escapeHtml(q.cliente || "")}</td>
          <td>${escapeHtml(q.fecha || "")}</td>
          <td>${formatMoney(subtotal)}</td>
          <td>${formatMoney(saldo)}</td>
          <td></td>
          <td class="actions-cell"></td>
        `;

        const statusTd = tr.children[5];
        const statusSelect = document.createElement("select");
        ["Borrador", "Enviada", "Aceptado", "Rechazada"].forEach((s) => {
          const o = document.createElement("option");
          o.value = s;
          o.textContent = s;
          if (s === q.status) o.selected = true;
          statusSelect.appendChild(o);
        });
        statusSelect.addEventListener("change", () => {
          q.status = statusSelect.value;
          q.updatedAt = Date.now();
          persistQuotes();
        });
        statusTd.appendChild(statusSelect);

        const actionsTd = tr.children[6];
        const loadBtn = document.createElement("button");
        loadBtn.type = "button";
        loadBtn.className = "btn-small";
        loadBtn.textContent = "Cargar";
        loadBtn.addEventListener("click", () => loadQuote(q.id));

        const dupBtn = document.createElement("button");
        dupBtn.type = "button";
        dupBtn.className = "btn-small";
        dupBtn.textContent = "Duplicar";
        dupBtn.addEventListener("click", () => duplicateQuote(q.id));

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "btn-small";
        delBtn.textContent = "Eliminar";
        delBtn.addEventListener("click", () => {
          if (!confirm(`Eliminar la cotizacion ${q.number || ""}?`)) return;
          quotes = quotes.filter((x) => x.id !== q.id);
          persistQuotes();
          renderQuotesTable();
          renderClientsTable();
        });

        actionsTd.appendChild(loadBtn);
        actionsTd.appendChild(dupBtn);
        actionsTd.appendChild(delBtn);

        tbody.appendChild(tr);
      });
  }

  function loadQuote(id) {
    const q = quotes.find((x) => x.id === id);
    if (!q) return;
    currentQuoteId = q.id;
    fCliente.value = q.cliente || "";
    fContacto.value = q.contacto || "";
    fNumero.value = q.number || "";
    fEntrega.value = q.entrega || "";
    fFecha.value = q.fecha || "";
    fGarantia.value = q.garantia || "1 Año — Nova Food Trailer";
    fDeposito.value = q.deposito || 0;
    fIdioma.value = q.idioma || "es";
    fClientSelect.value = q.clientId || "";
    specsEl.value = (q.notas || []).join("\n");
    lineItems = (q.lineItems || []).map((l) => ({ ...l }));
    renderLineItems();
    switchTab("quote");
    previewWrap.classList.remove("show");
  }

  function duplicateQuote(id) {
    const q = quotes.find((x) => x.id === id);
    if (!q) return;
    loadQuote(id);
    currentQuoteId = null;
    fNumero.value = "";
    fFecha.value = new Date().toISOString().slice(0, 10);
  }

  document.getElementById("btnSave").addEventListener("click", () => {
    const { subtotal, deposito, saldo } = updateTotals();
    const client = findOrCreateClient(fCliente.value.trim(), fContacto.value.trim(), fEntrega.value.trim());

    const quoteData = {
      id: currentQuoteId || "q" + Date.now(),
      number: fNumero.value.trim(),
      clientId: client ? client.id : (fClientSelect.value || null),
      cliente: fCliente.value.trim(),
      contacto: fContacto.value.trim(),
      entrega: fEntrega.value.trim(),
      fecha: fFecha.value,
      garantia: fGarantia.value,
      idioma: fIdioma.value,
      deposito,
      lineItems: lineItems.map((l) => ({ ...l })),
      notas: specsEl.value.split("\n").map((s) => s.trim()).filter((s) => s !== ""),
      status: "Borrador",
      updatedAt: Date.now(),
    };

    const existingIdx = quotes.findIndex((x) => x.id === quoteData.id);
    if (existingIdx >= 0) {
      quoteData.status = quotes[existingIdx].status;
      quotes[existingIdx] = quoteData;
    } else {
      quotes.push(quoteData);
    }
    currentQuoteId = quoteData.id;
    persistQuotes();
    renderQuotesTable();
    renderClientSelect();
    renderClientsTable();
    alert("Cotizacion guardada.");
  });

  // ===== Traducciones del documento =====
  const I18N = {
    es: {
      locale: "es-MX",
      title: "COTIZACION DE VENTA",
      preparedBy: "PREPARADO POR",
      company: "EMPRESA",
      companyName: "Nova Food Trailer",
      date: "FECHA",
      quoteNo: "NO. DE COTIZACION",
      clientInfo: "Informacion del cliente",
      client: "CLIENTE",
      contact: "CONTACTO",
      deliverTo: "ENTREGA EN",
      warranty: "GARANTIA",
      paymentMethod: "FORMA DE PAGO",
      paymentMethodText: (dep) => `Deposito inicial de ${formatMoney(dep)} USD; saldo restante segun calendario de pagos acordado durante la construccion`,
      components: "Componentes de la cotizacion",
      qty: "CANT",
      description: "DESCRIPCION",
      unitPrice: "PRECIO UNIT.",
      total: "TOTAL",
      noComponents: "Sin componentes agregados",
      notesTitle: "Notas y especificaciones adicionales",
      priceSummary: "Resumen de precio",
      subtotal: "Subtotal",
      deposit: "Deposito inicial",
      remainingBalance: "SALDO RESTANTE",
      termsTitle: "Terminos y notas",
      warrantyNoteTitle: "Garantia",
      warrantyNoteText: "Este trailer incluye la garantia indicada arriba, gestionada a traves de Nova Food Trailer, cubriendo defectos de fabricacion. La garantia no cubre mal uso, danos accidentales ni desgaste normal.",
      paymentScheduleTitle: "Calendario de pagos",
      paymentScheduleText: "El deposito inicial es requerido para iniciar la construccion. El saldo restante se pagara en abonos acordados durante el periodo de construccion en Monclova. El pago completo debe realizarse antes de la entrega.",
      constructionTitle: "Construccion y entrega",
      constructionText: (dest) => `La construccion se realiza en Monclova, Mexico. La entrega estimada es en ${dest} una vez completada la construccion y liquidado el pago.`,
      destinationFallback: "el destino acordado",
      signaturesTitle: "Aceptacion y firmas",
      signaturesText: "Al firmar a continuacion, ambas partes aceptan los terminos descritos en esta cotizacion.",
      sellerSig: "Marcelo Ramos Schiaffino — Nova Food Trailer",
      clientSig: "Cliente",
      clientSigFallback: "Cliente",
    },
    en: {
      locale: "en-US",
      title: "SALES QUOTE",
      preparedBy: "PREPARED BY",
      company: "COMPANY",
      companyName: "Nova Food Trailer",
      date: "DATE",
      quoteNo: "QUOTE NO.",
      clientInfo: "Customer information",
      client: "CUSTOMER",
      contact: "CONTACT",
      deliverTo: "DELIVERY TO",
      warranty: "WARRANTY",
      paymentMethod: "PAYMENT TERMS",
      paymentMethodText: (dep) => `Initial deposit of ${formatMoney(dep)} USD; remaining balance according to the payment schedule agreed during construction`,
      components: "Quote components",
      qty: "QTY",
      description: "DESCRIPTION",
      unitPrice: "UNIT PRICE",
      total: "TOTAL",
      noComponents: "No components added",
      notesTitle: "Additional notes and specifications",
      priceSummary: "Price summary",
      subtotal: "Subtotal",
      deposit: "Initial deposit",
      remainingBalance: "REMAINING BALANCE",
      termsTitle: "Terms and notes",
      warrantyNoteTitle: "Warranty",
      warrantyNoteText: "This trailer includes the warranty indicated above, handled through Nova Food Trailer, covering manufacturing defects. The warranty does not cover misuse, accidental damage or normal wear and tear.",
      paymentScheduleTitle: "Payment schedule",
      paymentScheduleText: "The initial deposit is required to start construction. The remaining balance will be paid in installments agreed during the construction period in Monclova. Full payment must be made before delivery.",
      constructionTitle: "Construction and delivery",
      constructionText: (dest) => `Construction takes place in Monclova, Mexico. Estimated delivery is in ${dest} once construction is complete and payment is settled.`,
      destinationFallback: "the agreed destination",
      signaturesTitle: "Acceptance and signatures",
      signaturesText: "By signing below, both parties accept the terms described in this quote.",
      sellerSig: "Marcelo Ramos Schiaffino — Nova Food Trailer",
      clientSig: "Customer",
      clientSigFallback: "Customer",
    },
  };

  // ===== Generar documento de cotizacion =====
  function buildPreview() {
    const { subtotal, deposito, saldo } = updateTotals();
    const t = I18N[fIdioma.value] || I18N.es;

    const fechaVal = fFecha.value
      ? new Date(fFecha.value + "T00:00:00").toLocaleDateString(t.locale, { year: "numeric", month: "long", day: "numeric" })
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
      <div class="doc-title">${t.title}</div>

      <div class="doc-meta">
        <div>
          <div class="label">${t.preparedBy}</div>
          <div class="value">Marcelo Ramos Schiaffino</div>
          <div class="label" style="margin-top:6px;">${t.company}</div>
          <div class="value">${t.companyName}</div>
        </div>
        <div style="text-align:right;">
          <div class="label">${t.date}</div>
          <div class="value">${escapeHtml(fechaVal)}</div>
          <div class="label" style="margin-top:6px;">${t.quoteNo}</div>
          <div class="value">${escapeHtml(fNumero.value)}</div>
        </div>
      </div>

      <div class="doc-section">${t.clientInfo}</div>
      <table class="doc-client">
        <tr><td class="label">${t.client}</td><td>${escapeHtml(fCliente.value)}</td></tr>
        <tr><td class="label">${t.contact}</td><td>${escapeHtml(fContacto.value)}</td></tr>
        <tr><td class="label">${t.deliverTo}</td><td>${escapeHtml(fEntrega.value)}</td></tr>
        <tr><td class="label">${t.warranty}</td><td>${escapeHtml(fGarantia.value)}</td></tr>
        <tr><td class="label">${t.paymentMethod}</td><td>${t.paymentMethodText(deposito)}</td></tr>
      </table>

      <div class="doc-section">${t.components}</div>
      <table class="doc-product">
        <tr><th>${t.qty}</th><th>${t.description}</th><th class="num">${t.unitPrice}</th><th class="num">${t.total}</th></tr>
        ${rows || `<tr><td colspan="4" style="text-align:center; color:#7c8aa6;">${t.noComponents}</td></tr>`}
      </table>

      ${specLines ? `
      <div class="doc-section">${t.notesTitle}</div>
      <ul class="doc-list">${specLines}</ul>
      ` : ""}

      <div class="doc-section">${t.priceSummary}</div>
      <table class="doc-pricing">
        <tr><td class="label">${t.subtotal}</td><td style="width:140px;">${formatMoney(subtotal)}</td></tr>
        <tr><td class="label">${t.deposit}</td><td>- ${formatMoney(deposito)}</td></tr>
        <tr class="total"><td class="label">${t.remainingBalance}</td><td>${formatMoney(saldo)}</td></tr>
      </table>

      <div class="doc-section">${t.termsTitle}</div>
      <div class="doc-note">
        <b>${t.warrantyNoteTitle}</b>
        ${t.warrantyNoteText}
      </div>
      <div class="doc-note">
        <b>${t.paymentScheduleTitle}</b>
        ${t.paymentScheduleText}
      </div>
      <div class="doc-note">
        <b>${t.constructionTitle}</b>
        ${t.constructionText(escapeHtml(fEntrega.value || t.destinationFallback))}
      </div>

      <div class="doc-section">${t.signaturesTitle}</div>
      <p style="font-size:12.5px; color:#5b6b8c;">${t.signaturesText}</p>
      <div class="doc-signatures">
        <div class="doc-sig">${t.sellerSig}</div>
        <div class="doc-sig">${escapeHtml(fCliente.value || t.clientSigFallback)} — ${t.clientSig}</div>
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
    if (!confirm("Esto borrara los datos de la cotizacion actual (no afecta el catalogo, clientes ni cotizaciones guardadas). Continuar?")) return;
    lineItems = [];
    currentQuoteId = null;
    renderLineItems();
    fCliente.value = "";
    fContacto.value = "";
    fNumero.value = "";
    fEntrega.value = "";
    fFecha.value = new Date().toISOString().slice(0, 10);
    fDeposito.value = "0";
    fIdioma.value = "es";
    fClientSelect.value = "";
    specsEl.value = "";
    sizePresetEl.value = "";
    previewWrap.classList.remove("show");
    updateTotals();
  });

  // ===== Tabs =====
  function switchTab(name) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === name);
    });
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `tab-${name}`);
    });
  }

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Fecha por defecto: hoy
  fFecha.value = new Date().toISOString().slice(0, 10);

  renderLineItems();
  renderClientSelect();
  renderClientsTable();
  renderQuotesTable();
})();
