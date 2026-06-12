(function () {
  const picker = document.getElementById("sizePicker");
  const blueprintPanel = document.getElementById("blueprintPanel");
  const sizeLabel = document.getElementById("sizeLabel");
  const sizePrice = document.getElementById("sizePrice");
  const equipList = document.getElementById("equipList");
  const specsList = document.getElementById("specsList");

  TRAILER_SIZES.forEach((size) => {
    const btn = document.createElement("button");
    btn.textContent = size.label;
    btn.dataset.id = size.id;
    btn.addEventListener("click", () => selectSize(size.id));
    picker.appendChild(btn);
  });

  function selectSize(id) {
    const size = TRAILER_SIZES.find((s) => s.id === id);
    if (!size) return;

    [...picker.children].forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.id === id);
    });

    blueprintPanel.innerHTML = renderBlueprintSVG(size);

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

  selectSize(TRAILER_SIZES[0].id);
})();
