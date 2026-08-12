const params = new URLSearchParams(window.location.search);
const role = params.get("tipo") === "driver" ? "driver" : "cliente";
let mode = params.get("modo") === "cadastro" ? "cadastro" : "login";

const copy = {
  cliente: {
    kicker: "Acesso do passageiro",
    loginTitle: "Entre para pedir sua carona",
    signupTitle: "Crie sua conta de passageiro",
    text: "Use e-mail ou celular com senha. Depois você acessa o aplicativo do cliente.",
    target: "./cliente.html",
    submitLogin: "Entrar no app cliente",
    submitSignup: "Criar conta e entrar",
  },
  driver: {
    kicker: "Acesso do motorista",
    loginTitle: "Entre para dirigir com Ride7",
    signupTitle: "Cadastre-se como motorista",
    text: "Crie seu acesso, envie documentos e depois acompanhe chamadas no Ride7 Driver.",
    target: "./driver.html",
    submitLogin: "Entrar no Driver",
    submitSignup: "Cadastrar e continuar",
  },
};

const authKicker = document.querySelector("#authKicker");
const authTitle = document.querySelector("#authTitle");
const authText = document.querySelector("#authText");
const authSubmit = document.querySelector("#authSubmit");
const authForm = document.querySelector("#authForm");

function renderAuth() {
  const selected = copy[role];
  authKicker.textContent = selected.kicker;
  authTitle.textContent = mode === "cadastro" ? selected.signupTitle : selected.loginTitle;
  authText.textContent = selected.text;
  authSubmit.textContent = mode === "cadastro" ? selected.submitSignup : selected.submitLogin;

  document.querySelectorAll("[data-role-link]").forEach((link) => {
    link.classList.toggle("active", link.dataset.roleLink === role);
  });

  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === mode);
  });

  document.querySelectorAll("[data-signup-only]").forEach((field) => {
    field.hidden = mode !== "cadastro";
  });

  document.querySelectorAll("[data-driver-only]").forEach((field) => {
    field.hidden = role !== "driver" || mode !== "cadastro";
  });
}

document.querySelector(".auth-mode").addEventListener("click", (event) => {
  const button = event.target.closest("[data-auth-mode]");

  if (!button) {
    return;
  }

  mode = button.dataset.authMode;
  renderAuth();
});

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  window.location.href = copy[role].target;
});

renderAuth();
