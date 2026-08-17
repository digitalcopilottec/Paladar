const wallet = {
  balance: 4750,
  transactions: [
    { title: "Bonus por corrida", type: "Recompensa", amount: "+25 CLV7", meta: "Hoje, 14:32 - TX-CLV7-2049 - Confirmado" },
    { title: "Entrega Paladar", type: "Cashback", amount: "+40 CLV7", meta: "Ontem, 20:11 - TX-CLV7-2038 - Confirmado" },
    { title: "Corrida Ride7", type: "Pagamento", amount: "-120 CLV7", meta: "12 ago, 09:05 - TX-CLV7-1981 - Confirmado" },
  ],
};

const panel = document.querySelector("#cloverPanel");
const historyList = document.querySelector("#historyList");
const balance = document.querySelector("[data-balance]");

function formatClv(value) {
  return `${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} CLV7`;
}

function updateBalance() {
  balance.textContent = formatClv(wallet.balance);
}

function renderHistory() {
  historyList.innerHTML = wallet.transactions
    .map(
      (item) => `
        <article class="history-row">
          <span>
            <strong>${item.title}</strong>
            <small>${item.type} - ${item.meta}</small>
          </span>
          <strong>${item.amount}</strong>
        </article>
      `,
    )
    .join("");
}

function qrMarkup() {
  const dark = [0, 1, 5, 6, 8, 12, 14, 17, 19, 21, 24, 28, 31, 35, 37, 40, 42, 43, 47, 48];
  return Array.from({ length: 49 }, (_, index) => `<span class="${dark.includes(index) ? "dark" : ""}"></span>`).join("");
}

function renderPanel(screen = "home") {
  const screens = {
    home: `
      <h2>Carteira Clover7</h2>
      <p>Acesse saldo, historico, recompensas e configuracoes em uma experiencia separada do app RIDE7.</p>
    `,
    send: `
      <h2>Enviar CLV7</h2>
      <label>Destinatario</label>
      <input value="@joao.ride7" />
      <label>Valor</label>
      <input value="150 CLV7" />
      <button type="button" data-confirm-send>Revisar envio</button>
    `,
    receive: `
      <h2>Receber CLV7</h2>
      <div class="qr-box" aria-label="QR Code Clover7">${qrMarkup()}</div>
      <p>ID: CLV7-MARINA-7A92</p>
      <button type="button">Copiar identificador</button>
    `,
    buy: `
      <h2>Compra preparada</h2>
      <p>Compra e conversao ficam bloqueadas ate validacao juridica, regulatoria e integracao com parceiro financeiro autorizado.</p>
    `,
    scan: `
      <h2>Escanear QR Code</h2>
      <p>Leitor preparado para pagamentos e transferencias. Em producao, solicita permissao da camera do aparelho.</p>
    `,
    settings: `
      <h2>Seguranca da carteira</h2>
      <p>PIN, biometria, limites transacionais, logs, controle de sessao e antifraude ficam preparados para as proximas fases.</p>
    `,
  };

  panel.innerHTML = screens[screen] || screens.home;
}

document.addEventListener("click", (event) => {
  const screenButton = event.target.closest("[data-screen]");
  if (screenButton) {
    renderPanel(screenButton.dataset.screen);
    return;
  }

  if (event.target.closest("[data-confirm-send]")) {
    wallet.balance -= 150;
    wallet.transactions.unshift({
      title: "Envio para @joao.ride7",
      type: "Enviado",
      amount: "-150 CLV7",
      meta: "Agora - TX-CLV7-DEMO - Aguardando autenticacao",
    });
    updateBalance();
    renderHistory();
    renderPanel("home");
  }
});

updateBalance();
renderHistory();
renderPanel();
