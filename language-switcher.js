const RIDE7_LANGUAGE_KEY = "ride7_language";
const languageFlags = {
  en: "flag-us",
  es: "flag-es",
  "pt-BR": "flag-br",
  "pt-PT": "flag-pt",
};

function setRide7Language(language) {
  const selectedLanguage = language || "pt-BR";
  localStorage.setItem(RIDE7_LANGUAGE_KEY, selectedLanguage);
  document.documentElement.lang = selectedLanguage;

  document.querySelectorAll("[data-language-switcher]").forEach((switcher) => {
    switcher.querySelectorAll("[data-lang]").forEach((button) => {
      button.classList.toggle("active", button.dataset.lang === selectedLanguage);
      button.setAttribute("aria-pressed", String(button.dataset.lang === selectedLanguage));
    });
    switcher.querySelectorAll("[data-current-flag]").forEach((flag) => {
      flag.className = `flag ${languageFlags[selectedLanguage] || "flag-br"}`;
    });
    switcher.classList.remove("open");
  });
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-language-trigger]");
  if (trigger) {
    const switcher = trigger.closest("[data-language-switcher]");
    const isOpen = switcher.classList.contains("open");
    document.querySelectorAll("[data-language-switcher].open").forEach((item) => item.classList.remove("open"));
    switcher.classList.toggle("open", !isOpen);
    return;
  }

  const button = event.target.closest("[data-lang]");

  if (button) {
    setRide7Language(button.dataset.lang);
    return;
  }

  document.querySelectorAll("[data-language-switcher].open").forEach((item) => item.classList.remove("open"));
});

setRide7Language(localStorage.getItem(RIDE7_LANGUAGE_KEY) || "pt-BR");
