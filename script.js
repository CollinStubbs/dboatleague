const regattaFiles = [
  "regattas/2025/2025-Chicago-IDBF-Results-race-data - 2025-Chicago-IDBF-Results-race-data.csv",
  "regattas/2025/2025_CDBC_2025-08-21_day1_races.csv",
  "regattas/2025/2025_CDBC_2025-08-22_day2_races_FIXED.csv",
  "regattas/2025/2025_CDBC_2025-08-23_day3_races.csv",
  "regattas/2025/2025_CDBC_2025-08-24_day4_races_FIXED.csv",
  "regattas/2025/2025-GWNC-Final-Results-race-data - 2025-GWNC-Final-Results-race-data.csv",
  "regattas/2025/2025-GWNS_Final-Results_race-data_rewritten - 2025-GWNS_Final-Results_race-data_rewritten.csv",
  "regattas/2025/2025-Sarasota-IDBF-Race-Results - 2025-Sarasota-IDBF-Race-Results.csv",
  "regattas/2025/2025-TIDBRF-Race-Results_extracted - 2025-TIDBRF-Race-Results_extracted.csv",
  "regattas/2025/2025_hamilton_waterfest_saturday_races_FIXED - 2025_hamilton_waterfest_saturday_races_FIXED.csv",
  "regattas/2025/2025_KCDBF_results_FIXED - 2025_KCDBF_results_FIXED.csv",
  "regattas/2025/2025_Mercer_DBF_results_FIXED - 2025_Mercer_DBF_results_FIXED.csv",
  "regattas/2025/2025_milton_races_FIXED - 2025_milton_races_FIXED.csv",
  "regattas/2025/2025_New_York_IDBF_results_FIXED - 2025_New_York_IDBF_results_FIXED.csv",
  "regattas/2025/2025_Orlando_DBF_results_FIXED - 2025_Orlando_DBF_results_FIXED.csv",
  "regattas/2025/2025_PACCC_Fri_extracted_cleaned.csv",
  "regattas/2025/2025_PACCC_Sat_extracted_cleaned.csv",
  "regattas/2025/2025_PACCC_Sun_extracted_cleaned.csv",
  "regattas/2025/2025_CONCORD_SAT_extracted_with_event_starttime_distance.csv",
  "regattas/2025/2025_CONCORD_SUN_extracted_with_event_starttime_distance.csv",
  "regattas/2025/USDBC_2025_sheet1_extracted_cleaned.csv",
  "regattas/2025/2025_pickering_saturday_extracted_fixed.csv",
  "regattas/2025/2025_pickering_sunday_extracted - 2025_pickering_sunday_extracted.csv",
  "regattas/2025/2025_welland_hope_floats_extracted_fixed - 2025_welland_hope_floats_extracted_fixed.csv",
  "regattas/2025/port_perry_2025_race_data_extracted - port_perry_2025_race_data_extracted.csv",
];

const tableBody = document.querySelector("#leaderboard tbody");
const headers = Array.from(document.querySelectorAll("#leaderboard thead th"));
const yearSelect = document.querySelector("#year-filter");
const regattaSelect = document.querySelector("#regatta-filter");
const divisionSelect = document.querySelector("#division-filter");
const minRacesSelect = document.querySelector("#min-races");
const minRacesValue = document.querySelector("#min-races-value");
const allDistancesToggle = document.querySelector("#all-distances");
const dataStatus = document.querySelector("#data-status");
const snapshotValue = document.querySelector("#snapshot-value");
const snapshotNote = document.querySelector("#snapshot-note");
const tableCaption = document.querySelector("#leaderboard caption");
const regattaLink = document.querySelector("#regatta-link");

let data = [];
let rawRows = [];
let availableYears = [];

const sortState = {
  key: "avg500",
  direction: "asc",
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") {
        i += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter((record) => record.some((cell) => cell.trim() !== ""));
}

function csvToObjects(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return [];
  }
  const headersRow = rows.shift().map((header) => header.trim());
  return rows.map((row) => {
    const obj = {};
    headersRow.forEach((header, index) => {
      obj[header] = row[index] ? row[index].trim() : "";
    });
    return obj;
  });
}

function parseTimeToSeconds(value) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || /[a-zA-Z]/.test(trimmed)) {
    return null;
  }
  const parts = trimmed.split(":");
  const numbers = parts.map((part) => Number.parseFloat(part));
  if (numbers.some((part) => Number.isNaN(part))) {
    return null;
  }
  if (numbers.length === 3) {
    return numbers[0] * 3600 + numbers[1] * 60 + numbers[2];
  }
  if (numbers.length === 2) {
    return numbers[0] * 60 + numbers[1];
  }
  if (numbers.length === 1) {
    return numbers[0];
  }
  return null;
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "--";
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds - mins * 60;
  const paddedSecs = secs.toFixed(1).padStart(4, "0");
  return `${mins}:${paddedSecs}`;
}

function formatSignedDuration(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "--";
  }
  if (seconds < 0) {
    return `-${formatDuration(Math.abs(seconds))}`;
  }
  return `+${formatDuration(seconds)}`;
}


function numericValue(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRegattaId(regattaId) {
  const raw = String(regattaId || "").trim();
  if (raw.startsWith("2025_CDBC_")) {
    return "2025_CDBC";
  }
  if (raw.startsWith("2025_CONCORD_")) {
    return "2025_CONCORD";
  }
  return raw;
}

function getYearFromRegattaId(regattaId) {
  const match = String(regattaId || "").match(/^(\d{4})/);
  return match ? match[1] : "";
}

function normalizeTeamName(name) {
  return String(name || "")
    .replace(/[-–—]/g, " ")
    .replace(/\s*[\[(][^\])]+[\])]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isExcludedPlace(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "DNF" || normalized === "DNS" || normalized === "NA" || normalized === "N/A";
}

function normalizeRow(row) {
  const place = numericValue(row.place);
  const excludedPlace = isExcludedPlace(row.place);
  const timeSeconds = parseTimeToSeconds(row.time);
  const distanceMeters = numericValue(row.distance_m);
  const regattaId = normalizeRegattaId(row.regatta_id);
  const raceId =
    row.race_id ||
    `${regattaId || "UNKNOWN"}-${row.race_no || "RACE"}-${row.date || ""}`;

  return {
    regattaId: regattaId || "UNKNOWN",
    raceId,
    event: row.event || "",
    round: row.round || "",
    team: normalizeTeamName(row.team_name),
    place,
    excludedPlace,
    timeSeconds,
    distanceMeters,
    hasResult: place !== null || timeSeconds !== null,
  };
}

function mostCommonLabel(counter) {
  let bestLabel = "";
  let bestCount = 0;
  Object.entries(counter).forEach(([label, count]) => {
    if (count > bestCount) {
      bestCount = count;
      bestLabel = label;
    }
  });
  return bestLabel || "Open";
}

function normalizeDivisionName(eventName) {
  const raw = String(eventName || "").trim();
  if (!raw) {
    return "Mixed";
  }
  const text = raw.toUpperCase();
  if (text.includes("BCP") || text.includes("BCS") || text.includes("CANCER") || text.includes("SURVIVOR")) {
    return "BCP";
  }
  if (text.includes("PARA")) {
    return "Para";
  }
  if (text.includes("SPECIAL NEEDS")) {
    return "Special Needs";
  }
  if (text.includes("UNIVERSITY")) {
    return "University";
  }
  if (text.includes("JUNIOR")) {
    return "Youth";
  }
  if (text.includes("YOUTH")) {
    return "Youth";
  }
  if (text.includes("REC")) {
    if (text.includes("WOMEN")) {
      return "Women";
    }
    if (text.includes("MIXED")) {
      return "Mixed";
    }
    if (text.includes("OPEN")) {
      return "Open";
    }
    return "Mixed";
  }
  if (
    text.includes("COMMUNITY") ||
    text.includes("NON PROFIT") ||
    text.includes("NOT-FOR-PROFIT")
  ) {
    if (text.includes("WOMEN")) {
      return "Women";
    }
    if (text.includes("MIXED")) {
      return "Mixed";
    }
    if (text.includes("OPEN")) {
      return "Open";
    }
    return "Mixed";
  }
  if (text.includes("PREMIER")) {
    if (text.includes("WOMEN")) {
      return "Women";
    }
    if (text.includes("MIXED")) {
      return "Mixed";
    }
    if (text.includes("OPEN")) {
      return "Open";
    }
    return "Mixed";
  }
  if (text.includes("SPORT")) {
    if (text.includes("WOMEN")) {
      return "Women";
    }
    if (text.includes("MIXED")) {
      return "Mixed";
    }
    if (text.includes("OPEN")) {
      return "Open";
    }
  }
  if (
    text.includes("SENIOR WOMEN") ||
    text.includes("SENIOR WOMEN'S") ||
    text.includes("SENIOR WOMENS") ||
    text.includes("SR WOMEN")
  ) {
    return "Women";
  }
  if (text.includes("SPORT OPEN")) {
    return "Open";
  }
  if (text.includes("WOMEN")) {
    return "Women";
  }
  if (text.includes("MIXED")) {
    return "Mixed";
  }
  if (text.includes("OPEN")) {
    return "Open";
  }
  return "Mixed";
}

function buildLeaderboard(rows) {
  const teams = new Map();

  rows.forEach((row) => {
    if (!row.team) {
      return;
    }
    if (row.excludedPlace) {
      return;
    }
    const entry = teams.get(row.team) || {
      team: row.team,
      divisionCounts: {},
      hasBcpDivision: false,
      timeTotals: {
        200: 0,
        500: 0,
        2000: 0,
      },
      timeCounts: {
        200: 0,
        500: 0,
        2000: 0,
      },
      sandbagTotals: {
        qualifying: 0,
        finals: 0,
      },
      sandbagCounts: {
        qualifying: 0,
        finals: 0,
      },
      races: 0,
    };

    if (row.timeSeconds !== null) {
      entry.races += 1;
    }

    if (row.timeSeconds !== null && row.distanceMeters !== null) {
      if (row.timeSeconds <= 0) {
        return;
      }
      const distanceKey = Math.round(row.distanceMeters).toString();
      if (
        distanceKey === "500" &&
        row.timeSeconds > 4 * 60 + 30
      ) {
        return;
      }
      if (
        distanceKey === "200" &&
        row.timeSeconds > 2 * 60 + 30
      ) {
        return;
      }
      if (
        distanceKey === "2000" &&
        row.timeSeconds > 15 * 60
      ) {
        return;
      }
      if (Object.prototype.hasOwnProperty.call(entry.timeTotals, distanceKey)) {
        entry.timeTotals[distanceKey] += row.timeSeconds;
        entry.timeCounts[distanceKey] += 1;
      }

      if (distanceKey === "500") {
        const round = (row.round || "").toLowerCase();
        const isFinal =
          (round.includes("cup") || round.includes("final") || round.includes("champ")) && !round.includes("semi");
        if (isFinal) {
          entry.sandbagTotals.finals += row.timeSeconds;
          entry.sandbagCounts.finals += 1;
        } else {
          entry.sandbagTotals.qualifying += row.timeSeconds;
          entry.sandbagCounts.qualifying += 1;
        }
      }
    }

    if (row.event) {
      if (
        row.raceId !== "2025_HAMDBF-41" &&
        row.raceId !== "2025_Mercer_DBF_R43" &&
        row.raceId !== "2025_Mercer_DBF_R46"
      ) {
        const normalizedDivision = normalizeDivisionName(row.event);
        entry.divisionCounts[normalizedDivision] =
          (entry.divisionCounts[normalizedDivision] || 0) + 1;
        if (normalizedDivision === "BCP") {
          entry.hasBcpDivision = true;
        }
      }
    }

    teams.set(row.team, entry);
  });

  const leaderboard = Array.from(teams.values()).map((entry) => {
    const avg200 =
      entry.timeCounts["200"] > 0
        ? entry.timeTotals["200"] / entry.timeCounts["200"]
        : null;
    const avg500 =
      entry.timeCounts["500"] > 0
        ? entry.timeTotals["500"] / entry.timeCounts["500"]
        : null;
    const avg2000 =
      entry.timeCounts["2000"] > 0
        ? entry.timeTotals["2000"] / entry.timeCounts["2000"]
        : null;
    const qualifyingAvg =
      entry.sandbagCounts.qualifying > 0
        ? entry.sandbagTotals.qualifying / entry.sandbagCounts.qualifying
        : null;
    const finalsAvg =
      entry.sandbagCounts.finals > 0
        ? entry.sandbagTotals.finals / entry.sandbagCounts.finals
        : null;
    const sandbag =
      qualifyingAvg !== null && finalsAvg !== null ? qualifyingAvg - finalsAvg : null;

    const division = entry.hasBcpDivision
      ? "BCP"
      : mostCommonLabel(entry.divisionCounts);

    return {
      rank: 0,
      team: entry.team,
      division,
      races: entry.races,
      avg200,
      avg500,
      avg2000,
      hasAllDistances: avg200 !== null && avg500 !== null && avg2000 !== null,
      sandbag,
      status: "watch",
    };
  });

  leaderboard.sort((a, b) => {
    if (a.avg500 !== null && b.avg500 !== null) {
      return a.avg500 - b.avg500;
    }
    if (a.avg500 !== null) {
      return -1;
    }
    if (b.avg500 !== null) {
      return 1;
    }
    return a.team.localeCompare(b.team);
  });

  return leaderboard;
}

function formatRow(entry) {
  const statusLabel =
    entry.status === "qualified"
      ? `<span class="badge">Qualified</span>`
      : `<span class="badge watch">Watch</span>`;
  const teamUrl = `team.html?team=${encodeURIComponent(entry.team)}`;
  const sandbagLabel =
    entry.sandbag === null
      ? "--"
      : formatSignedDuration(entry.sandbag);

  return `
    <tr>
      <td>${entry.rank}</td>
      <td><a class="team-link" href="${teamUrl}">${entry.team}</a></td>
      <td>${entry.division}</td>
      <td>${formatDuration(entry.avg500)}</td>
      <td>${formatDuration(entry.avg200)}</td>
      <td>${formatDuration(entry.avg2000)}</td>
      <td>${sandbagLabel}</td>
    </tr>
  `;
}

function renderTable(rows) {
  tableBody.innerHTML = rows.map(formatRow).join("");
}

function compareValues(a, b, key, direction) {
  const valueA = a[key];
  const valueB = b[key];

  if (valueA === null && valueB === null) {
    return 0;
  }
  if (valueA === null) {
    return 1;
  }
  if (valueB === null) {
    return -1;
  }

  if (typeof valueA === "number" && typeof valueB === "number") {
    return direction === "desc" ? valueB - valueA : valueA - valueB;
  }

  const comparison = String(valueA).localeCompare(String(valueB));
  return direction === "desc" ? -comparison : comparison;
}

function sortData(key, direction) {
  const sorted = [...data].sort((a, b) => compareValues(a, b, key, direction));
  sorted.forEach((entry, index) => {
    entry.rank = index + 1;
    entry.status = index < 6 ? "qualified" : "watch";
  });
  renderTable(sorted);
}

function updateSortIndicators(activeKey, direction) {
  headers.forEach((header) => {
    const isActive = header.dataset.key === activeKey;
    header.setAttribute(
      "aria-sort",
      isActive ? (direction === "asc" ? "ascending" : "descending") : "none"
    );
  });
}

headers.forEach((header) => {
  header.addEventListener("click", () => {
    const key = header.dataset.key;
    const isSameKey = sortState.key === key;
    sortState.direction = isSameKey && sortState.direction === "asc" ? "desc" : "asc";
    sortState.key = key;

    updateSortIndicators(sortState.key, sortState.direction);
    sortData(sortState.key, sortState.direction);
  });
});

function setData(newData) {
  data = newData;
  sortData(sortState.key, sortState.direction);
}

function formatRegattaName(regattaId) {
  const cleaned = String(regattaId || "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b(results|final)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) {
    return "";
  }
  const parts = cleaned.split(" ");
  const yearIndex = parts.findIndex((part) => /^\d{4}$/.test(part));
  let year = "";
  if (yearIndex >= 0) {
    year = parts.splice(yearIndex, 1)[0];
  }
  const name = parts.join(" ").trim();
  return `${year || "YYYY"} ${name}`.trim().toUpperCase();
}

function updateRegattaOptions(regattaIds) {
  regattaSelect.innerHTML = '<option value="ALL">All regattas</option>';
  const sortedIds = [...regattaIds].sort();
  sortedIds.forEach((regattaId) => {
    const option = document.createElement("option");
    option.value = regattaId;
    option.textContent = formatRegattaName(regattaId);
    regattaSelect.appendChild(option);
  });
}

function updateYearOptions(years) {
  yearSelect.innerHTML = "";
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });
}

function filterRowsByYear(rows) {
  const selectedYear = yearSelect.value;
  return selectedYear
    ? rows.filter((row) => getYearFromRegattaId(row.regattaId) === selectedYear)
    : rows;
}

function updateDivisionOptions(divisions) {
  divisionSelect.innerHTML = '<option value="ALL">All divisions</option>';
  const sortedDivisions = [...divisions].sort();
  sortedDivisions.forEach((divisionName) => {
    const option = document.createElement("option");
    option.value = divisionName;
    option.textContent = divisionName;
    divisionSelect.appendChild(option);
  });
}

function applyRegattaFilter(regattaId) {
  const yearRows = filterRowsByYear(rawRows);
  const filtered =
    regattaId === "ALL"
      ? yearRows
      : yearRows.filter((row) => row.regattaId === regattaId);
  const leaderboard = buildLeaderboard(filtered);
  applyDivisionFilter(leaderboard);
  tableCaption.textContent =
    regattaId === "ALL"
      ? "Standings compiled from regatta CSV race results."
      : `Standings for ${formatRegattaName(regattaId)}.`;
  snapshotNote.textContent =
    regattaId === "ALL" ? "Across all loaded regattas" : "Filtered by regatta";

  if (regattaId === "ALL") {
    regattaLink.setAttribute("aria-disabled", "true");
    regattaLink.textContent = "View regatta summary";
    regattaLink.href = "#";
  } else {
    regattaLink.removeAttribute("aria-disabled");
    regattaLink.textContent = `View ${formatRegattaName(regattaId)}`;
    regattaLink.href = `regatta.html?regatta=${encodeURIComponent(regattaId)}`;
  }
}

yearSelect.addEventListener("change", () => {
  const yearRows = filterRowsByYear(rawRows);
  const regattaIds = new Set(yearRows.map((row) => row.regattaId));
  updateRegattaOptions(regattaIds);
  const divisions = new Set(
    yearRows
      .map((row) => normalizeDivisionName(row.event))
      .filter((divisionName) => divisionName)
  );
  updateDivisionOptions(divisions);
  applyRegattaFilter("ALL");
});

regattaSelect.addEventListener("change", (event) => {
  applyRegattaFilter(event.target.value);
});

divisionSelect.addEventListener("change", () => {
  applyRegattaFilter(regattaSelect.value);
});

function applyDivisionFilter(leaderboard) {
  const selectedDivision = divisionSelect.value;
  const filtered =
    selectedDivision === "ALL"
      ? leaderboard
      : leaderboard.filter((entry) => entry.division === selectedDivision);
  applyDistanceFilter(filtered);
}

function applyRaceFilter(leaderboard) {
  const minRaces = Number.parseInt(minRacesSelect.value, 10) || 0;
  const filtered = leaderboard.filter((entry) => entry.races >= minRaces);
  setData(filtered);
}

function applyDistanceFilter(leaderboard) {
  const filtered = allDistancesToggle.checked
    ? leaderboard.filter((entry) => entry.hasAllDistances)
    : leaderboard;
  applyRaceFilter(filtered);
}

function updateMinRacesLabel() {
  const minRaces = Number.parseInt(minRacesSelect.value, 10) || 0;
  minRacesValue.textContent = `${minRaces}+`;
}

minRacesSelect.addEventListener("input", () => {
  updateMinRacesLabel();
  applyRegattaFilter(regattaSelect.value);
});

allDistancesToggle.addEventListener("change", () => {
  applyRegattaFilter(regattaSelect.value);
});

async function loadRegattas() {
  const results = await Promise.all(
    regattaFiles.map(async (path) => {
      const response = await fetch(encodeURI(path), { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load ${path}`);
      }
      const text = await response.text();
      return csvToObjects(text).map(normalizeRow);
    })
  );

  rawRows = results.flat();
  availableYears = Array.from(
    new Set(rawRows.map((row) => getYearFromRegattaId(row.regattaId)).filter(Boolean))
  ).sort();
  updateYearOptions(availableYears);
  if (availableYears.length > 0) {
    yearSelect.value = availableYears[0];
  }
  const yearRows = filterRowsByYear(rawRows);
  const regattaIds = new Set(yearRows.map((row) => row.regattaId));
  const divisions = new Set(
    yearRows
      .map((row) => normalizeDivisionName(row.event))
      .filter((divisionName) => divisionName)
  );
  updateRegattaOptions(regattaIds);
  updateDivisionOptions(divisions);
  applyRegattaFilter("ALL");

  dataStatus.textContent = `Data source: ${regattaIds.size} regattas, ${rawRows.length} results`;
  snapshotValue.textContent = regattaIds.size.toString();
  snapshotNote.textContent = `${rawRows.length} race entries loaded`;
}

updateSortIndicators(sortState.key, sortState.direction);
updateMinRacesLabel();

loadRegattas().catch((error) => {
  dataStatus.textContent = "Data source: failed to load regatta CSVs";
  snapshotValue.textContent = "--";
  snapshotNote.textContent = "Check file paths and local server";
  console.error(error);
});

window.NADBL = {
  setData,
};



