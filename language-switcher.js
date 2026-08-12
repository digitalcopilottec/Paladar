const RIDE7_LANGUAGE_KEY = "ride7_language";

function setRide7Language(language) {
  const selectedLanguage = language || "pt-BR";
  localStorage.setItem(RIDE7_LANGUAGE_KEY, selectedLanguage);
  document.documentElement.lang = selectedLanguage;

  document.querySelectorAll("[data-language-switcher]").forEach((switcher) => {
    switcher.querySelectorAll("[data-lang]").forEach((button) => {
      button.classList.toggle("active", button.dataset.lang === selectedLanguage);
      button.setAttribute("aria-pressed", String(button.dataset.lang === selectedLanguage));
    });
  });
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-lang]");

  if (!button) {
    return;
  }

  setRide7Language(button.dataset.lang);
});

setRide7Language(localStorage.getItem(RIDE7_LANGUAGE_KEY) || "pt-BR");
