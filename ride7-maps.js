(function () {
  const PLACEHOLDER_KEY = "COLE_SUA_GOOGLE_MAPS_API_KEY_AQUI";
  const defaultConfig = {
    apiKey: "",
    defaultCenter: { lat: -30.0346, lng: -51.2177 },
    defaultZoom: 14,
  };

  const config = Object.assign(defaultConfig, window.RIDE7_MAPS_CONFIG || {});
  const mapStates = new Map();
  let loadPromise;

  function hasValidKey() {
    return config.apiKey && config.apiKey !== PLACEHOLDER_KEY;
  }

  function loadGoogleMaps() {
    if (!hasValidKey()) {
      return Promise.reject(new Error("Google Maps API key not configured"));
    }

    if (window.google?.maps?.importLibrary) {
      return Promise.resolve(window.google.maps);
    }

    if (loadPromise) {
      return loadPromise;
    }

    loadPromise = new Promise((resolve, reject) => {
      window.__ride7MapsLoaded = () => resolve(window.google.maps);

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        config.apiKey,
      )}&v=weekly&libraries=marker&callback=__ride7MapsLoaded&loading=async`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error("Failed to load Google Maps JavaScript API"));
      document.head.appendChild(script);
    });

    return loadPromise;
  }

  function createMarkerElement(label, variant) {
    const marker = document.createElement("div");
    marker.className = `ride7-map-marker ${variant}`;
    if (variant === "driver") {
      marker.innerHTML = `<img src="./assets/ride7-car-side.svg" alt="${label}" />`;
    } else {
      marker.textContent = label;
    }
    return marker;
  }

  function offsetPosition(position, latOffset, lngOffset) {
    return {
      lat: position.lat + latOffset,
      lng: position.lng + lngOffset,
    };
  }

  function moveToward(current, target, ratio) {
    return {
      lat: current.lat + (target.lat - current.lat) * ratio,
      lng: current.lng + (target.lng - current.lng) * ratio,
    };
  }

  function fallbackPoint(index, role) {
    const clientPoints = [
      { x: 18, y: 33, dx: 0.42, dy: 0.22 },
      { x: 66, y: 28, dx: -0.34, dy: 0.26 },
      { x: 45, y: 55, dx: 0.28, dy: -0.3 },
      { x: 78, y: 49, dx: -0.26, dy: -0.2 },
    ];
    const driverPoints = [
      { x: 47, y: 48, dx: 0.28, dy: -0.22 },
      { x: 32, y: 36, dx: 0.34, dy: 0.18 },
      { x: 69, y: 41, dx: -0.24, dy: 0.25 },
    ];
    return (role === "driver" ? driverPoints : clientPoints)[index];
  }

  function updateFallbackVehicle(vehicle, state) {
    if (state.mode === "to-pickup" && vehicle.primary) {
      vehicle.x += (50 - vehicle.x) * 0.08;
      vehicle.y += (42 - vehicle.y) * 0.08;
    } else if (state.mode === "to-destination" && vehicle.primary) {
      vehicle.x += (72 - vehicle.x) * 0.055;
      vehicle.y += (28 - vehicle.y) * 0.055;
    } else {
      vehicle.x += vehicle.dx;
      vehicle.y += vehicle.dy;

      if (vehicle.x < 12 || vehicle.x > 84) {
        vehicle.dx *= -1;
      }

      if (vehicle.y < 24 || vehicle.y > 62) {
        vehicle.dy *= -1;
      }
    }

    vehicle.el.style.left = `${vehicle.x}%`;
    vehicle.el.style.top = `${vehicle.y}%`;
    vehicle.el.style.transform = `translate(-50%, -50%) rotate(${vehicle.dx > 0 ? 8 : -8}deg)`;
  }

  function initializeFallbackRealtime(shell, role) {
    let layer = shell.querySelector(".realtime-layer");

    if (!layer) {
      layer = document.createElement("div");
      layer.className = "realtime-layer";
      shell.appendChild(layer);
    }

    const state = {
      role,
      mode: "roaming",
      vehicles: [],
      interval: null,
    };

    const count = role === "client" ? 4 : 3;
    for (let index = 0; index < count; index += 1) {
      const point = fallbackPoint(index, role);
      const vehicle = document.createElement("span");
      vehicle.className = `moving-vehicle ${index === 0 ? "primary" : ""}`;
      vehicle.innerHTML = `<img src="./assets/ride7-car-side.svg" alt="Veiculo RIDE7 em movimento" />`;
      vehicle.style.left = `${point.x}%`;
      vehicle.style.top = `${point.y}%`;
      layer.appendChild(vehicle);

      state.vehicles.push({
        el: vehicle,
        x: point.x,
        y: point.y,
        dx: point.dx,
        dy: point.dy,
        primary: index === 0,
      });
    }

    mapStates.set(role, state);
    state.interval = window.setInterval(() => {
      state.vehicles.forEach((vehicle) => updateFallbackVehicle(vehicle, state));
    }, 900);

    window.dispatchEvent(
      new CustomEvent("ride7:realtime-ready", {
        detail: { role, mode: "fallback" },
      }),
    );
  }

  function updateGoogleVehicles(state) {
    state.vehicles.forEach((vehicle) => {
      if (state.mode === "to-pickup" && vehicle.primary) {
        vehicle.position = moveToward(vehicle.position, state.pickupPosition, 0.09);
      } else if (state.mode === "to-destination" && vehicle.primary) {
        vehicle.position = moveToward(vehicle.position, state.destinationPosition, 0.06);
      } else {
        vehicle.position = offsetPosition(vehicle.position, vehicle.dLat, vehicle.dLng);
        const distanceLat = Math.abs(vehicle.position.lat - state.center.lat);
        const distanceLng = Math.abs(vehicle.position.lng - state.center.lng);

        if (distanceLat > 0.007) {
          vehicle.dLat *= -1;
        }

        if (distanceLng > 0.007) {
          vehicle.dLng *= -1;
        }
      }

      vehicle.marker.position = vehicle.position;
    });
  }

  async function initializeGoogleRealtime(container, shell, role) {
    await loadGoogleMaps();
    const { Map: GoogleMap } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    shell.classList.add("using-google-map");

    const map = new GoogleMap(container, {
      center: config.defaultCenter,
      zoom: config.defaultZoom,
      disableDefaultUI: true,
      clickableIcons: false,
      gestureHandling: "greedy",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#202520" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#dfe8e3" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#202520" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#384038" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#1b2d3f" }] },
      ],
    });

    const state = {
      role,
      mode: "roaming",
      center: config.defaultCenter,
      pickupPosition: offsetPosition(config.defaultCenter, 0.0028, -0.0024),
      destinationPosition: offsetPosition(config.defaultCenter, 0.007, 0.005),
      vehicles: [],
      interval: null,
      currentMarker: null,
      map,
    };

    mapStates.set(role, state);

    function setCurrentPosition(basePosition) {
      state.center = basePosition;
      state.pickupPosition = offsetPosition(basePosition, 0.0028, -0.0024);
      state.destinationPosition = offsetPosition(basePosition, 0.007, 0.005);
      map.setCenter(basePosition);

      if (!state.currentMarker) {
        state.currentMarker = new AdvancedMarkerElement({
          map,
          position: basePosition,
          title: role === "driver" ? "Localizacao do motorista" : "Sua localizacao",
          content: createMarkerElement(role === "driver" ? "D" : "EU", role),
        });
      } else {
        state.currentMarker.position = basePosition;
      }

      if (!state.vehicles.length) {
        const seeds =
          role === "client"
            ? [
                { lat: 0.004, lng: 0.003, dLat: 0.00012, dLng: -0.00008 },
                { lat: -0.003, lng: 0.004, dLat: -0.00008, dLng: -0.0001 },
                { lat: 0.002, lng: -0.004, dLat: 0.0001, dLng: 0.00009 },
                { lat: -0.004, lng: -0.002, dLat: 0.00009, dLng: -0.00007 },
              ]
            : [
                { lat: 0.003, lng: -0.002, dLat: 0.0001, dLng: 0.00008 },
                { lat: 0.007, lng: 0.005, dLat: -0.00008, dLng: -0.00009 },
              ];

        seeds.forEach((seed, index) => {
          const vehiclePosition = offsetPosition(basePosition, seed.lat, seed.lng);
          const marker = new AdvancedMarkerElement({
            map,
            position: vehiclePosition,
            title: role === "client" ? `Motorista RIDE7 ${index + 1}` : index === 0 ? "Embarque" : "Destino",
            content: createMarkerElement(role === "client" ? "R7" : index === 0 ? "P" : "D", role === "client" ? "driver" : index === 0 ? "pickup" : "dropoff"),
          });

          state.vehicles.push({
            marker,
            position: vehiclePosition,
            dLat: seed.dLat,
            dLng: seed.dLng,
            primary: index === 0,
          });
        });
      }

      if (!state.interval) {
        state.interval = window.setInterval(() => updateGoogleVehicles(state), 900);
      }

      window.dispatchEvent(
        new CustomEvent("ride7:location-updated", {
          detail: { role, position: basePosition },
        }),
      );
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        (location) => {
          setCurrentPosition({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        },
        () => {
          setCurrentPosition(config.defaultCenter);
          window.dispatchEvent(
            new CustomEvent("ride7:map-fallback", {
              detail: { role, reason: "geolocation-denied" },
            }),
          );
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 10000,
        },
      );
    } else {
      setCurrentPosition(config.defaultCenter);
    }

    window.dispatchEvent(
      new CustomEvent("ride7:realtime-ready", {
        detail: { role, mode: "google" },
      }),
    );
  }

  async function initializeRide7Map(containerId, role) {
    const container = document.querySelector(`#${containerId}`);
    const shell = container?.closest(".client-map, .driver-map");

    if (!container || !shell) {
      return;
    }

    if (!hasValidKey()) {
      shell.classList.add("using-map-fallback");
      initializeFallbackRealtime(shell, role);
      window.dispatchEvent(
        new CustomEvent("ride7:map-fallback", {
          detail: { role, reason: "missing-api-key" },
        }),
      );
      return;
    }

    try {
      await initializeGoogleRealtime(container, shell, role);
    } catch (error) {
      shell.classList.add("using-map-fallback");
      initializeFallbackRealtime(shell, role);
      window.dispatchEvent(
        new CustomEvent("ride7:map-fallback", {
          detail: { role, reason: error.message },
        }),
      );
    }
  }

  function setRealtimeMode(role, mode) {
    const state = mapStates.get(role);

    if (!state) {
      return;
    }

    state.mode = mode || "roaming";
  }

  window.addEventListener("ride7:realtime-mode", (event) => {
    setRealtimeMode(event.detail.role, event.detail.mode);
  });

  window.Ride7Maps = {
    initializeRide7Map,
    setRealtimeMode,
    hasValidKey,
  };
})();
