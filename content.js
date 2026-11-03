(() => {
  "use strict";

  // YouTube's player API can describe mid-rolls in JSON before playback starts.
  // Remove only ad scheduling fields and leave video formats and metadata intact.
  const AD_FIELDS = new Set(["adPlacements", "adSlots", "playerAds"]);
  const originalJson = Response.prototype.json;
  const originalText = Response.prototype.text;
  const xhrUrl = new WeakMap();

  function isPlayerResponse(url) {
    return typeof url === "string" &&
      /(?:youtubei\/v1\/(?:player|get_watch)|\/watch\?|\/playlist\?)/i.test(url);
  }

  function removeAdFields(value, seen = new WeakSet()) {
    if (!value || typeof value !== "object" || seen.has(value)) return value;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) removeAdFields(item, seen);
      return value;
    }
    for (const key of Object.keys(value)) {
      if (AD_FIELDS.has(key)) {
        delete value[key];
      } else {
        removeAdFields(value[key], seen);
      }
    }
    return value;
  }

  function pruneJsonText(text) {
    try {
      const data = JSON.parse(text);
      return JSON.stringify(removeAdFields(data));
    } catch {
      return text;
    }
  }

  Response.prototype.json = function (...args) {
    const url = this.url;
    return originalJson.apply(this, args).then((value) =>
      isPlayerResponse(url) ? removeAdFields(value) : value
    );
  };

  Response.prototype.text = function (...args) {
    const url = this.url;
    return originalText.apply(this, args).then((value) =>
      isPlayerResponse(url) ? pruneJsonText(value) : value
    );
  };

  const responseTextDescriptor = Object.getOwnPropertyDescriptor(
    XMLHttpRequest.prototype,
    "responseText"
  );
  const responseDescriptor = Object.getOwnPropertyDescriptor(
    XMLHttpRequest.prototype,
    "response"
  );
  const originalOpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    xhrUrl.set(this, String(url));
    return originalOpen.call(this, method, url, ...rest);
  };

  if (responseTextDescriptor?.get && responseTextDescriptor.configurable) {
    Object.defineProperty(XMLHttpRequest.prototype, "responseText", {
      ...responseTextDescriptor,
      get() {
        const text = responseTextDescriptor.get.call(this);
        return isPlayerResponse(xhrUrl.get(this)) ? pruneJsonText(text) : text;
      }
    });
  }

  if (responseDescriptor?.get && responseDescriptor.configurable) {
    Object.defineProperty(XMLHttpRequest.prototype, "response", {
      ...responseDescriptor,
      get() {
        const result = responseDescriptor.get.call(this);
        if (!isPlayerResponse(xhrUrl.get(this))) return result;
        return result && typeof result === "object" ? removeAdFields(result) :
          (typeof result === "string" ? pruneJsonText(result) : result);
      }
    });
  }
})();
