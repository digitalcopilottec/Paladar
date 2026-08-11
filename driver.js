const driverSheet = document.querySelector("#driverSheet");
const driverStatus = document.querySelector("#driverStatus");
const RIDE_CHANNEL_KEY = "ride7_demo_ride";

const driverProfile = {
  name: "Pablo Bueno Braga",
  cpf: "000.000.000-00",
  cnh: "12345678900",
  vehicle: "Toyota Corolla",
  motorcycle: "Honda CG 160",
  color: "Preto",
  plate: "R7D4A21",
  motoPlate: "R7M9T02",
  pix: "pablo@ride7.com",
};

const docs = [
  { id: "selfie", title: "Selfie do motorista", detail: "Foto para validacao facial" },
  { id: "cnh", title: "CNH", detail: "Documento obrigatorio" },
  { id: "vehicleDoc", title: "Documento do veiculo", detail: "CRLV ou equivalente" },
  { id: "vehiclePhoto", title: "Foto do veiculo", detail: "Frente/lateral visivel" },
  { id: "residence", title: "Comprovante de residencia", detail: "Endereco atualizado" },
];

const sponsorAds = [
  {
    title: "Digital Copilot Tecnologia",
    text: "Sistemas, automacoes e suporte para parceiros que querem crescer.",
    image: "./assets/sponsor-digital-copilot.png",
    cta: "Ver parceiro",
  },
  {
    title: "Paladar Restaurante",
    text: "Campanhas de entrega com cashback para clientes Ride7.",
    image: "./assets/sponsor-paladar.jpeg",
    cta: "Ver campanha",
  },
];

const appState = {
  approved: false,
  online: false,
  tripActive: false,
  currentRideId: null,
  uploadedDocs: new Set(),
};

function publishRideState(payload) {
  localStorage.setItem(
    RIDE_CHANNEL_KEY,
    JSON.stringify({
      ...payload,
      updatedAt: Date.now(),
    }),
  );
}

function getRideState() {
  try {
    return JSON.parse(localStorage.getItem(RIDE_CHANNEL_KEY) || "null");
  } catch {
    return null;
  }
}

window.addEventListener("ride7:location-updated", (event) => {
  const isBusy = driverStatus.classList.contains("incoming") || appState.tripActive;
  if (event.detail.role === "driver" && appState.approved && !isBusy) {
    setStatus(appState.online ? "online" : "", appState.online ? "Voce esta online com localizacao ativa" : "Localizacao do motorista conectada");
  }
});

window.addEventListener("ride7:map-fallback", (event) => {
  if (event.detail.role === "driver" && !appState.approved) {
    return;
  }

  if (event.detail.role === "driver") {
    const reason =
      event.detail.reason === "missing-api-key"
        ? "Google Maps em modo demo"
        : "Usando mapa demonstrativo";
    setStatus(appState.online ? "online" : "", reason);
  }
});

function setStatus(state, text) {
  driverStatus.className = `driver-status ${state}`;
  driverStatus.innerHTML = `<span></span><strong>${text}</strong>`;
}

function rideCopy(rideState = {}) {
  const serviceType = rideState.serviceType || "ride";
  const copies = {
    ride: {
      title: "Nova corrida",
      status: "Nova corrida disponivel",
      person: "Passageira",
      accept: "Aceitar corrida",
      pickup: "Embarque",
      destination: "Destino",
      confirmed: "Corrida confirmada",
      goToPickup: "Va ate o passageiro",
      waiting: "Aguardando o cliente confirmar o embarque no app.",
      activeStatus: "Corrida aceita",
      activeTitle: "Va ate o ponto de embarque",
      activeHint: "Dados do passageiro e rota ficam registrados para seguranca da viagem.",
      finish: "Finalizar demonstracao",
    },
    mototaxi: {
      title: "Nova MotoTaxi",
      status: "Nova chamada de mototaxi",
      person: "Passageira",
      accept: "Aceitar MotoTaxi",
      pickup: "Embarque",
      destination: "Destino",
      confirmed: "MotoTaxi confirmado",
      goToPickup: "Va ate o passageiro",
      waiting: "Aguardando o cliente confirmar o embarque com placa e capacete.",
      activeStatus: "MotoTaxi aceito",
      activeTitle: "Siga ate o destino",
      activeHint: "A rota da moto fica compartilhada e registrada ate o fim da corrida.",
      finish: "Finalizar demonstracao",
    },
    delivery: {
      title: "Nova entrega",
      status: "Nova tele entrega disponivel",
      person: "Cliente",
      accept: "Aceitar entrega",
      pickup: "Retirada",
      destination: "Entrega",
      confirmed: "Entrega confirmada",
      goToPickup: "Va ate o ponto de retirada",
      waiting: "Aguardando o cliente confirmar que o produto foi retirado.",
      activeStatus: "Entrega aceita",
      activeTitle: "Leve o pedido ate o destino",
      activeHint: "A retirada, deslocamento e entrega ficam acompanhados em tempo real.",
      finish: "Finalizar entrega demo",
    },
  };

  return copies[serviceType] || copies.ride;
}

function serviceImage(rideState = {}) {
  const images = {
    ride: "./assets/ride7-solicite-premium.jpg",
    mototaxi: "./assets/ride7-mototaxi-premium.jpg",
    delivery: "./assets/ride7-delivery-real.jpg",
  };

  return images[rideState.serviceType || "ride"];
}

function fareToNumber(fare = "R$ 0,00") {
  return Number(String(fare).replace("R$", "").replace(".", "").replace(",", ".").trim());
}

function formatFare(value) {
  return `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
}

function proposalOptions(rideState = {}) {
  const base = fareToNumber(rideState.fare || "R$ 31,40");
  return [base, base + 3, base + 6].map((value) => formatFare(value));
}

function renderRegistration() {
  appState.tripActive = false;
  window.dispatchEvent(new CustomEvent("ride7:realtime-mode", { detail: { role: "driver", mode: "roaming" } }));
  setStatus("", "Cadastro pendente");
  driverSheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="driver-visual">
      <img src="./assets/ride7-cadastro-system.jpg" alt="Sistema de cadastro RIDE7 Driver" />
      <span>Sistema de cadastro</span>
    </div>
    <div class="driver-title">
      <p>RIDE7 Driver</p>
      <h1>Cadastro do motorista</h1>
      <span>Preencha os dados obrigatorios e envie documentos para liberar o modo online.</span>
    </div>

    ${renderSponsorCarousel("Parceiros em destaque")}

    <div class="form-grid">
      <div class="field">
        <label>Nome completo</label>
        <input value="${driverProfile.name}" />
      </div>
      <div class="field">
        <label>CPF</label>
        <input value="${driverProfile.cpf}" />
      </div>
      <div class="field">
        <label>CNH</label>
        <input value="${driverProfile.cnh}" />
      </div>
      <div class="field">
        <label>Veiculo</label>
        <input value="${driverProfile.vehicle}" />
      </div>
      <div class="field">
        <label>Moto para MotoTaxi/entregas</label>
        <input value="${driverProfile.motorcycle}" />
      </div>
      <div class="field">
        <label>Cor do veiculo</label>
        <select>
          <option selected>Preto</option>
          <option>Branco</option>
          <option>Prata</option>
          <option>Cinza</option>
        </select>
      </div>
      <div class="field">
        <label>Placa</label>
        <input value="${driverProfile.plate}" />
      </div>
      <div class="field">
        <label>Placa da moto</label>
        <input value="${driverProfile.motoPlate}" />
      </div>
      <div class="field">
        <label>Conta bancaria ou chave PIX</label>
        <input value="${driverProfile.pix}" />
      </div>
    </div>

    <div class="document-grid">
      ${renderDocuments()}
    </div>

    <div class="action-stack">
      <button class="primary-button" type="button" data-submit-docs>
        Enviar para aprovacao
      </button>
    </div>
  `;
}

function renderDocuments() {
  return docs
    .map((doc) => {
      const done = appState.uploadedDocs.has(doc.id);
      return `
        <article class="doc-card ${done ? "done" : ""}">
          <span>
            <strong>${doc.title}</strong>
            <span>${done ? "Arquivo anexado" : doc.detail}</span>
          </span>
          <button type="button" data-upload="${doc.id}">${done ? "OK" : "Anexar"}</button>
        </article>
      `;
    })
    .join("");
}

function renderSponsorCarousel(title = "Campanhas patrocinadas") {
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

function renderDashboard() {
  appState.tripActive = false;
  window.dispatchEvent(new CustomEvent("ride7:realtime-mode", { detail: { role: "driver", mode: appState.online ? "roaming" : "roaming" } }));
  setStatus(appState.online ? "online" : "", appState.online ? "Voce esta online" : "Voce esta offline");
  driverSheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="driver-visual">
      <img src="./assets/ride7-cadastro-system.jpg" alt="Painel RIDE7 Driver com carro, moto e graficos" />
      <span>Carro, MotoTaxi e entregas</span>
    </div>
    <div class="driver-title">
      <p>Conta aprovada</p>
      <h2>${appState.online ? "Pronto para receber corridas" : "Tudo pronto?"}</h2>
      <span>${appState.online ? "Fique atento as chamadas proximas." : "Fique online para aparecer para passageiros proximos."}</span>
    </div>

    ${renderSponsorCarousel("Campanhas para parceiros")}

    <section class="partner-dashboard" aria-label="Resumo do parceiro">
      <div class="partner-level">
        <span>Nivel Ouro</span>
        <strong>2.850 pontos</strong>
        <div class="driver-progress"><span style="width: 72%"></span></div>
        <small>Faltam 650 pontos para Platina</small>
      </div>
      <div class="partner-metrics">
        <article><span>Hoje</span><strong>R$ 284</strong></article>
        <article><span>Corridas</span><strong>12</strong></article>
        <article><span>Cashback</span><strong>R$ 18</strong></article>
        <article><span>Ranking</span><strong>#24</strong></article>
      </div>
      <article class="weekly-goal">
        <span>Meta semanal</span>
        <strong>36 / 50 corridas</strong>
        <p>Complete mais 14 corridas e ganhe +500 pontos.</p>
      </article>
    </section>

    <div class="vehicle-summary">
      <span class="car-symbol"><img src="./assets/ride7-car-side.svg" alt="" /></span>
      <span>
        <strong>${driverProfile.vehicle}</strong>
        <span>${driverProfile.color} - Placa ${driverProfile.plate}</span>
      </span>
    </div>

    <div class="service-badges" aria-label="Servicos ativos">
      <span>Carro</span>
      <span>MotoTaxi</span>
      <span>Tele entrega</span>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <span>Hoje</span>
        <strong>R$ 0,00</strong>
      </article>
      <article class="stat-card">
        <span>Semana</span>
        <strong>R$ 0,00</strong>
      </article>
      <article class="stat-card">
        <span>Avaliacao</span>
        <strong>4,97</strong>
      </article>
    </div>

    <article class="opportunity-card">
      <strong>Tendencia de ganhos em alta</strong>
      <span>Centro e aeroporto com maior procura nos proximos minutos.</span>
    </article>

    <article class="subscription-status">
      <span>Minha Assinatura</span>
      <strong>Plano Carro ativo</strong>
      <small>Proxima cobranca em 12/09 - taxa reduzida e prioridade regional.</small>
    </article>

    <div class="action-stack">
      <button class="${appState.online ? "danger-button" : "online-button"}" type="button" data-toggle-online>
        ${appState.online ? "Ficar offline" : "Ficar online"}
      </button>
      <button class="secondary-button" type="button" data-open-account>Conta e documentos</button>
    </div>
  `;

  if (appState.online) {
    const pendingRide = getRideState();
    if (pendingRide?.status === "requested") {
      window.setTimeout(() => renderIncomingRide(pendingRide), 500);
    } else {
      window.setTimeout(renderDemoIncomingRide, 1400);
    }
  }
}

function renderDemoIncomingRide() {
  if (getRideState()?.status === "requested") {
    return;
  }

  renderIncomingRide({
    id: `demo-${Date.now()}`,
    status: "requested",
    passenger: "Marina Lopes",
    pickup: "Rua Mostardeiro",
    destination: "Aeroporto Salgado Filho",
    category: "Ride7",
    fare: "R$ 31,40",
    payment: "PIX",
    serviceType: "ride",
    serviceLabel: "Carona",
  });
}

function renderIncomingRide(rideState = getRideState()) {
  if (!appState.online) {
    return;
  }

  appState.currentRideId = rideState?.id || `demo-${Date.now()}`;
  const copy = rideCopy(rideState);
  const productLine = rideState?.serviceType === "delivery" ? `<div><span class="dot package"></span><span>Produto: ${rideState?.packageType || rideState?.category || "Marmitas"}</span></div>` : "";
  const isNegotiation = Boolean(rideState?.negotiation);
  const proposals = proposalOptions(rideState);
  const negotiationBlock = isNegotiation
    ? `
      <div class="negotiate-request">
        <span>Negociacao</span>
        <strong>Cliente sugeriu ${rideState?.fare || "R$ 31,40"}</strong>
        <small>Toque em uma proposta para enviar. O cliente decide se aceita.</small>
        <div class="proposal-grid">
          ${proposals.map((proposal) => `<button type="button" data-send-offer="${proposal}">${proposal}</button>`).join("")}
        </div>
      </div>
    `
    : "";
  window.dispatchEvent(new CustomEvent("ride7:realtime-mode", { detail: { role: "driver", mode: "to-pickup" } }));
  setStatus("incoming", isNegotiation ? "Chamada para negociar valor" : copy.status);
  driverSheet.innerHTML = `
    <div class="sheet-handle"></div>
    <article class="request-card ${isNegotiation ? "negotiation-card" : ""}">
      <div class="request-visual">
        <img src="${serviceImage(rideState)}" alt="${copy.title} RIDE7" />
        <span>${isNegotiation ? "Negociar" : rideState?.serviceLabel || "Carona"}</span>
      </div>
      <div class="request-top">
        <span>
          <h2>${isNegotiation ? "Cliente quer negociar" : copy.title}</h2>
          <span>${copy.person}: ${rideState?.passenger || "Marina Lopes"} - ${rideState?.serviceLabel || "Carona"} - 4,9 estrelas</span>
        </span>
        <strong class="request-fare">${rideState?.fare || "R$ 31,40"}</strong>
      </div>
      <div class="route-list">
        <div><span class="dot"></span><span>1,2 km ate ${copy.pickup.toLowerCase()} - ${rideState?.pickup || "Rua Mostardeiro"}</span></div>
        <div><span class="dot dropoff"></span><span>${copy.destination}: ${rideState?.destination || "Aeroporto Salgado Filho"}</span></div>
        ${productLine}
      </div>
      ${negotiationBlock}
      <div class="request-actions">
        <button class="secondary-button" type="button" data-decline-ride>Recusar</button>
        <button class="online-button" type="button" data-accept-ride>${isNegotiation ? "Aceitar valor sugerido" : copy.accept}</button>
      </div>
    </article>
  `;
}

function renderWaitingOfferAnswer(rideState = getRideState()) {
  appState.tripActive = false;
  setStatus("incoming", "Proposta enviada ao cliente");
  driverSheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="trip-active">
      <div class="driver-visual compact">
        <img src="${serviceImage(rideState)}" alt="Proposta enviada RIDE7" />
        <span>Negociacao</span>
      </div>
      <div class="driver-title">
        <p>Proposta enviada</p>
        <h2>Aguardando resposta</h2>
        <span>O cliente recebeu o valor ${rideState?.counterFare || rideState?.fare}. Assim que aceitar, a corrida fica confirmada.</span>
      </div>
      <button class="secondary-button" type="button" data-decline-ride>Cancelar proposta</button>
    </div>
  `;
}

function renderActiveTrip(rideState = getRideState()) {
  appState.tripActive = true;
  const copy = rideCopy(rideState);
  window.dispatchEvent(new CustomEvent("ride7:realtime-mode", { detail: { role: "driver", mode: "to-destination" } }));
  setStatus("online", copy.activeStatus);
  driverSheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="trip-active">
      <div class="driver-visual compact">
        <img src="${serviceImage(rideState)}" alt="${copy.activeStatus} RIDE7" />
        <span>${rideState?.serviceLabel || "Carona"}</span>
      </div>
      <div class="driver-title">
        <p>Navegacao integrada</p>
        <h2>${copy.activeTitle}</h2>
        <span>${rideState?.pickup || "Rua Mostardeiro"} - ${rideState?.passenger || "Marina Lopes"}.</span>
      </div>
      <div class="stats-grid">
        <article class="stat-card">
          <span>Distancia</span>
          <strong>1,2 km</strong>
        </article>
        <article class="stat-card">
          <span>Tempo</span>
          <strong>4 min</strong>
        </article>
        <article class="stat-card">
          <span>Valor</span>
          <strong>${rideState?.fare || "R$ 31,40"}</strong>
        </article>
      </div>
      <p>${copy.activeHint}</p>
      <button class="online-button" type="button" data-finish-trip>${copy.finish}</button>
    </div>
  `;
}

function renderAcceptedWaitingPickup(rideState = getRideState()) {
  appState.tripActive = false;
  const copy = rideCopy(rideState);
  window.dispatchEvent(new CustomEvent("ride7:realtime-mode", { detail: { role: "driver", mode: "to-pickup" } }));
  setStatus("online", copy.activeStatus);
  driverSheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="trip-active">
      <div class="driver-visual compact">
        <img src="${serviceImage(rideState)}" alt="${copy.confirmed} RIDE7" />
        <span>${rideState?.serviceLabel || "Carona"}</span>
      </div>
      <div class="driver-title">
        <p>${copy.confirmed}</p>
        <h2>${copy.goToPickup}</h2>
        <span>${copy.waiting}</span>
      </div>
      <div class="stats-grid">
        <article class="stat-card">
          <span>${copy.pickup}</span>
          <strong>1,2 km</strong>
        </article>
        <article class="stat-card">
          <span>Tempo</span>
          <strong>4 min</strong>
        </article>
        <article class="stat-card">
          <span>Valor</span>
          <strong>${rideState?.fare || "R$ 31,40"}</strong>
        </article>
      </div>
      <p>Assim que o cliente confirmar, a navegacao muda para ${copy.destination.toLowerCase()}.</p>
      <button class="secondary-button" type="button" data-decline-ride>Cancelar corrida</button>
    </div>
  `;
}

driverSheet.addEventListener("click", (event) => {
  const uploadButton = event.target.closest("[data-upload]");

  if (uploadButton) {
    appState.uploadedDocs.add(uploadButton.dataset.upload);
    renderRegistration();
    return;
  }

  if (event.target.closest("[data-submit-docs]")) {
    docs.forEach((doc) => appState.uploadedDocs.add(doc.id));
    appState.approved = true;
    renderDashboard();
    return;
  }

  if (event.target.closest("[data-toggle-online]")) {
    appState.online = !appState.online;
    renderDashboard();
    return;
  }

  if (event.target.closest("[data-open-account]")) {
    renderRegistration();
    return;
  }

  if (event.target.closest("[data-decline-ride]")) {
    if (appState.currentRideId) {
      publishRideState({ id: appState.currentRideId, status: "declined" });
      appState.currentRideId = null;
    }
    renderDashboard();
    return;
  }

  if (event.target.closest("[data-accept-ride]")) {
    const rideState = getRideState();
    if (appState.currentRideId && rideState?.id === appState.currentRideId) {
      const acceptedPayload = {
        ...rideState,
        status: "accepted",
        driver: driverProfile.name,
        vehicle: rideState.serviceType === "ride" ? driverProfile.vehicle : driverProfile.motorcycle,
        color: driverProfile.color,
        plate: rideState.serviceType === "ride" ? driverProfile.plate : driverProfile.motoPlate,
      };
      publishRideState(acceptedPayload);
      renderAcceptedWaitingPickup(acceptedPayload);
      return;
    }
    renderAcceptedWaitingPickup(rideState);
    return;
  }

  const offerButton = event.target.closest("[data-send-offer]");
  if (offerButton) {
    const rideState = getRideState();
    if (appState.currentRideId && rideState?.id === appState.currentRideId) {
      const offerPayload = {
        ...rideState,
        status: "counter_offer",
        counterFare: offerButton.dataset.sendOffer,
        driver: driverProfile.name,
        vehicle: rideState.serviceType === "ride" ? driverProfile.vehicle : driverProfile.motorcycle,
        color: driverProfile.color,
        plate: rideState.serviceType === "ride" ? driverProfile.plate : driverProfile.motoPlate,
      };
      publishRideState(offerPayload);
      renderWaitingOfferAnswer(offerPayload);
    }
    return;
  }

  if (event.target.closest("[data-finish-trip]")) {
    appState.online = true;
    renderDashboard();
  }
});

renderRegistration();

window.addEventListener("storage", (event) => {
  if (event.key !== RIDE_CHANNEL_KEY || !event.newValue || !appState.online) {
    return;
  }

  const rideState = getRideState();
  if (rideState?.status === "requested" && !appState.tripActive) {
    renderIncomingRide(rideState);
  }

  if (rideState?.status === "started" && rideState.id === appState.currentRideId) {
    renderActiveTrip(rideState);
  }

  if (rideState?.status === "accepted" && rideState.id === appState.currentRideId) {
    renderAcceptedWaitingPickup(rideState);
  }

  if (rideState?.status === "cancelled" && rideState.id === appState.currentRideId) {
    appState.currentRideId = null;
    renderDashboard();
  }
});

window.Ride7Maps?.initializeRide7Map("driverGoogleMap", "driver");
