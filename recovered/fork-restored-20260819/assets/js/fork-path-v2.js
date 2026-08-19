(function () {
  "use strict";

  var pathname = window.location.pathname || "";
  var prefix = /^\/fork(?:\/|$)/i.test(pathname) ? "/fork" : "";
  var prefixLower = prefix.toLowerCase();
  var pathAttributes = ["href", "src", "action", "poster"];

  function hasPrefix(path) {
    if (!prefix || typeof path !== "string") {
      return false;
    }
    var lower = path.toLowerCase();
    return lower === prefixLower || lower.indexOf(prefixLower + "/") === 0;
  }

  function rewrite(value) {
    if (!prefix || typeof value !== "string" || !value || value.indexOf("//") === 0) {
      return value;
    }

    var rootRelative = value.indexOf("/") === 0;
    var absoluteHttp = /^https?:\/\//i.test(value);
    if (!rootRelative && !absoluteHttp) {
      return value;
    }

    try {
      var parsed = new URL(value, window.location.origin);
      if (parsed.origin !== window.location.origin || hasPrefix(parsed.pathname)) {
        return value;
      }
      parsed.pathname = prefix + (parsed.pathname.indexOf("/") === 0 ? parsed.pathname : "/" + parsed.pathname);
      return rootRelative ? parsed.pathname + parsed.search + parsed.hash : parsed.href;
    } catch (error) {
      return value;
    }
  }

  window.BOF_FORK_PREFIX = prefix;
  window.bofPath = rewrite;

  function rewriteElement(element) {
    if (!element || element.nodeType !== 1) {
      return;
    }
    pathAttributes.forEach(function (attribute) {
      var value = element.getAttribute(attribute);
      var next = rewrite(value);
      if (next && next !== value) {
        element.setAttribute(attribute, next);
      }
    });
  }

  function scan(root) {
    if (!root || root.nodeType !== 1) {
      return;
    }
    rewriteElement(root);
    var selector = pathAttributes.map(function (attribute) {
      return "[" + attribute + "]";
    }).join(",");
    root.querySelectorAll(selector).forEach(rewriteElement);
  }

  if (document.documentElement && window.MutationObserver) {
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (record.type === "attributes") {
          rewriteElement(record.target);
          return;
        }
        record.addedNodes.forEach(function (node) {
          scan(node);
        });
      });
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: pathAttributes
    });
    scan(document.documentElement);
  }

  if (window.fetch) {
    var nativeFetch = window.fetch;
    window.fetch = function (input, init) {
      if (typeof input === "string") {
        input = rewrite(input);
      } else if (window.Request && input instanceof Request) {
        var requestUrl = rewrite(input.url);
        if (requestUrl !== input.url) {
          input = new Request(requestUrl, input);
        }
      } else if (input && typeof input.href === "string") {
        input = rewrite(input.href);
      }
      return nativeFetch.call(this, input, init);
    };
  }

  if (window.XMLHttpRequest) {
    var nativeOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      var args = Array.prototype.slice.call(arguments);
      args[1] = rewrite(url);
      return nativeOpen.apply(this, args);
    };
  }
})();

