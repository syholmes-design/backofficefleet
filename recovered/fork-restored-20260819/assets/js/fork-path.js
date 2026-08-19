(function () {
  "use strict";

  var pathname = window.location.pathname || "";
  var prefix = /^\/fork(?:\/|$)/i.test(pathname) ? "/fork" : "";
  var pathAttributes = ["href", "src", "action", "poster"];

  function rewrite(value) {
    if (typeof value !== "string" || value.indexOf("/") !== 0 || value.indexOf("//") === 0) {
      return value;
    }
    return prefix + value;
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
      } else if (input && typeof input.url === "string") {
        input = rewrite(input.url);
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
