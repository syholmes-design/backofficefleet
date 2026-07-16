(function () {
  function fetchLocal(localUrl) {
    return fetch(localUrl, { cache: "no-store", credentials: "same-origin" }).then(function (response) {
      if (!response.ok) throw new Error("Unable to load local BOF operations data.");
      return response.json();
    });
  }

  function fetchSupabase(config) {
    var baseUrl = String(config.url || "").replace(/\/+$/, "");
    var table = encodeURIComponent(config.datasetTable || "bof_public_operations_dataset");
    var id = encodeURIComponent(config.datasetId || "current");
    var endpoint = baseUrl + "/rest/v1/" + table + "?id=eq." + id + "&select=payload";

    return fetch(endpoint, {
      cache: "no-store",
      headers: {
        apikey: config.publishableKey,
        Authorization: "Bearer " + config.publishableKey,
        Accept: "application/json"
      }
    }).then(function (response) {
      if (!response.ok) throw new Error("Supabase dataset is not ready yet.");
      return response.json();
    }).then(function (rows) {
      if (!rows || !rows.length || !rows[0].payload) throw new Error("Supabase dataset is empty.");
      return rows[0].payload;
    });
  }

  function load(localUrl) {
    var config = window.BOFSupabaseConfig || {};
    if (!config.enabled || !config.url || !config.publishableKey) return fetchLocal(localUrl);

    return fetchSupabase(config).catch(function () {
      return fetchLocal(localUrl);
    });
  }

  window.BOFDataLoader = {
    load: load
  };
})();
