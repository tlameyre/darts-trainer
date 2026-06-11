import { ref, computed } from "vue";

export function formatZoneLabel(zone) {
  if (!zone) return "";
  if (zone.sector === null) {
    if (zone.type === "B") return "Bull (50)";
    if (zone.type === "SB") return "Outer (25)";
    return "Bull (tout)";
  }
  const types = { S: "Simple", D: "Double", T: "Triple", A: "" };
  return `${types[zone.type]} ${zone.sector}`.trim();
}

export function formatZonesLabel(zones) {
  if (!zones || zones.length === 0) return "";
  return zones.map(formatZoneLabel).join(" + ");
}

function zonesMatch(z1, z2) {
  return z1?.sector === z2?.sector && z1?.type === z2?.type;
}

function zonesArrayMatch(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return a.every((z, i) => zonesMatch(z, b[i]));
}

function isHitSingle(dart, zone) {
  if (!zone || dart.type === "miss") return false;
  if (zone.sector === null) {
    if (zone.type === "AB") return dart.type === "bull";
    return (
      dart.type === "bull" &&
      (zone.type === "B" ? dart.pts === 50 : dart.pts === 25)
    );
  }
  if (zone.type === "A")
    return (
      ["single", "double", "triple"].includes(dart.type) &&
      dart.sector === zone.sector
    );
  const typeMap = { S: "single", D: "double", T: "triple" };
  return dart.type === typeMap[zone.type] && dart.sector === zone.sector;
}

function isHit(dart, zones) {
  if (!zones || dart.type === "miss") return false;
  const arr = Array.isArray(zones) ? zones : [zones];
  return arr.some(z => isHitSingle(dart, z));
}

export function useWarmup({ duration, zones: initialZones }) {
  const darts = ref([]);
  const currentZones = ref(initialZones.map(z => ({ ...z })));
  const periods = ref([]);
  const timeLeft = ref(duration !== null ? duration * 60 : null);
  const gameOver = ref(false);
  let _timer = null;

  const timeDisplay = computed(() => {
    if (timeLeft.value === null) return "∞";
    const m = Math.floor(timeLeft.value / 60);
    const s = timeLeft.value % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  });

  const isUnlimited = computed(() => timeLeft.value === null);

  const isUrgent = computed(
    () => timeLeft.value !== null && timeLeft.value <= 30 && timeLeft.value > 0,
  );

  const currentZoneStats = computed(() => {
    const zd = darts.value.filter(d =>
      zonesArrayMatch(d.zones ?? [d.zone], currentZones.value)
    );
    const hits = zd.filter(d => isHit(d, currentZones.value)).length;
    return {
      total: zd.length,
      hits,
      accuracy: zd.length > 0 ? Math.round((hits / zd.length) * 100) : 0,
    };
  });

  const zoneRecapStats = computed(() => {
    const seen = [];
    periods.value.forEach((p) => {
      if (!seen.find(zs => zonesArrayMatch(zs, p.zones))) seen.push(p.zones);
    });
    return seen.map((zones) => {
      const zd = darts.value.filter(d =>
        zonesArrayMatch(d.zones ?? [d.zone], zones)
      );
      const hits = zd.filter(d => isHit(d, zones)).length;
      const durationMs = periods.value
        .filter(p => zonesArrayMatch(p.zones, zones))
        .reduce((sum, p) => sum + ((p.endTs ?? Date.now()) - p.startTs), 0);
      return {
        zones,
        total: zd.length,
        hits,
        accuracy: zd.length > 0 ? Math.round((hits / zd.length) * 100) : 0,
        durationMs,
      };
    });
  });

  const sessionStats = computed(() => {
    const total = darts.value.length;
    const hits = darts.value.filter(d => isHit(d, d.zones ?? [d.zone])).length;
    return {
      total,
      hits,
      accuracy: total > 0 ? Math.round((hits / total) * 100) : 0,
    };
  });

  function recordDart(dart) {
    if (gameOver.value) return;
    darts.value.push({
      ...dart,
      zones: currentZones.value.map(z => ({ ...z })),
      ts: Date.now(),
    });
  }

  function undoLast() {
    if (gameOver.value || darts.value.length === 0) return;
    darts.value.pop();
  }

  function changeZones(newZones) {
    const now = Date.now();
    if (periods.value.length > 0) {
      const last = periods.value[periods.value.length - 1];
      periods.value[periods.value.length - 1] = { ...last, endTs: now };
    }
    periods.value.push({ zones: newZones.map(z => ({ ...z })), startTs: now, endTs: null });
    currentZones.value = newZones.map(z => ({ ...z }));
  }

  function _startInterval() {
    if (timeLeft.value === null || gameOver.value) return;
    clearInterval(_timer);
    _timer = setInterval(() => {
      timeLeft.value--;
      if (timeLeft.value <= 0) {
        clearInterval(_timer);
        _closePeriod();
        gameOver.value = true;
      }
    }, 1000);
  }

  function startTimer() {
    const now = Date.now();
    periods.value.push({
      zones: currentZones.value.map(z => ({ ...z })),
      startTs: now,
      endTs: null,
    });
    _startInterval();
  }

  function pauseTimer() {
    clearInterval(_timer);
  }

  function resumeTimer() {
    _startInterval();
  }

  function endSession() {
    clearInterval(_timer);
    _closePeriod();
    gameOver.value = true;
  }

  function _closePeriod() {
    const last = periods.value[periods.value.length - 1];
    if (last && !last.endTs) {
      periods.value[periods.value.length - 1] = { ...last, endTs: Date.now() };
    }
  }

  function cleanup() {
    clearInterval(_timer);
  }

  const totalDurationMs = computed(() =>
    periods.value.reduce((sum, p) => sum + ((p.endTs ?? Date.now()) - p.startTs), 0)
  );

  return {
    darts,
    currentZones,
    gameOver,
    timeDisplay,
    isUnlimited,
    isUrgent,
    currentZoneStats,
    zoneRecapStats,
    sessionStats,
    totalDurationMs,
    recordDart,
    undoLast,
    changeZones,
    startTimer,
    pauseTimer,
    resumeTimer,
    endSession,
    cleanup,
  };
}
