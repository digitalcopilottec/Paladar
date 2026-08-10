const categories = [
  {
    id: "r7",
    name: "Ride7",
    eta: "3 min",
    seats: "Ate 4 pessoas",
    fare: "R$ 38,90",
  },
  {
    id: "plus",
    name: "Ride7 Plus",
    eta: "5 min",
    seats: "Carros mais confortaveis",
    fare: "R$ 52,40",
  },
  {
    id: "moto",
    name: "MotoTaxi",
    eta: "2 min",
    seats: "1 passageiro",
    fare: "R$ 19,80",
  },
  {
    id: "delivery",
    name: "Tele Entrega",
    eta: "8 min",
    seats: "Marmitas, lanches e produtos",
    fare: "R$ 12,90",
  },
];

const paymentMethods = [
  { id: "pix", label: "PIX" },
  { id: "credit", label: "Credito" },
  { id: "debit", label: "Debito" },
  { id: "cash", label: "Dinheiro" },
];

const registeredDrivers = [
  {
    name: "Rafael Martins",
    rating: "4,97",
    eta: "3 min",
    vehicle: "Toyota Corolla",
    color: "Preto",
    plate: "R7D4A21",
    trips: "1.284",
  },
  {
    name: "Camila Duarte",
    rating: "4,94",
    eta: "4 min",
    vehicle: "Chevrolet Onix",
    color: "Prata",
    plate: "R7P8K09",
    trips: "982",
  },
  {
    name: "Joao Weber",
    rating: "4,91",
    eta: "5 min",
    vehicle: "Hyundai HB20",
    color: "Branco",
    plate: "R7S2M44",
    trips: "756",
  },
];

const modules = [
  {
    icon: "OTP",
    title: "Cadastro seguro",
    text: "Nome, CPF, e-mail, celular, senha, recuperacao de acesso e validacao por SMS.",
  },
  {
    icon: "GPS",
    title: "Corridas e MotoTaxi",
    text: "Origem automatica, destino editavel, carros e motos proximas, valor, ETA e tempo de viagem.",
  },
  {
    icon: "BOX",
    title: "Tele entrega",
    text: "Fluxo para marmitas, lanches e pequenos produtos com retirada, entrega e rastreio no mapa.",
  },
  {
    icon: "PIX",
    title: "Pagamentos flexiveis",
    text: "PIX, credito, debito, dinheiro e estrutura pronta para carteira digital.",
  },
  {
    icon: "SOS",
    title: "Seguranca ativa",
    text: "Rota compartilhada, botao de emergencia, historico completo e localizacao registrada.",
  },
  {
    icon: "DRV",
    title: "Motorista e entregador",
    text: "Documentos, CNH, selfie, carro, moto, conta bancaria ou chave PIX e ganhos detalhados.",
  },
  {
    icon: "ADM",
    title: "Painel completo",
    text: "Gestao de usuarios, corridas, tarifas, documentos, cupons, financeiro, suporte e relatorios.",
  },
];

let categoryList = document.querySelector("#categoryList");
const mapStatus = document.querySelector("#mapStatus");
const moduleGrid = document.querySelector("#moduleGrid");
let paymentMethodsList = document.querySelector("#paymentMethods");
let requestRideButton = document.querySelector("#requestRideButton");
const requestSheet = document.querySelector("#requestSheet");
let resetRideButton = document.querySelector("#resetRideButton");
let selectedFare = document.querySelector("#selectedFare");
let selectedPayment = document.querySelector("#selectedPayment");

let selectedCategoryId = "r7";
let selectedPaymentId = "pix";
let searchTimer;

function renderCategories(selectedId = "r7") {
  selectedCategoryId = selectedId;
  categoryList.innerHTML = categories
    .map((category) => {
      const isActive = category.id === selectedId ? "active" : "";

      return `
        <button class="category-button ${isActive}" type="button" data-category="${category.id}">
          <span class="category-icon">
            <img src="./assets/ride7-logo-app.png" alt="" />
          </span>
          <span>
            <strong>${category.name}</strong>
            <span>${category.eta} - ${category.seats}</span>
          </span>
          <span class="fare">${category.fare}</span>
        </button>
      `;
    })
    .join("");
}

function renderPaymentMethods(selectedId = "pix") {
  selectedPaymentId = selectedId;
  selectedPayment.textContent = paymentMethods.find((item) => item.id === selectedId).label;
  paymentMethodsList.innerHTML = paymentMethods
    .map((method) => {
      const isActive = method.id === selectedId ? "active" : "";

      return `
        <button class="payment-chip ${isActive}" type="button" data-payment="${method.id}">
          ${method.label}
        </button>
      `;
    })
    .join("");
}

function setMapStatus(type, title, text) {
  mapStatus.className = `map-status ${type}`;
  mapStatus.innerHTML = `
    <span class="pulse-dot"></span>
    <strong>${title}</strong>
    <small>${text}</small>
  `;
}

function renderSearchingState() {
  clearTimeout(searchTimer);
  requestSheet.classList.add("is-searching");
  requestRideButton.disabled = true;
  resetRideButton.hidden = true;
  setMapStatus("searching", "Procurando veiculo", "Enviando chamada para motoristas cadastrados");

  const category = categories.find((item) => item.id === selectedCategoryId);
  const payment = paymentMethods.find((item) => item.id === selectedPaymentId);

  requestSheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="searching-panel">
      <div class="radar">
        <span></span>
        <img src="./assets/ride7-logo-app.png" alt="" />
      </div>
      <p class="eyebrow">Busca ativa</p>
      <h3>Procurando veiculo cadastrado</h3>
      <p>Categoria ${category.name} com pagamento por ${payment.label}. Estamos validando motoristas proximos e disponiveis.</p>
      <div class="search-steps">
        <span class="done">Localizacao confirmada</span>
        <span class="done">Pagamento selecionado</span>
        <span>Chamando motoristas</span>
      </div>
    </div>
  `;

  searchTimer = window.setTimeout(renderDriverFoundState, 2600);
}

function renderDriverFoundState() {
  const driver = registeredDrivers[0];
  setMapStatus("found", "Motorista encontrado", `${driver.name} chega em ${driver.eta}`);

  requestSheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="driver-found">
      <div class="driver-profile">
        <span class="driver-avatar">RM</span>
        <div>
          <p class="eyebrow">Veiculo cadastrado</p>
          <h3>${driver.name}</h3>
          <span>${driver.rating} estrelas - ${driver.trips} viagens</span>
        </div>
      </div>

        <div class="vehicle-card">
          <div class="vehicle-illustration">
          <img src="./assets/ride7-car-side.svg" alt="" />
        </div>
        <div>
          <strong>${driver.vehicle}</strong>
          <span>${driver.color} - Placa ${driver.plate}</span>
        </div>
        <strong>${driver.eta}</strong>
      </div>

      <div class="trip-actions">
        <button class="outline-button" type="button" data-reset-ride>Cancelar</button>
        <button class="confirm-button" type="button">Compartilhar viagem</button>
      </div>
    </div>
  `;
}

function resetRideFlow() {
  clearTimeout(searchTimer);
  requestSheet.classList.remove("is-searching");
  setMapStatus("ready", "Motoristas proximos", "3 veiculos cadastrados online");
  requestSheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="input-stack">
      <label>
        <span class="dot current"></span>
        <input value="Av. Paulista, 900" aria-label="Origem" />
      </label>
      <label>
        <span class="dot target"></span>
        <input value="Aeroporto Congonhas" aria-label="Destino" />
      </label>
    </div>

    <div class="category-list" id="categoryList"></div>

    <div class="payment-panel">
      <div class="payment-row">
        <span>Metodo de pagamento</span>
        <strong id="selectedPayment">PIX</strong>
      </div>
      <div class="payment-methods" id="paymentMethods"></div>
    </div>

    <div class="payment-row fare-row">
      <span>Total estimado</span>
      <strong id="selectedFare">R$ 38,90</strong>
    </div>

    <button class="confirm-button" id="requestRideButton" type="button">Confirmar Ride7</button>
    <button class="outline-button reset-button" id="resetRideButton" type="button" hidden>Nova busca</button>
  `;
  bindRideControls();
}

function bindRideControls() {
  categoryList = document.querySelector("#categoryList");
  paymentMethodsList = document.querySelector("#paymentMethods");
  requestRideButton = document.querySelector("#requestRideButton");
  resetRideButton = document.querySelector("#resetRideButton");
  selectedFare = document.querySelector("#selectedFare");
  selectedPayment = document.querySelector("#selectedPayment");

  renderCategories(selectedCategoryId);
  renderPaymentMethods(selectedPaymentId);

  categoryList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");

    if (!button) {
      return;
    }

    const category = categories.find((item) => item.id === button.dataset.category);
    selectedFare.textContent = category.fare;
    renderCategories(category.id);
  });

  paymentMethodsList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-payment]");

    if (!button) {
      return;
    }

    renderPaymentMethods(button.dataset.payment);
  });

  requestRideButton.addEventListener("click", renderSearchingState);
}

renderCategories();
renderPaymentMethods();

moduleGrid.innerHTML = modules
  .map(
    (module) => `
      <article class="module-card">
        <span class="module-icon">${module.icon}</span>
        <h3>${module.title}</h3>
        <p>${module.text}</p>
      </article>
    `,
  )
  .join("");

categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");

  if (!button) {
    return;
  }

  const category = categories.find((item) => item.id === button.dataset.category);
  selectedFare.textContent = category.fare;
  renderCategories(category.id);
});

paymentMethodsList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-payment]");

  if (!button) {
    return;
  }

  renderPaymentMethods(button.dataset.payment);
});

requestRideButton.addEventListener("click", renderSearchingState);

requestSheet.addEventListener("click", (event) => {
  if (event.target.closest("[data-reset-ride]")) {
    resetRideFlow();
  }
});
