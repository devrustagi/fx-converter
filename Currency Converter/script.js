const locales = {
  USD: "US",
  EUR: "FR",
  GBP: "GB",
  INR: "IN",
  AUD: "AU",
  CAD: "CA",
  JPY: "JP",
  CNY: "CN",
  SGD: "SG",
  AED: "AE",
  CHF: "CH",
  NZD: "NZ",
  SEK: "SE",
  NOK: "NO",
  RUB: "RU",
  BRL: "BR",
};

const amountsInput = document.getElementById("amount");
const fromSelect = document.getElementById("fromCurrency");
const toSelect = document.getElementById("toCurrency");
const fromFlag = document.getElementById("fromFlag");
const toFlag = document.getElementById("toFlag");
const resultDisplay = document.getElementById("resultDisplay");
const rateInfo = document.getElementById("rateInfo");
const statusMessage = document.getElementById("statusMessage");
const convertBtn = document.getElementById("convertBtn");
const swapBtn = document.getElementById("swapBtn");
const copyBtn = document.getElementById("copyBtn");
const quickButtons = document.getElementById("quickButtons");

const popularPairs = [
  { from: "USD", to: "EUR" },
  { from: "USD", to: "INR" },
  { from: "EUR", to: "GBP" },
  { from: "GBP", to: "USD" },
  { from: "USD", to: "JPY" },
];

function getFlagCode(currency) {
  return countryList[currency] || locales[currency] || "UN";
}

function getFlagUrl(currency) {
  const country = getFlagCode(currency);
  return `https://flagsapi.com/${country}/flat/64.png`;
}

function createCurrencyOption(value, selected = false) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = value;
  if (selected) option.selected = true;
  return option;
}

function populateSelects() {
  const currencies = Object.keys(countryList).sort();
  currencies.forEach((currency) => {
    fromSelect.appendChild(createCurrencyOption(currency, currency === "USD"));
    toSelect.appendChild(createCurrencyOption(currency, currency === "INR"));
  });
}

function updateFlags() {
  fromFlag.src = getFlagUrl(fromSelect.value);
  fromFlag.alt = `${fromSelect.value} flag`;
  toFlag.src = getFlagUrl(toSelect.value);
  toFlag.alt = `${toSelect.value} flag`;
}

function setStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.style.color =
    type === "error" ? "#ff7f87" : type === "success" ? "#76d9a2" : "#bbc9e3";
}

function selectQuickPair(pair) {
  fromSelect.value = pair.from;
  toSelect.value = pair.to;
  updateFlags();
  convertCurrency();
  setActiveQuickButton(pair);
}

function setActiveQuickButton(pair) {
  quickButtons.querySelectorAll("button").forEach((button) => {
    const match = button.dataset.from === pair.from && button.dataset.to === pair.to;
    button.classList.toggle("active", match);
  });
}

async function convertCurrency() {
  const amount = Number(amountsInput.value.trim());
  const fromCurrency = fromSelect.value;
  const toCurrency = toSelect.value;

  if (!amount || amount < 0) {
    setStatus("Enter a valid amount above 0.", "error");
    resultDisplay.textContent = "--";
    rateInfo.textContent = "Waiting for valid input.";
    return;
  }

  if (fromCurrency === toCurrency) {
    const formatted = amount.toLocaleString(undefined, {
      style: "currency",
      currency: toCurrency,
    });
    resultDisplay.textContent = formatted;
    rateInfo.textContent = `1 ${fromCurrency} = 1 ${toCurrency}`;
    setStatus("Same currency selected. No conversion needed.", "success");
    return;
  }

  setStatus("Fetching the latest exchange rate...");

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`);
    const data = await response.json();

    if (!data || data.result !== "success" || !data.rates || !data.rates[toCurrency]) {
      throw new Error("Unexpected API response");
    }

    const rate = Number(data.rates[toCurrency]);
    const converted = Number((amount * rate).toFixed(2));
    resultDisplay.textContent = converted.toLocaleString(undefined, {
      style: "currency",
      currency: toCurrency,
    });
    rateInfo.textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
    setStatus("Conversion completed successfully.", "success");
  } catch (error) {
    console.error(error);
    resultDisplay.textContent = "--";
    rateInfo.textContent = `Could not load rates for ${fromCurrency} → ${toCurrency}.`;
    setStatus("Unable to fetch exchange rates. Try again later.", "error");
  }
}

function setupQuickButtons() {
  popularPairs.forEach((pair) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.from = pair.from;
    button.dataset.to = pair.to;
    button.textContent = `${pair.from} → ${pair.to}`;
    button.addEventListener("click", () => selectQuickPair(pair));
    quickButtons.appendChild(button);
  });
}

function handleSwap() {
  const previousFrom = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = previousFrom;
  updateFlags();
  convertCurrency();
}

function handleCopy() {
  const resultText = resultDisplay.textContent;
  if (!resultText || resultText === "--") {
    setStatus("Nothing to copy yet.", "error");
    return;
  }

  navigator.clipboard
    .writeText(resultText)
    .then(() => setStatus("Converted amount copied to clipboard.", "success"))
    .catch(() => setStatus("Unable to copy to clipboard.", "error"));
}

function bindEvents() {
  convertBtn.addEventListener("click", convertCurrency);
  swapBtn.addEventListener("click", handleSwap);
  copyBtn.addEventListener("click", handleCopy);
  fromSelect.addEventListener("change", () => {
    updateFlags();
    convertCurrency();
  });
  toSelect.addEventListener("change", () => {
    updateFlags();
    convertCurrency();
  });
  amountsInput.addEventListener("input", () => {
    setStatus("Ready to convert.");
  });
}

function init() {
  populateSelects();
  updateFlags();
  setupQuickButtons();
  bindEvents();
  convertCurrency();
}

init(); 