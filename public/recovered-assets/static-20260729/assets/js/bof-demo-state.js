(function () {
  var KEY = "bof-demo-admin-overrides-v1";

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function read() {
    try {
      return JSON.parse(window.localStorage.getItem(KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function write(overrides) {
    window.localStorage.setItem(KEY, JSON.stringify(overrides || {}));
  }

  function byId(items) {
    return (items || []).reduce(function (map, item) {
      if (item && item.id) map[item.id] = item;
      return map;
    }, {});
  }

  function normalizeType(value) {
    var text = String(value || "").toLowerCase();
    if (text.indexOf("owner") >= 0) return "owner-operator";
    if (text.indexOf("independent") >= 0 || text.indexOf("contractor") >= 0) return "independent";
    return "employee";
  }

  function classificationLabel(key) {
    if (key === "owner-operator") return "Owner-operator";
    if (key === "independent") return "Independent contractor";
    return "Employee driver";
  }

  function assignmentMap(data) {
    return (data.driverCarrierAssignments || []).reduce(function (map, item) {
      map[item.driverId] = item;
      return map;
    }, {});
  }

  function apply(data) {
    var next = clone(data);
    var overrides = read();
    var driverOverrides = overrides.drivers || {};
    var payOverrides = overrides.driverPayProfiles || {};
    var carrierOverrides = overrides.driverCarrierAssignments || {};

    next.drivers = (next.drivers || []).map(function (driver) {
      var merged = Object.assign({}, driver, driverOverrides[driver.id] || {});
      if (carrierOverrides[driver.id]) merged.carrierId = carrierOverrides[driver.id];
      return merged;
    });

    next.driverPayProfiles = (next.driverPayProfiles || []).map(function (profile) {
      return Object.assign({}, profile, payOverrides[profile.id] || {});
    });

    var currentAssignments = assignmentMap(next);
    Object.keys(carrierOverrides).forEach(function (driverId) {
      var carrierId = carrierOverrides[driverId];
      if (currentAssignments[driverId]) currentAssignments[driverId].carrierId = carrierId;
      else currentAssignments[driverId] = { driverId: driverId, carrierId: carrierId, relationship: "Edited in demo admin" };
    });
    next.driverCarrierAssignments = Object.keys(currentAssignments).map(function (driverId) {
      return currentAssignments[driverId];
    });

    return next;
  }

  function carrierForDriver(data, driver) {
    var assignments = assignmentMap(data);
    var assignment = assignments[driver.id] || {};
    var carrierId = driver.carrierId || assignment.carrierId;
    return byId(data.carrierProfiles || [])[carrierId] || null;
  }

  function documentsForDriver(data, driver, payProfile) {
    var typeKey = normalizeType((payProfile && payProfile.workerClassification) || driver.employmentType);
    var rules = (data.driverDocumentRules || {})[typeKey] || (data.driverDocumentRules || {}).employee || { label: "Driver document set", required: [] };
    var carrier = carrierForDriver(data, driver);
    var overlay = carrier ? ((data.carrierPolicyOverlays || {})[carrier.id] || []) : [];
    var required = (rules.required || []).concat(overlay);
    var status = (payProfile && payProfile.payStatus) || driver.readinessStatus || "Ready";
    var reviewCount = status === "Blocked" ? 2 : (status === "Review" || status === "At Risk" ? 1 : 0);
    return {
      label: rules.label,
      typeKey: typeKey,
      carrier: carrier,
      required: required,
      completeCount: Math.max(0, required.length - reviewCount),
      reviewCount: reviewCount,
      missing: required.slice(0, reviewCount)
    };
  }

  function saveDriverPayEdit(edit) {
    var overrides = read();
    overrides.drivers = overrides.drivers || {};
    overrides.driverPayProfiles = overrides.driverPayProfiles || {};
    overrides.driverCarrierAssignments = overrides.driverCarrierAssignments || {};

    var typeKey = normalizeType(edit.workerClassification);
    overrides.drivers[edit.driverId] = Object.assign({}, overrides.drivers[edit.driverId] || {}, {
      employmentType: classificationLabel(typeKey),
      carrierId: edit.carrierId
    });
    overrides.driverCarrierAssignments[edit.driverId] = edit.carrierId;
    overrides.driverPayProfiles[edit.profileId] = Object.assign({}, overrides.driverPayProfiles[edit.profileId] || {}, {
      workerClassification: classificationLabel(typeKey),
      payMethod: edit.payMethod,
      rateLabel: edit.rateLabel,
      payStatus: edit.payStatus
    });
    write(overrides);
  }

  function reset() {
    window.localStorage.removeItem(KEY);
  }

  window.BOFDemoState = {
    key: KEY,
    read: read,
    write: write,
    apply: apply,
    reset: reset,
    saveDriverPayEdit: saveDriverPayEdit,
    documentsForDriver: documentsForDriver,
    carrierForDriver: carrierForDriver,
    normalizeType: normalizeType,
    classificationLabel: classificationLabel
  };
})();
