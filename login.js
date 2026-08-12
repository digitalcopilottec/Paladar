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
    demoLogin: "cliente@ride7.com",
    demoPassword: "Ride7@2026",
    submitLogin: "Entrar no app cliente",
    submitSignup: "Criar conta e entrar",
  },
  driver: {
    kicker: "Acesso do motorista",
    loginTitle: "Entre para dirigir com Ride7",
    signupTitle: "Cadastre-se como motorista",
    text: "Crie seu acesso, envie documentos e depois acompanhe chamadas no Ride7 Driver.",
    target: "./driver.html",
    demoLogin: "motorista@ride7.com",
    demoPassword: "Driver7@2026",
    submitLogin: "Entrar no Driver",
    submitSignup: "Cadastrar e continuar",
  },
};

const authKicker = document.querySelector("#authKicker");
const authTitle = document.querySelector("#authTitle");
const authText = document.querySelector("#authText");
const authSubmit = document.querySelector("#authSubmit");
const authForm = document.querySelector("#authForm");
const demoLogin = document.querySelector("#demoLogin");
const demoPassword = document.querySelector("#demoPassword");
const fillDemo = document.querySelector("#fillDemo");
const authError = document.querySelector("#authError");

function renderAuth() {
  const selected = copy[role];
  authKicker.textContent = selected.kicker;
  authTitle.textContent = mode === "cadastro" ? selected.signupTitle : selected.loginTitle;
  authText.textContent = selected.text;
  authSubmit.textContent = mode === "cadastro" ? selected.submitSignup : selected.submitLogin;
  demoLogin.textContent = selected.demoLogin;
  demoPassword.textContent = `Senha: ${selected.demoPassword}`;
  authError.hidden = true;

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

fillDemo.addEventListener("click", () => {
  const selected = copy[role];
  authForm.elements.login.value = selected.demoLogin;
  authForm.elements.password.value = selected.demoPassword;
  authError.hidden = true;
});

authForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const selected = copy[role];
  const login = authForm.elements.login.value.trim();
  const password = authForm.elements.password.value;

  if (mode === "login" && (login !== selected.demoLogin || password !== selected.demoPassword)) {
    authError.hidden = false;
    return;
  }

  window.location.href = copy[role].target;
});

renderAuth();
