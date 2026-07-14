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

  const finPrincipal = document.getElementById("finPrincipal");
  const finTasa = document.getElementById("finTasa");
  const finPlazo = document.getElementById("finPlazo");
  const finIncluirPdf = document.getElementById("finIncluirPdf");
  const finUseSaldoBtn = document.getElementById("finUseSaldoBtn");
  const finSummary = document.getElementById("finSummary");
  const finPagoMensual = document.getElementById("finPagoMensual");
  const finTotalIntereses = document.getElementById("finTotalIntereses");
  const finTotalPagar = document.getElementById("finTotalPagar");
  const finTableWrap = document.getElementById("finTableWrap");
  const finTableBody = document.getElementById("finTableBody");
  const finExhibitBtn = document.getElementById("finExhibitBtn");

  const PRICES_KEY = "novaCatalogPrices";
  const CLIENTS_KEY = "novaClients";
  const QUOTES_KEY = "novaQuotes";

  const savedPrices = JSON.parse(localStorage.getItem(PRICES_KEY) || "{}");
  let clients = JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]");
  let quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || "[]");

  let lineItems = [];
  let currentQuoteId = null;
  let finPrincipalManual = false;
  let currentFinancePlan = null; // { principal, tasa, plazo, totalInterest, totalPayment, basePayment, schedule }

  // ===== Traduccion del contenido de equipos (ES -> EN) =====
  const EQ_I18N = typeof EQUIPMENT_I18N !== "undefined" ? EQUIPMENT_I18N : {};
  // Devuelve el texto del equipo/spec en el idioma de la cotizacion.
  // El nombre canonico (espanol) se mantiene como clave de precio y como valor guardado.
  function trEquip(name) {
    if (fIdioma.value === "en" && EQ_I18N[name]) return EQ_I18N[name];
    return name;
  }

  // ===== Catalogo plano (para autocompletar / cotizacion rapida) =====
  const flatCatalog = [];
  COMPONENT_CATALOG.forEach((cat) => {
    cat.items.forEach((item) => {
      flatCatalog.push({ category: cat.category, name: item.name, price: item.price });
    });
  });

  // ===== Catalogo de componentes (panel) =====
  function renderCatalog() {
    catalogEl.innerHTML = "";
    COMPONENT_CATALOG.forEach((cat) => {
      const catDiv = document.createElement("div");
      catDiv.className = "catalog-cat";

      const h3 = document.createElement("h3");
      h3.textContent = trEquip(cat.category);
      catDiv.appendChild(h3);

      cat.items.forEach((item) => {
        const key = `${cat.category}::${item.name}`;
        const price = savedPrices[key] !== undefined ? savedPrices[key] : item.price;
        item.price = price; // mantener catalogo en memoria sincronizado con precios guardados

        const row = document.createElement("div");
        row.className = "catalog-item";

        const name = document.createElement("span");
        name.className = "name";
        name.textContent = trEquip(item.name);

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
          addLineItem(trEquip(item.name), parseFloat(priceInput.value) || 0);
        });

        row.appendChild(name);
        row.appendChild(priceInput);
        row.appendChild(addBtn);
        catDiv.appendChild(row);
      });

      catalogEl.appendChild(catDiv);
    });
  }

  // Datalist para cotizacion rapida (en el idioma seleccionado)
  function renderDatalist() {
    catalogList.innerHTML = "";
    flatCatalog.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = trEquip(item.name);
      opt.label = `${trEquip(item.name)} - $${item.price}`;
      catalogList.appendChild(opt);
    });
  }

  quickAddInput.addEventListener("input", () => {
    const val = quickAddInput.value.toLowerCase();
    const match = flatCatalog.find(
      (i) => i.name.toLowerCase() === val || trEquip(i.name).toLowerCase() === val
    );
    if (match) {
      quickAddPrice.value = match.price;
    }
  });

  // Re-renderiza el catalogo y el autocompletado cuando cambia el idioma
  fIdioma.addEventListener("change", () => {
    renderCatalog();
    renderDatalist();
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
    addLineItem(trEquip(`8' x ${size.length}' Food Trailer - Unidad base`), size.price);
    size.specs.forEach((s) => addLineItem(trEquip(s), 0));
    size.equipment.back.forEach((i) => addLineItem(trEquip(i.name), 0));
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
    if (!finPrincipalManual) {
      finPrincipal.value = saldo > 0 ? saldo.toFixed(2) : "0";
      recalcFinance();
    }
    return { subtotal, deposito, saldo };
  }

  fDeposito.addEventListener("input", updateTotals);

  document.getElementById("addCustomLine").addEventListener("click", () => {
    addLineItem("", 0);
  });

  function formatMoney(n) {
    return `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // ===== Financiamiento interno (metodo add-on) =====
  // Interes total = capital * tasa% * (plazo/12), repartido en partes iguales entre los meses.
  // El ultimo mes absorbe el residuo de redondeo para que el saldo cierre exactamente en $0.00.
  // (Mismo metodo usado a mano en la tabla de amortizacion de Alex Robles.)
  function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function computeAddOnAmortization(principal, ratePct, months) {
    const P = Math.max(0, parseFloat(principal) || 0);
    const n = Math.max(1, Math.round(parseFloat(months) || 1));
    const rate = Math.max(0, parseFloat(ratePct) || 0);
    const totalInterest = round2(P * (rate / 100) * (n / 12));
    const totalToPay = round2(P + totalInterest);
    const baseCapital = round2(P / n);
    const baseInterest = round2(totalInterest / n);
    const basePayment = round2(baseCapital + baseInterest);

    const schedule = [];
    let balance = P;
    let paidCapital = 0;
    let paidInterest = 0;
    let paidTotal = 0;

    for (let i = 1; i <= n; i++) {
      let capital, interes, pago;
      if (i < n) {
        capital = baseCapital;
        interes = baseInterest;
        pago = basePayment;
      } else {
        // Ultimo mes: ajusta por el redondeo acumulado de los meses anteriores
        capital = round2(P - paidCapital);
        interes = round2(totalInterest - paidInterest);
        pago = round2(capital + interes);
      }
      balance = i < n ? round2(balance - capital) : 0;
      paidCapital = round2(paidCapital + capital);
      paidInterest = round2(paidInterest + interes);
      paidTotal = round2(paidTotal + pago);
      schedule.push({ n: i, pago, capital, interes, balance, adjusted: i === n });
    }

    const lastAdjust = round2(schedule[schedule.length - 1].pago - basePayment);

    return {
      principal: P,
      ratePct: rate,
      months: n,
      basePayment,
      totalInterest: paidInterest,
      totalToPay: paidTotal,
      lastAdjust,
      schedule,
    };
  }

  function renderFinancePlanTable(plan) {
    if (!plan || plan.principal <= 0 || plan.schedule.length === 0) {
      finSummary.style.display = "none";
      finTableWrap.style.display = "none";
      finTableBody.innerHTML = "";
      return;
    }
    finPagoMensual.textContent = formatMoney(plan.basePayment);
    finTotalIntereses.textContent = formatMoney(plan.totalInterest);
    finTotalPagar.textContent = formatMoney(plan.totalToPay);
    finSummary.style.display = "block";

    finTableBody.innerHTML = plan.schedule
      .map(
        (row) => `
        <tr>
          <td>${row.n}${row.adjusted ? " <span style=\"color:#7c8aa6; font-size:11px;\">(ajuste redondeo)</span>" : ""}</td>
          <td class="num">${formatMoney(row.pago)}</td>
          <td class="num">${formatMoney(row.capital)}</td>
          <td class="num">${formatMoney(row.interes)}</td>
          <td class="num">${formatMoney(row.balance)}</td>
        </tr>`
      )
      .join("");
    finTableWrap.style.display = "block";
  }

  function recalcFinance() {
    const principal = parseFloat(finPrincipal.value) || 0;
    const ratePct = parseFloat(finTasa.value) || 0;
    const months = parseInt(finPlazo.value, 10) || 1;
    if (principal <= 0 || ratePct <= 0) {
      currentFinancePlan = null;
      renderFinancePlanTable(null);
      return;
    }
    currentFinancePlan = computeAddOnAmortization(principal, ratePct, months);
    renderFinancePlanTable(currentFinancePlan);
  }

  finPrincipal.addEventListener("input", () => {
    finPrincipalManual = true;
    recalcFinance();
  });
  finTasa.addEventListener("input", recalcFinance);
  finPlazo.addEventListener("input", recalcFinance);

  finUseSaldoBtn.addEventListener("click", () => {
    finPrincipalManual = false;
    updateTotals();
  });

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
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#7c8aa6;">Sin clientes todavia</td></tr>';
      return;
    }
    clients.forEach((c) => {
      const tr = document.createElement("tr");
      const quoteCount = quotes.filter((q) => q.clientId === c.id).length;
      tr.innerHTML = `
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.contacto || "")}</td>
        <td>${escapeHtml(c.negocio || "")}</td>
        <td>${escapeHtml(c.ciudad || "")}</td>
        <td></td>
        <td>${escapeHtml(c.notas || "")}</td>
        <td>${quoteCount}</td>
        <td class="actions-cell"></td>
      `;
      const statusTd = tr.children[4];
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

      const actionsTd = tr.children[7];
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn-small";
      editBtn.textContent = "Editar";
      editBtn.addEventListener("click", () => startEditClient(c.id));
      actionsTd.appendChild(editBtn);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn-small";
      delBtn.textContent = "Eliminar";
      delBtn.addEventListener("click", () => {
        if (!confirm(`Eliminar al cliente "${c.name}"?`)) return;
        clients = clients.filter((x) => x.id !== c.id);
        persistClients();
        if (editingClientId === c.id) cancelEditClient();
        renderClientsTable();
        renderClientSelect();
      });
      actionsTd.appendChild(delBtn);

      tbody.appendChild(tr);
    });
  }

  let editingClientId = null;
  const btnAddClient = document.getElementById("btnAddClient");
  const btnCancelEditClient = document.getElementById("btnCancelEditClient");

  function startEditClient(id) {
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    editingClientId = id;
    document.getElementById("cNombre").value = c.name || "";
    document.getElementById("cContacto").value = c.contacto || "";
    document.getElementById("cNegocio").value = c.negocio || "";
    document.getElementById("cCiudad").value = c.ciudad || "";
    document.getElementById("cEstatus").value = c.status || "Lead";
    document.getElementById("cNotas").value = c.notas || "";
    btnAddClient.textContent = "Guardar cambios";
    btnCancelEditClient.style.display = "inline-block";
    document.getElementById("cNombre").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function cancelEditClient() {
    editingClientId = null;
    document.getElementById("cNombre").value = "";
    document.getElementById("cContacto").value = "";
    document.getElementById("cNegocio").value = "";
    document.getElementById("cCiudad").value = "";
    document.getElementById("cEstatus").value = "Lead";
    document.getElementById("cNotas").value = "";
    btnAddClient.textContent = "+ Agregar cliente";
    btnCancelEditClient.style.display = "none";
  }

  btnCancelEditClient.addEventListener("click", cancelEditClient);

  btnAddClient.addEventListener("click", () => {
    const name = document.getElementById("cNombre").value.trim();
    if (!name) {
      alert("Escribe el nombre del cliente");
      return;
    }
    if (editingClientId) {
      const c = clients.find((x) => x.id === editingClientId);
      if (c) {
        c.name = name;
        c.contacto = document.getElementById("cContacto").value.trim();
        c.negocio = document.getElementById("cNegocio").value.trim();
        c.ciudad = document.getElementById("cCiudad").value.trim();
        c.status = document.getElementById("cEstatus").value;
        c.notas = document.getElementById("cNotas").value.trim();
      }
    } else {
      clients.push({
        id: "c" + Date.now(),
        name,
        contacto: document.getElementById("cContacto").value.trim(),
        negocio: document.getElementById("cNegocio").value.trim(),
        ciudad: document.getElementById("cCiudad").value.trim(),
        status: document.getElementById("cEstatus").value,
        notas: document.getElementById("cNotas").value.trim(),
      });
    }
    persistClients();
    cancelEditClient();
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
          renderFinanceTable();
          renderClientsTable();
        });

        actionsTd.appendChild(loadBtn);
        actionsTd.appendChild(dupBtn);
        actionsTd.appendChild(delBtn);

        tbody.appendChild(tr);
      });
  }

  // ===== Financiamiento: lista de planes activos (uno por cotizacion) =====
  function renderFinanceTable() {
    const tbody = document.getElementById("financeTable");
    tbody.innerHTML = "";
    const financed = quotes.filter(
      (q) => q.finance && (parseFloat(q.finance.principal) || 0) > 0 && (parseFloat(q.finance.ratePct) || 0) > 0
    );
    if (financed.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#7c8aa6;">Sin planes de financiamiento todavia. Captura capital, tasa add-on y plazo en una cotizacion y guardala.</td></tr>';
      return;
    }
    financed
      .slice()
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .forEach((q) => {
        const plan = computeAddOnAmortization(q.finance.principal, q.finance.ratePct, q.finance.months);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(q.cliente || "")}</td>
          <td>${escapeHtml(q.number || "")}</td>
          <td>${formatMoney(plan.principal)}</td>
          <td>${plan.ratePct}% / ${plan.months} m</td>
          <td>${formatMoney(plan.basePayment)}</td>
          <td>${formatMoney(plan.totalToPay)}</td>
          <td class="actions-cell"></td>
        `;
        const actionsTd = tr.children[6];

        const loadBtn = document.createElement("button");
        loadBtn.type = "button";
        loadBtn.className = "btn-small";
        loadBtn.textContent = "Cargar cotizacion";
        loadBtn.addEventListener("click", () => loadQuote(q.id));

        const exhibitBtn = document.createElement("button");
        exhibitBtn.type = "button";
        exhibitBtn.className = "btn-small";
        exhibitBtn.textContent = "Ver Exhibit C";
        exhibitBtn.addEventListener("click", () => {
          loadQuote(q.id);
          if (buildFinanceExhibit() !== false) {
            previewWrap.scrollIntoView({ behavior: "smooth" });
          }
        });

        actionsTd.appendChild(loadBtn);
        actionsTd.appendChild(exhibitBtn);
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
    renderCatalog();
    renderDatalist();
    renderLineItems();

    if (q.finance) {
      finPrincipalManual = true;
      finPrincipal.value = q.finance.principal || 0;
      finTasa.value = q.finance.ratePct || 0;
      finPlazo.value = q.finance.months || 12;
      finIncluirPdf.checked = !!q.finance.incluirPdf;
      recalcFinance();
    } else {
      finPrincipalManual = false;
      finTasa.value = 0;
      finPlazo.value = 12;
      finIncluirPdf.checked = false;
      updateTotals();
    }

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
      finance: {
        principal: parseFloat(finPrincipal.value) || 0,
        ratePct: parseFloat(finTasa.value) || 0,
        months: parseInt(finPlazo.value, 10) || 12,
        incluirPdf: finIncluirPdf.checked,
      },
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
    renderFinanceTable();
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
      paymentScheduleText: "El deposito inicial es requerido para iniciar la construccion. El saldo restante se pagara en abonos acordados durante el periodo de construccion. El pago completo debe realizarse antes de la entrega.",
      constructionTitle: "Construccion y entrega",
      constructionText: (dest) => `La entrega estimada es en ${dest} una vez completada la construccion y liquidado el pago.`,
      destinationFallback: "el destino acordado",
      signaturesTitle: "Aceptacion y firmas",
      signaturesText: "Al firmar a continuacion, ambas partes aceptan los terminos descritos en esta cotizacion.",
      sellerSig: "Marcelo Ramos Schiaffino — Nova Food Trailer",
      clientSig: "Cliente",
      clientSigFallback: "Cliente",
      financingTitle: "Financiamiento interno — Tabla de amortizacion",
      financingDocTitle: "TABLA DE AMORTIZACION",
      finExhibitLabel: "Exhibit C — Financiamiento a",
      finDebtor: "DEUDOR",
      finPrincipalLabel: "CAPITAL FINANCIADO",
      finRateTerm: "TASA ADD-ON / PLAZO",
      finInterestLabel: "INTERES TOTAL",
      finTotalLabel: "TOTAL A PAGAR",
      finTableMonth: "MES",
      finTablePayment: "PAGO",
      finTableCapital: "CAPITAL",
      finTableInterest: "INTERES",
      finTableBalance: "SALDO RESTANTE",
      finMonthsShort: "meses",
      finAdjustLabel: "ajuste redondeo",
      finAdjustTitle: "Ajuste por redondeo",
      finAdjustText: (month, amt) => `El pago del mes ${month} se ajusta en ${amt} para saldar el capital exactamente en cero, por el redondeo acumulado de los pagos mensuales.`,
      finConfidential: "Documento privado y confidencial",
      finPageLabel: (name) => `Pagina 1 de 1 — Tabla de Amortizacion (${name || "Cliente"})`,
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
      paymentScheduleText: "The initial deposit is required to start construction. The remaining balance will be paid in installments agreed during the construction period. Full payment must be made before delivery.",
      constructionTitle: "Construction and delivery",
      constructionText: (dest) => `Estimated delivery is in ${dest} once construction is complete and payment is settled.`,
      destinationFallback: "the agreed destination",
      signaturesTitle: "Acceptance and signatures",
      signaturesText: "By signing below, both parties accept the terms described in this quote.",
      sellerSig: "Marcelo Ramos Schiaffino — Nova Food Trailer",
      clientSig: "Customer",
      clientSigFallback: "Customer",
      financingTitle: "In-house financing — Amortization schedule",
      financingDocTitle: "AMORTIZATION SCHEDULE",
      finExhibitLabel: "Exhibit C — Financing for",
      finDebtor: "BORROWER",
      finPrincipalLabel: "FINANCED PRINCIPAL",
      finRateTerm: "ADD-ON RATE / TERM",
      finInterestLabel: "TOTAL INTEREST",
      finTotalLabel: "TOTAL TO PAY",
      finTableMonth: "MONTH",
      finTablePayment: "PAYMENT",
      finTableCapital: "PRINCIPAL",
      finTableInterest: "INTEREST",
      finTableBalance: "REMAINING BALANCE",
      finMonthsShort: "months",
      finAdjustLabel: "rounding adjustment",
      finAdjustTitle: "Rounding adjustment",
      finAdjustText: (month, amt) => `The month ${month} payment is adjusted by ${amt} to settle the principal at exactly zero, due to accumulated rounding in the monthly payments.`,
      finConfidential: "Private and confidential document",
      finPageLabel: (name) => `Page 1 of 1 — Amortization Schedule (${name || "Customer"})`,
    },
  };

  // ===== Bloque de financiamiento interno (Exhibit C) para el documento =====
  function financeExhibitBody(t, plan, clienteName, opts) {
    if (!plan) return "";
    opts = opts || {};
    const rateTermText = `${plan.ratePct}% / ${plan.months} ${t.finMonthsShort}`;

    const rows = plan.schedule
      .map(
        (row) => `
        <tr>
          <td>${row.n}${row.adjusted ? ` <span style="color:#7c8aa6; font-size:10.5px;">(${t.finAdjustLabel})</span>` : ""}</td>
          <td class="num">${formatMoney(row.pago)}</td>
          <td class="num">${formatMoney(row.capital)}</td>
          <td class="num">${formatMoney(row.interes)}</td>
          <td class="num">${formatMoney(row.balance)}</td>
        </tr>`
      )
      .join("");

    const adjustNote =
      Math.abs(plan.lastAdjust) >= 0.01
        ? `<div class="doc-note"><b>${t.finAdjustTitle}</b>${t.finAdjustText(plan.months, formatMoney(Math.abs(plan.lastAdjust)))}</div>`
        : "";

    return `
      ${opts.hideTitle ? "" : `<div class="doc-section">${t.financingTitle}</div>`}
      <table class="doc-client">
        <tr><td class="label">${t.finDebtor}</td><td>${escapeHtml(clienteName || "-")}</td></tr>
        <tr><td class="label">${t.finPrincipalLabel}</td><td>${formatMoney(plan.principal)}</td></tr>
        <tr><td class="label">${t.finRateTerm}</td><td>${rateTermText}</td></tr>
        <tr><td class="label">${t.finInterestLabel}</td><td>${formatMoney(plan.totalInterest)}</td></tr>
        <tr><td class="label">${t.finTotalLabel}</td><td>${formatMoney(plan.totalToPay)}</td></tr>
      </table>
      <table class="doc-product" style="margin-top:10px;">
        <tr><th>${t.finTableMonth}</th><th class="num">${t.finTablePayment}</th><th class="num">${t.finTableCapital}</th><th class="num">${t.finTableInterest}</th><th class="num">${t.finTableBalance}</th></tr>
        ${rows}
        <tr style="font-weight:800; background:var(--light);">
          <td>${t.total}</td>
          <td class="num">${formatMoney(plan.totalToPay)}</td>
          <td class="num">${formatMoney(plan.principal)}</td>
          <td class="num">${formatMoney(plan.totalInterest)}</td>
          <td class="num"></td>
        </tr>
      </table>
      ${adjustNote}
    `;
  }

  function buildFinanceExhibit() {
    if (!currentFinancePlan) {
      alert("Captura capital, tasa add-on y plazo (mayores a cero) para calcular el plan de financiamiento antes de generar el Exhibit C.");
      return false;
    }
    const t = I18N[fIdioma.value] || I18N.es;
    previewDoc.innerHTML = `
      <div class="doc-header">
        <img src="assets/nova_logo.png" alt="Nova Food Trailer">
        <h1>NOVA</h1>
      </div>
      <div class="doc-tagline">F O O D &nbsp;&nbsp;&nbsp; T R A I L E R</div>
      <div style="text-align:center; font-size:11px; letter-spacing:1.5px; color:#5b6b8c; margin:-4px 0 10px;">
        MARCELO RAMOS SCHIAFFINO — DBA NOVA FOOD TRAILER<br>Dallas County, Texas
      </div>
      <div class="doc-title">${t.financingDocTitle}</div>
      <div style="text-align:center; font-size:12px; color:var(--blue); font-weight:700; margin-bottom:18px;">
        ${t.finExhibitLabel} ${escapeHtml(fCliente.value || "-")}
      </div>
      ${financeExhibitBody(t, currentFinancePlan, fCliente.value, { hideTitle: true })}
      <div class="doc-footer">
        <b>Nova Food Trailer</b> &middot; ${t.finConfidential} &middot; ${t.finPageLabel(fCliente.value)}
      </div>
    `;
    previewWrap.classList.add("show");
    return true;
  }

  finExhibitBtn.addEventListener("click", () => {
    if (buildFinanceExhibit() !== false) {
      previewWrap.scrollIntoView({ behavior: "smooth" });
    }
  });

  // ===== Generar documento de cotizacion =====
  function buildPreview() {
    const { subtotal, deposito, saldo } = updateTotals();
    const t = I18N[fIdioma.value] || I18N.es;

    const fechaVal = fFecha.value
      ? new Date(fFecha.value + "T00:00:00").toLocaleDateString(t.locale, { year: "numeric", month: "long", day: "numeric" })
      : "";

    const filtered = lineItems.filter((l) => l.desc.trim() !== "");
    const rows = [];
    let i = 0;
    while (i < filtered.length) {
      const l = filtered[i];
      const descLower = l.desc.toLowerCase();
      if (descLower.includes("unidad base") || descLower.includes("base unit")) {
        const included = [];
        let j = i + 1;
        while (j < filtered.length && (parseFloat(filtered[j].price) || 0) === 0) {
          included.push(filtered[j].desc);
          j++;
        }
        const subList = included.length
          ? `<div class="inc-list">${included.map((d) => escapeHtml(d)).join(" &middot; ")}</div>`
          : "";
        rows.push(`
        <tr>
          <td>1</td>
          <td>${escapeHtml(l.desc)}${subList}</td>
          <td class="num">${formatMoney(l.price)}</td>
          <td class="num">${formatMoney(l.price)}</td>
        </tr>`);
        i = j;
      } else {
        rows.push(`
        <tr>
          <td>1</td>
          <td>${escapeHtml(l.desc)}</td>
          <td class="num">${formatMoney(l.price)}</td>
          <td class="num">${formatMoney(l.price)}</td>
        </tr>`);
        i++;
      }
    }
    const rowsHtml = rows.join("");

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
        ${rowsHtml || `<tr><td colspan="4" style="text-align:center; color:#7c8aa6;">${t.noComponents}</td></tr>`}
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

      ${finIncluirPdf.checked && currentFinancePlan ? financeExhibitBody(t, currentFinancePlan, fCliente.value) : ""}

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
    renderCatalog();
    renderDatalist();
    previewWrap.classList.remove("show");
    finPrincipalManual = false;
    finTasa.value = 0;
    finPlazo.value = 12;
    finIncluirPdf.checked = false;
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

  renderCatalog();
  renderDatalist();
  renderLineItems();
  renderClientSelect();
  renderClientsTable();
  renderQuotesTable();
  renderFinanceTable();
})();
