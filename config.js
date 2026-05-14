(() => {
  let dispatched = false;

  function signalReady() {
    if (dispatched) {
      return;
    }

    dispatched = true;
    window.dispatchEvent(new Event("media-config-ready"));
  }

  const localConfig = document.createElement("script");
  localConfig.src = "./config.local.js";
  localConfig.defer = true;
  localConfig.onload = signalReady;
  localConfig.onerror = signalReady;
  document.head.appendChild(localConfig);

  window.setTimeout(signalReady, 1500);
})();
