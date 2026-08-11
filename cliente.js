const serviceModes = [
  {
    id: "ride",
    label: "Carona",
    status: "3 veiculos cadastrados perto de voce",
    section: "Escolha o veiculo",
    originLabel: "Origem",
    destinationLabel: "Destino",
    confirmPickupTitle: "Confirme o ponto de partida",
    confirmPickupText: "Arraste o mapa para mover o marcador. O motorista sera chamado para este local.",
    requestLabel: "Confirmar viagem",
    searchingTitle: "Procurando motorista",
    searchingStatus: "Procurando veiculo cadastrado",
    searchingText: "Estamos buscando motoristas online e aprovados perto de voce.",
    foundTitle: "Corrida confirmada",
    foundText: "O motorista aceitou sua chamada. Confira os dados antes do embarque.",
    foundStatus: "Motorista aceitou",
    confirmBoarding: "Confirmar embarque",
    startedTitle: "Viagem iniciada",
    startedStatus: "Viagem em andamento",
    startedText: "Sua localizacao continua acompanhada em tempo real.",
    resetLabel: "Nova corrida",
  },
  {
    id: "mototaxi",
    label: "MotoTaxi",
    status: "Mototaxistas cadastrados perto de voce",
    section: "Escolha a moto",
    originLabel: "Origem",
    destinationLabel: "Destino",
    confirmPickupTitle: "Confirme o ponto de embarque",
    confirmPickupText: "O mototaxista sera chamado para este local com capacete extra e dados verificados.",
    requestLabel: "Confirmar mototaxi",
    searchingTitle: "Procurando mototaxista",
    searchingStatus: "Procurando moto cadastrada",
    searchingText: "Estamos buscando mototaxistas aprovados e disponiveis perto de voce.",
    foundTitle: "MotoTaxi confirmado",
    foundText: "O mototaxista aceitou sua chamada. Confira placa, modelo e avaliacao antes do embarque.",
    foundStatus: "Mototaxista aceitou",
    confirmBoarding: "Confirmar embarque",
    startedTitle: "Corrida de moto iniciada",
    startedStatus: "MotoTaxi em andamento",
    startedText: "Use capacete, confirme a placa e acompanhe a rota em tempo real.",
    resetLabel: "Nova corrida",
  },
  {
    id: "delivery",
    label: "Tele Entrega",
    tabLabel: "Entrega",
    status: "Entregadores cadastrados perto de voce",
    section: "Escolha o tipo de entrega",
    originLabel: "Retirada",
    destinationLabel: "Entrega",
    confirmPickupTitle: "Confirme o ponto de retirada",
    confirmPickupText: "O entregador sera chamado para retirar o produto e levar ate o endereco informado.",
    requestLabel: "Solicitar entrega",
    searchingTitle: "Procurando entregador",
    searchingStatus: "Procurando entregador cadastrado",
    searchingText: "Estamos chamando entregadores online para marmitas, lanches e produtos.",
    foundTitle: "Entrega confirmada",
    foundText: "O entregador aceitou sua chamada. Acompanhe retirada e deslocamento ate o destino.",
    foundStatus: "Entregador aceitou",
    confirmBoarding: "Confirmar retirada",
    startedTitle: "Entrega em andamento",
    startedStatus: "Entrega em andamento",
    startedText: "O produto esta a caminho com rota acompanhada em tempo real.",
    resetLabel: "Nova entrega",
  },
];

const serviceCatalog = {
  ride: [
    { id: "ride7", name: "Ride7", badge: "Mais rapido", meta: "3 min - Ate 4 pessoas", fare: "R$ 38,90" },
    { id: "plus", name: "Ride7 Plus", badge: "Conforto", meta: "5 min - Carro premium", fare: "R$ 52,40" },
  ],
  mototaxi: [
    { id: "moto-taxi", name: "Ride7 MotoTaxi", badge: "Agil", meta: "2 min - 1 passageiro", fare: "R$ 19,80" },
    { id: "moto-plus", name: "MotoTaxi Plus", badge: "Selecionado", meta: "4 min - Moto premium", fare: "R$ 24,90" },
  ],
  delivery: [
    { id: "marmita", name: "Marmitas", badge: "Horario de almoco", meta: "8 min - Bolsa termica", fare: "R$ 12,90" },
    { id: "lanches", name: "Lanches", badge: "Rapido", meta: "7 min - Motoboy proximo", fare: "R$ 10,90" },
    { id: "produtos", name: "Produtos", badge: "Ponto a ponto", meta: "10 min - Pequenos volumes", fare: "R$ 14,90" },
  ],
};

const payments = ["PIX", "Credito", "Debito", "Dinheiro"];

const clientBenefits = {
  name: "Marina",
  cashbackAvailable: "R$ 48,70",
  cashbackPending: "R$ 16,20 pendente",
  points: "3.420",
  level: "Gold",
  nextReward: "5.000 pontos -> R$ 25 de cashback",
};

const sponsorAds = [
  {
    title: "Digital Copilot Tecnologia",
    text: "Automacao e sistemas para empresas parceiras Ride7.",
    image: "./assets/sponsor-digital-copilot.png",
    cta: "Conhecer",
  },
  {
    title: "Paladar Restaurante",
    text: "Peca marmitas e ganhe cashback patrocinado nas entregas.",
    image: "./assets/sponsor-paladar.jpeg",
    cta: "Ver oferta",
  },
];

const registeredVehicle = {
  driver: "Rafael Martins",
  motoDriver: "Diego Ferreira",
  courier: "Aline Cardoso",
  rating: "4,97",
  eta: "3 min",
  vehicle: "Toyota Corolla",
  moto: "Honda CG 160",
  deliveryMoto: "Yamaha Fazer 250",
  color: "Preto",
  plate: "R7D4A21",
  motoPlate: "R7M9T02",
  pickup: "Av. Ipiranga, Porto Alegre",
  destination: "Aeroporto Salgado Filho",
};

const clientApp = document.querySelector(".client-app");
const clientSheet = document.querySelector("#clientSheet");
const clientStatus = document.querySelector("#clientStatus");
const RIDE_CHANNEL_KEY = "ride7_demo_ride";

let selectedService = "ride";
let selectedOption = "ride7";
let selectedPayment = "PIX";
let negotiateEnabled = false;
let negotiatedAmount = 38.9;
let searchTimer;
let activeRideId;

function publishRideState(payload) {
  localStorage.setItem(RIDE_CHANNEL_KEY, JSON.stringify({ ...payload, updatedAt: Date.now() }));
}

function getRideState() {
  try {
    return JSON.parse(localStorage.getItem(RIDE_CHANNEL_KEY) || "null");
  } catch {
    return null;
  }
}

window.addEventListener("ride7:location-updated", (event) => {
  if (event.detail.role === "client") {
    registeredVehicle.pickup = "Localizacao atual do aparelho";
    const originInput = clientSheet.querySelector(".address-stack input");
    if (originInput) {
      originInput.value = registeredVehicle.pickup;
    }
    if (!clientApp.classList.contains("confirming-pickup") && !clientApp.classList.contains("searching-ride") && !clientApp.classList.contains("ride-found")) {
      setStatus("", "Localizacao atual conectada ao Google Maps");
    }
  }
});

window.addEventListener("ride7:map-fallback", (event) => {
  if (event.detail.role === "client") {
    const reason = event.detail.reason === "missing-api-key" ? "Google Maps em modo demo" : "Usando mapa demonstrativo";
    setStatus("", reason);
  }
});

function currentMode() {
  return serviceModes.find((mode) => mode.id === selectedService);
}

function currentOptions() {
  return serviceCatalog[selectedService];
}

function currentRide() {
  return currentOptions().find((option) => option.id === selectedOption);
}

function fareToNumber(fare) {
  return Number(fare.replace("R$", "").replace(".", "").replace(",", ".").trim());
}

function formatFare(value) {
  return `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
}

function negotiationRange() {
  const base = fareToNumber(currentRide().fare);
  const min = Math.max(6, Math.round(base * 0.82));
  const max = Math.round(base * 1.22);
  const suggested = Math.round(base);

  return { base, min, max, suggested };
}

function syncNegotiatedAmount() {
  const { min, max, suggested } = negotiationRange();

  if (!negotiatedAmount || negotiatedAmount < min || negotiatedAmount > max) {
    negotiatedAmount = suggested;
  }
}

function currentServiceImage() {
  const images = {
    ride: "./assets/ride7-solicite-premium.jpg",
    mototaxi: "./assets/ride7-mototaxi-premium.jpg",
    delivery: "./assets/ride7-delivery-real.jpg",
  };

  return images[selectedService];
}

function setStatus(state, text) {
  clientStatus.className = `client-status ${state}`;
  clientStatus.innerHTML = `<span></span><strong>${text}</strong>`;
}

function renderServiceTabs() {
  return serviceModes
    .map((mode) => `<button class="service-tab ${mode.id === selectedService ? "active" : ""}" type="button" data-service="${mode.id}">${mode.tabLabel || mode.label}</button>`)
    .join("");
}

function renderRideOptions() {
  return currentOptions()
    .map((option) => {
      const active = option.id === selectedOption ? "active" : "";
      const deliveryIcon = selectedService === "delivery" ? `<span>${option.id === "marmita" ? "MT" : option.id === "lanches" ? "LN" : "PR"}</span>` : `<img src="./assets/ride7-logo-app.png" alt="" />`;

      return `
        <button class="option-button ${active}" type="button" data-ride="${option.id}">
          <span class="option-logo ${selectedService === "delivery" ? "delivery-logo" : ""}">${deliveryIcon}</span>
          <span>
            <strong>${option.name}</strong>
            <span>${option.meta}</span>
            <em>${option.badge}</em>
          </span>
          <strong class="fare">${option.fare}</strong>
        </button>
      `;
    })
    .join("");
}

function renderPayments() {
  return payments
    .map((payment) => `<button class="payment-button ${payment === selectedPayment ? "active" : ""}" type="button" data-payment="${payment}">${payment}</button>`)
    .join("");
}

function renderClientHomeSummary() {
  return `
    <section class="client-home-summary" aria-label="Resumo de beneficios">
      <div class="hello-row">
        <span>Ola, ${clientBenefits.name}</span>
        <strong>Para onde vamos hoje?</strong>
      </div>
      <div class="wallet-grid">
        <article class="wallet-card cashback">
          <span>Seu Cashback</span>
          <strong>${clientBenefits.cashbackAvailable}</strong>
          <small>${clientBenefits.cashbackPending}</small>
        </article>
        <article class="wallet-card">
          <span>Seus Pontos</span>
          <strong>${clientBenefits.points}</strong>
          <small>Nivel ${clientBenefits.level}</small>
        </article>
      </div>
      <article class="reward-card">
        <span>Proxima recompensa</span>
        <strong>${clientBenefits.nextReward}</strong>
        <div class="client-progress"><span style="width: 68%"></span></div>
      </article>
      ${renderSponsorCarousel("Ofertas para voce")}
    </section>
  `;
}

function renderSponsorCarousel(title = "Patrocinado") {
  return `
    <section class="sponsor-carousel" aria-label="${title}">
      <div class="sponsor-carousel-head">
        <span>Patrocinado</span>
        <strong>${title}</strong>
      </div>
      <div class="sponsor-track">
        ${sponsorAds
          .map(
            (ad) => `
              <article class="sponsor-slide">
                <img src="${ad.image}" alt="${ad.title}" />
                <div>
                  <span>Publicidade</span>
                  <strong>${ad.title}</strong>
                  <p>${ad.text}</p>
                  <button type="button">${ad.cta}</button>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderNegotiationPanel() {
  if (selectedService === "delivery") {
    return "";
  }

  syncNegotiatedAmount();
  const range = negotiationRange();

  return `
    <div class="negotiate-panel ${negotiateEnabled ? "active" : ""}">
      <label class="negotiate-toggle">
        <input type="checkbox" data-negotiate-toggle ${negotiateEnabled ? "checked" : ""} />
        <span>
          <strong>Negociar direto com motorista</strong>
          <small>Voce escolhe um valor. O motorista pode aceitar ou enviar outra proposta.</small>
        </span>
      </label>
      <div class="negotiate-controls" ${negotiateEnabled ? "" : "hidden"}>
        <div class="price-guide">
          <span>Base sugerida</span>
          <strong>${formatFare(range.suggested)}</strong>
        </div>
        <input class="price-range" type="range" min="${range.min}" max="${range.max}" value="${Math.round(negotiatedAmount)}" step="1" data-negotiate-range />
        <div class="range-row">
          <span>${formatFare(range.min)}</span>
          <strong id="negotiatedValue">${formatFare(negotiatedAmount)}</strong>
          <span>${formatFare(range.max)}</span>
        </div>
        <label class="manual-price">
          <span>Ou digite o valor</span>
          <input inputmode="decimal" value="${formatFare(negotiatedAmount).replace("R$ ", "")}" data-negotiate-input aria-label="Valor que voce quer pagar" />
        </label>
      </div>
    </div>
  `;
}

function renderSelection() {
  clearTimeout(searchTimer);
  activeRideId = null;
  clientApp.classList.remove("confirming-pickup", "searching-ride", "ride-found");
  window.dispatchEvent(new CustomEvent("ride7:realtime-mode", { detail: { role: "client", mode: "roaming" } }));
  setStatus("", currentMode().status);

  clientSheet.innerHTML = `
    <div class="sheet-handle"></div>
    ${renderClientHomeSummary()}
    <div class="service-tabs">${renderServiceTabs()}</div>
    <div class="service-visual">
      <img src="${currentServiceImage()}" alt="${currentMode().label} RIDE7" />
      <span>${currentMode().label}</span>
    </div>
    <div class="address-stack">
      <label>
        <span class="origin-dot"></span>
        <input value="${registeredVehicle.pickup}" aria-label="${currentMode().originLabel}" />
      </label>
      <label>
        <span class="destination-dot"></span>
        <input value="${registeredVehicle.destination}" aria-label="${currentMode().destinationLabel}" />
      </label>
    </div>

    <div class="section-title">
      <strong>${currentMode().section}</strong>
      <span>Chegada em ${currentRide().meta.split(" - ")[0]}</span>
    </div>
    <div class="demand-alert">${selectedService === "delivery" ? "Tele entrega para marmitas, lanches e pequenos produtos com rastreio." : selectedService === "mototaxi" ? "Mototaxi com condutor verificado, placa visivel e rota compartilhavel." : "Precos um pouco acima do normal nesta regiao."}</div>
    <div class="client-options">${renderRideOptions()}</div>
    ${renderNegotiationPanel()}

    <div class="payment-footer">
      <button class="payment-summary" type="button" data-toggle-payments>
        <span>${selectedPayment}</span>
        <strong>${currentRide().fare}</strong>
      </button>
      <div class="client-payments" hidden>${renderPayments()}</div>
    </div>

    <button class="request-button" type="button" data-confirm-category>
      Escolher ${currentRide().name}
    </button>
  `;
}

function renderPickupConfirmation() {
  clientApp.classList.add("confirming-pickup");
  clientApp.classList.remove("searching-ride", "ride-found");
  window.dispatchEvent(new CustomEvent("ride7:realtime-mode", { detail: { role: "client", mode: "roaming" } }));
  setStatus("pickup", currentMode().confirmPickupTitle);

  clientSheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="pickup-view">
      <p class="mini-label">${currentMode().label}</p>
      <h2>${registeredVehicle.pickup}</h2>
      <p>${currentMode().confirmPickupText}</p>
      <div class="pickup-address">
        <span class="origin-dot"></span>
        <div>
          <strong>${selectedService === "delivery" ? "Restaurante ou loja de retirada" : "Rua Honorio Coelho da Rocha"}</strong>
          <span>Porto Alegre - RS</span>
        </div>
      </div>
      <div class="payment-footer compact">
        <span>${currentRide().name}</span>
        <strong>${negotiateEnabled ? `${formatFare(negotiatedAmount)} negociado` : currentRide().fare} - ${selectedPayment}</strong>
      </div>
      <button class="request-button" type="button" data-start-search>${currentMode().requestLabel}</button>
      <button class="secondary-button" type="button" data-back-selection>Voltar</button>
    </div>
  `;
}

function buildRidePayload(status = "requested") {
  const option = currentRide();
  return {
    id: activeRideId,
    status,
    serviceType: selectedService,
    serviceLabel: currentMode().label,
    passenger: "Marina Lopes",
    pickup: registeredVehicle.pickup,
    destination: registeredVehicle.destination,
    category: option.name,
    fare: negotiateEnabled ? formatFare(negotiatedAmount) : option.fare,
    suggestedFare: option.fare,
    negotiation: negotiateEnabled,
    negotiationMin: formatFare(negotiationRange().min),
    negotiationMax: formatFare(negotiationRange().max),
    payment: selectedPayment,
    packageType: selectedService === "delivery" ? option.name : null,
  };
}

function showSearching() {
  activeRideId = `ride-${Date.now()}`;
  const ride = currentRide();
  publishRideState(buildRidePayload());

  clientApp.classList.add("searching-ride");
  clientApp.classList.remove("ride-found");
  window.dispatchEvent(new CustomEvent("ride7:realtime-mode", { detail: { role: "client", mode: "to-pickup" } }));
  setStatus("searching", currentMode().searchingStatus);

  clientSheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="searching-view">
      <div class="service-visual compact">
        <img src="${currentServiceImage()}" alt="${currentMode().label} em busca" />
        <span>${currentMode().label}</span>
      </div>
      <div class="radar">
        <img src="./assets/ride7-logo-app.png" alt="" />
      </div>
      <h2>${currentMode().searchingTitle}</h2>
      <p>${ride.name} selecionado com pagamento por ${selectedPayment}. ${negotiateEnabled ? `Voce sugeriu ${formatFare(negotiatedAmount)} para o motorista avaliar.` : currentMode().searchingText}</p>
      <div class="search-steps">
        <span class="done">${selectedService === "delivery" ? "Ponto de retirada confirmado" : "Ponto de partida confirmado"}</span>
        <span class="done">Pagamento selecionado</span>
        <span>${negotiateEnabled ? "Aguardando resposta do motorista" : "Aguardando aceite no app Driver"}</span>
      </div>
      <button class="secondary-button" type="button" data-reset>Cancelar busca</button>
    </div>
  `;
}

function showDriverOffer(rideState = getRideState()) {
  const provider = providerData(rideState);
  const offer = rideState?.counterFare || rideState?.fare || formatFare(negotiatedAmount);
  clientApp.classList.add("ride-found");
  setStatus("found", `${provider.name} enviou uma proposta`);

  clientSheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="found-view">
      <div class="service-visual compact">
        <img src="${currentServiceImage()}" alt="${currentMode().label} com proposta" />
        <span>Negociar valor</span>
      </div>
      <h2>Motorista fez uma proposta</h2>
      <p>${provider.name} pode fazer por <strong>${offer}</strong>. Toque em aceitar para confirmar ou volte para procurar outro motorista.</p>
      <div class="offer-summary">
        <span>Sua sugestao</span>
        <strong>${rideState?.fare || formatFare(negotiatedAmount)}</strong>
        <span>Proposta do motorista</span>
        <strong>${offer}</strong>
      </div>
      <button class="request-button" type="button" data-accept-offer>Aceitar proposta</button>
      <button class="secondary-button" type="button" data-reset>Buscar outro motorista</button>
    </div>
  `;
}

function providerData(rideState = getRideState()) {
  if (selectedService === "mototaxi") {
    return {
      name: rideState?.driver || registeredVehicle.motoDriver,
      vehicle: rideState?.vehicle || registeredVehicle.moto,
      plate: rideState?.plate || registeredVehicle.motoPlate,
      label: "Mototaxista",
    };
  }
  if (selectedService === "delivery") {
    return {
      name: rideState?.driver || registeredVehicle.courier,
      vehicle: rideState?.vehicle || registeredVehicle.deliveryMoto,
      plate: rideState?.plate || registeredVehicle.motoPlate,
      label: "Entregador",
    };
  }
  return {
    name: rideState?.driver || registeredVehicle.driver,
    vehicle: rideState?.vehicle || registeredVehicle.vehicle,
    plate: rideState?.plate || registeredVehicle.plate,
    label: "Motorista",
  };
}

function showFoundDriver(rideState = getRideState()) {
  const provider = providerData(rideState);
  clientApp.classList.add("ride-found");
  window.dispatchEvent(new CustomEvent("ride7:realtime-mode", { detail: { role: "client", mode: "to-pickup" } }));
  setStatus("found", `${provider.name} aceitou e chega em ${registeredVehicle.eta}`);

  clientSheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="found-view">
      <div class="service-visual compact">
        <img src="${currentServiceImage()}" alt="${currentMode().label} confirmado" />
        <span>${currentMode().label}</span>
      </div>
      <h2>${currentMode().foundTitle}</h2>
      <p>${currentMode().foundText}</p>
      <div class="driver-card">
        <div class="driver-line">
          <span class="avatar">${provider.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
          <span>
            <strong>${provider.name}</strong>
            <span>${registeredVehicle.rating} estrelas - ${provider.label}</span>
          </span>
          <strong>${registeredVehicle.eta}</strong>
        </div>
        <div class="vehicle-line">
          <span class="car-icon"><img src="./assets/ride7-car-side.svg" alt="" /></span>
          <span>
            <strong>${provider.vehicle}</strong>
            <span>${registeredVehicle.color} - Placa ${provider.plate}</span>
          </span>
          <strong>OK</strong>
        </div>
      </div>
      <button class="request-button" type="button" data-confirm-boarding>${currentMode().confirmBoarding}</button>
      <button class="secondary-button" type="button" data-reset>${currentMode().resetLabel}</button>
    </div>
  `;
}

function renderTripInProgress(rideState = getRideState()) {
  const provider = providerData(rideState);
  clientApp.classList.add("ride-found");
  window.dispatchEvent(new CustomEvent("ride7:realtime-mode", { detail: { role: "client", mode: "to-destination" } }));
  setStatus("found", currentMode().startedStatus);

  clientSheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="found-view">
      <div class="service-visual compact">
        <img src="${currentServiceImage()}" alt="${currentMode().label} em andamento" />
        <span>${currentMode().label}</span>
      </div>
      <h2>${currentMode().startedTitle}</h2>
      <p>Rota ativa ate ${registeredVehicle.destination}. ${currentMode().startedText}</p>
      <div class="driver-card">
        <div class="driver-line">
          <span class="avatar">${provider.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
          <span>
            <strong>${provider.name}</strong>
            <span>${provider.vehicle} - Placa ${provider.plate}</span>
          </span>
          <strong>4 min</strong>
        </div>
      </div>
      <button class="request-button" type="button">${selectedService === "delivery" ? "Compartilhar entrega" : "Compartilhar viagem"}</button>
      <button class="secondary-button" type="button" data-reset>Encerrar demo</button>
    </div>
  `;
}

clientSheet.addEventListener("click", (event) => {
  const serviceButton = event.target.closest("[data-service]");
  const rideButton = event.target.closest("[data-ride]");
  const paymentButton = event.target.closest("[data-payment]");

  if (serviceButton) {
    selectedService = serviceButton.dataset.service;
    selectedOption = currentOptions()[0].id;
    negotiateEnabled = false;
    syncNegotiatedAmount();
    renderSelection();
    return;
  }

  if (rideButton) {
    selectedOption = rideButton.dataset.ride;
    syncNegotiatedAmount();
    renderSelection();
    return;
  }

  if (paymentButton) {
    selectedPayment = paymentButton.dataset.payment;
    renderSelection();
    return;
  }

  if (event.target.closest("[data-negotiate-toggle]")) {
    negotiateEnabled = event.target.checked;
    syncNegotiatedAmount();
    renderSelection();
    return;
  }

  if (event.target.closest("[data-toggle-payments]")) {
    const paymentList = clientSheet.querySelector(".client-payments");
    paymentList.hidden = !paymentList.hidden;
    return;
  }

  if (event.target.closest("[data-confirm-category]")) {
    renderPickupConfirmation();
    return;
  }

  if (event.target.closest("[data-start-search]")) {
    showSearching();
    return;
  }

  if (event.target.closest("[data-back-selection]")) {
    renderSelection();
    return;
  }

  if (event.target.closest("[data-confirm-boarding]")) {
    if (activeRideId) {
      publishRideState({ ...getRideState(), id: activeRideId, status: "started" });
    }
    renderTripInProgress();
    return;
  }

  if (event.target.closest("[data-accept-offer]")) {
    const rideState = getRideState();
    if (activeRideId && rideState?.id === activeRideId) {
      publishRideState({ ...rideState, fare: rideState.counterFare || rideState.fare, status: "accepted" });
      showFoundDriver({ ...rideState, fare: rideState.counterFare || rideState.fare, status: "accepted" });
    }
    return;
  }

  if (event.target.closest("[data-reset]")) {
    if (activeRideId) {
      publishRideState({ id: activeRideId, status: "cancelled", serviceType: selectedService });
    }
    renderSelection();
  }
});

clientSheet.addEventListener("input", (event) => {
  if (event.target.matches("[data-negotiate-range]")) {
    negotiatedAmount = Number(event.target.value);
    const value = clientSheet.querySelector("#negotiatedValue");
    const input = clientSheet.querySelector("[data-negotiate-input]");
    if (value) value.textContent = formatFare(negotiatedAmount);
    if (input) input.value = formatFare(negotiatedAmount).replace("R$ ", "");
  }

  if (event.target.matches("[data-negotiate-input]")) {
    const range = negotiationRange();
    const typed = Number(event.target.value.replace(",", ".").replace(/[^\d.]/g, ""));
    if (!Number.isNaN(typed)) {
      negotiatedAmount = Math.min(range.max, Math.max(range.min, typed));
      const value = clientSheet.querySelector("#negotiatedValue");
      const slider = clientSheet.querySelector("[data-negotiate-range]");
      if (value) value.textContent = formatFare(negotiatedAmount);
      if (slider) slider.value = Math.round(negotiatedAmount);
    }
  }
});

window.addEventListener("storage", (event) => {
  if (event.key !== RIDE_CHANNEL_KEY || !event.newValue) {
    return;
  }

  const rideState = getRideState();
  if (!rideState || rideState.id !== activeRideId) {
    return;
  }

  if (rideState.serviceType && rideState.serviceType !== selectedService) {
    selectedService = rideState.serviceType;
    selectedOption = currentOptions()[0].id;
  }

  if (rideState.status === "accepted") {
    showFoundDriver(rideState);
  }

  if (rideState.status === "counter_offer") {
    showDriverOffer(rideState);
  }

  if (rideState.status === "started") {
    renderTripInProgress(rideState);
  }

  if (rideState.status === "declined" || rideState.status === "cancelled") {
    setStatus("searching", `${currentMode().foundStatus} indisponivel, buscando outro`);
    showSearching();
  }
});

renderSelection();

window.Ride7Maps?.initializeRide7Map("clientGoogleMap", "client");
