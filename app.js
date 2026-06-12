(function () {
  const picker = document.getElementById("sizePicker");
  const viewTabs = document.getElementById("viewTabs");
  const blueprintPanel = document.getElementById("blueprintPanel");
  const sizeLabel = document.getElementById("sizeLabel");
  const sizePrice = document.getElementById("sizePrice");
  const equipList = document.getElementById("equipList");
  const specsList = document.getElementById("specsList");

  const VIEWS = [
    { id: "kitchen", label: "Pared de cocina" },
    { id: "top", label: "Vista superior" },
    { id: "service", label: "Pared de servicio" },
  ];

  let currentViews = null;
  let currentViewId = VIEWS[0].id;

  TRAILER_SIZES.forEach((size) => {
    const btn = document.createElement("button");
    btn.textContent = size.label;
    btn.dataset.id = size.id;
    btn.addEventListener("click", () => selectSize(size.id));
    picker.appendChild(btn);
  });

  VIEWS.forEach((view) => {
    const btn = document.createElement("button");
    btn.textContent = view.label;
    btn.dataset.view = view.id;
    btn.addEventListener("click", () => selectView(view.id));
    viewTabs.appendChild(btn);
  });

  function selectSize(id) {
    const size = TRAILER_SIZES.find((s) => s.id === id);
    if (!size) return;

    [...picker.children].forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.id === id);
    });

    currentViews = renderBlueprintViews(size);
    renderCurrentView();

    sizeLabel.textContent = `Nova Food Trailer ${size.label}`;
    sizePrice.textContent = `$${size.price.toLocaleString("en-US")}`;

    equipList.innerHTML = "";
    size.equipment.back.forEach((item, idx) => {
      const li = document.createElement("li");
      const num = document.createElement("span");
      num.className = "num";
      num.textContent = idx + 1;
      const text = document.createElement("span");
      text.textContent = item.name;
      li.appendChild(num);
      li.appendChild(text);
      equipList.appendChild(li);
    });

    specsList.innerHTML = "";
    size.specs.forEach((spec) => {
      const li = document.createElement("li");
      li.textContent = spec;
      specsList.appendChild(li);
    });
  }

  function selectView(viewId) {
    currentViewId = viewId;
    [...viewTabs.children].forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewId);
    });
    renderCurrentView();
  }

  function renderCurrentView() {
    if (!currentViews) return;
    blueprintPanel.innerHTML = currentViews[currentViewId];
  }

  selectView(currentViewId);
  selectSize(TRAILER_SIZES[0].id);
})();
