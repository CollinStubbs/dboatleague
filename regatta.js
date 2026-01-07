const regattaFiles = [
  "regattas/Good Copies/2025-Chicago-IDBF-Results-race-data - 2025-Chicago-IDBF-Results-race-data.csv",
  "regattas/Good Copies/2025_CDBC_2025-08-21_day1_races.csv",
  "regattas/Good Copies/2025_CDBC_2025-08-22_day2_races_FIXED.csv",
  "regattas/Good Copies/2025_CDBC_2025-08-23_day3_races.csv",
  "regattas/Good Copies/2025_CDBC_2025-08-24_day4_races_FIXED.csv",
  "regattas/Good Copies/2025-GWNC-Final-Results-race-data - 2025-GWNC-Final-Results-race-data.csv",
  "regattas/Good Copies/2025-GWNS_Final-Results_race-data_rewritten - 2025-GWNS_Final-Results_race-data_rewritten.csv",
  "regattas/Good Copies/2025-Sarasota-IDBF-Race-Results - 2025-Sarasota-IDBF-Race-Results.csv",
  "regattas/Good Copies/2025-TIDBRF-Race-Results_extracted - 2025-TIDBRF-Race-Results_extracted.csv",
  "regattas/Good Copies/2025_hamilton_waterfest_saturday_races_FIXED - 2025_hamilton_waterfest_saturday_races_FIXED.csv",
  "regattas/Good Copies/2025_KCDBF_results_FIXED - 2025_KCDBF_results_FIXED.csv",
  "regattas/Good Copies/2025_Mercer_DBF_results_FIXED - 2025_Mercer_DBF_results_FIXED.csv",
  "regattas/Good Copies/2025_milton_races_FIXED - 2025_milton_races_FIXED.csv",
  "regattas/Good Copies/2025_New_York_IDBF_results_FIXED - 2025_New_York_IDBF_results_FIXED.csv",
  "regattas/Good Copies/2025_Orlando_DBF_results_FIXED - 2025_Orlando_DBF_results_FIXED.csv",
  "regattas/Good Copies/2025_PACCC_Fri_extracted_cleaned.csv",
  "regattas/Good Copies/2025_PACCC_Sat_extracted_cleaned.csv",
  "regattas/Good Copies/2025_PACCC_Sun_extracted_cleaned.csv",
  "regattas/Good Copies/2025_CONCORD_SAT_extracted_with_event_starttime_distance.csv",
  "regattas/Good Copies/2025_CONCORD_SUN_extracted_with_event_starttime_distance.csv",
  "regattas/Good Copies/USDBC_2025_sheet1_extracted_cleaned.csv",
  "regattas/Good Copies/2025_pickering_saturday_extracted_fixed.csv",
  "regattas/Good Copies/2025_pickering_sunday_extracted - 2025_pickering_sunday_extracted.csv",
  "regattas/Good Copies/2025_welland_hope_floats_extracted_fixed - 2025_welland_hope_floats_extracted_fixed.csv",
  "regattas/Good Copies/port_perry_2025_race_data_extracted - port_perry_2025_race_data_extracted.csv",
];

const regattaNameEl = document.querySelector("#regatta-name");
const regattaRacesEl = document.querySelector("#regatta-races");
const regattaTeamsEl = document.querySelector("#regatta-teams");
const regattaEntriesEl = document.querySelector("#regatta-entries");
const regattaStatusEl = document.querySelector("#regatta-status");
const regattaAvg200El = document.querySelector("#regatta-avg-200");
const regattaAvg500El = document.querySelector("#regatta-avg-500");
const regattaAvg2000El = document.querySelector("#regatta-avg-2000");
const regattaBest200El = document.querySelector("#regatta-best-200");
const regattaBest500El = document.querySelector("#regatta-best-500");
const regattaBest2000El = document.querySelector("#regatta-best-2000");
const tableBody = document.querySelector("#regatta-results-body");

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

function formatDurationFromSeconds(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "--";
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds - mins * 60;
  const paddedSecs = secs.toFixed(1).padStart(4, "0");
  return `${mins}:${paddedSecs}`;
}

function formatCell(value) {
  return value && value.length > 0 ? value : "--";
}

function formatDistance(value) {
  if (!value) {
    return "--";
  }
  return `${value}m`;
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

function formatRegattaName(regattaId) {
  return regattaId ? regattaId.replace(/_/g, " ").replace(/\s+/g, " ").trim() : "Regatta";
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


function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const dateA = a.date || "";
    const dateB = b.date || "";
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    const raceA = Number.parseInt(a.race_no, 10);
    const raceB = Number.parseInt(b.race_no, 10);
    if (!Number.isNaN(raceA) && !Number.isNaN(raceB)) {
      return raceA - raceB;
    }
    return (a.race_id || "").localeCompare(b.race_id || "");
  });
}

function renderRows(rows) {
  tableBody.innerHTML = rows
    .map((row) => {
      return `
        <tr>
          <td>${formatCell(row.date)}</td>
          <td>${formatCell(row.start_time)}</td>
          <td>${formatCell(row.race_no)}</td>
          <td>${formatCell(row.event)}</td>
          <td>${formatCell(row.round)}</td>
          <td>${formatDistance(row.distance_m)}</td>
          <td>${formatCell(row.lane)}</td>
          <td>${formatCell(normalizeTeamName(row.team_name))}</td>
          <td>${formatCell(row.place)}</td>
          <td>${formatCell(row.time)}</td>
        </tr>
      `;
    })
    .join("");
}

function updateAnalytics(regattaRows) {
  const timeTotals = {
    200: 0,
    500: 0,
    2000: 0,
  };
  const timeCounts = {
    200: 0,
    500: 0,
    2000: 0,
  };
  const bestTimes = {
    200: null,
    500: null,
    2000: null,
  };

  regattaRows.forEach((row) => {
    if (isExcludedPlace(row.place)) {
      return;
    }
    const timeSeconds = parseTimeToSeconds(row.time);
    const distanceMeters = Number.parseInt(row.distance_m, 10);
    if (timeSeconds === null || Number.isNaN(distanceMeters)) {
      return;
    }
    if (timeSeconds <= 0) {
      return;
    }
    const distanceKey = Math.round(distanceMeters).toString();
    if (distanceKey === "500" && timeSeconds > 4 * 60 + 30) {
      return;
    }
    if (distanceKey === "200" && timeSeconds > 2 * 60 + 30) {
      return;
    }
    if (distanceKey === "2000" && timeSeconds > 15 * 60) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(timeTotals, distanceKey)) {
      timeTotals[distanceKey] += timeSeconds;
      timeCounts[distanceKey] += 1;
      if (bestTimes[distanceKey] === null || timeSeconds < bestTimes[distanceKey]) {
        bestTimes[distanceKey] = timeSeconds;
      }
    }
  });

  const avg200 =
    timeCounts["200"] > 0 ? timeTotals["200"] / timeCounts["200"] : null;
  const avg500 =
    timeCounts["500"] > 0 ? timeTotals["500"] / timeCounts["500"] : null;
  const avg2000 =
    timeCounts["2000"] > 0 ? timeTotals["2000"] / timeCounts["2000"] : null;

  regattaAvg200El.textContent = formatDurationFromSeconds(avg200);
  regattaAvg500El.textContent = formatDurationFromSeconds(avg500);
  regattaAvg2000El.textContent = formatDurationFromSeconds(avg2000);
  regattaBest200El.textContent = formatDurationFromSeconds(bestTimes["200"]);
  regattaBest500El.textContent = formatDurationFromSeconds(bestTimes["500"]);
  regattaBest2000El.textContent = formatDurationFromSeconds(bestTimes["2000"]);
}

function getRegattaFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("regatta");
}

async function loadRegattaSummary(regattaId) {
  const results = await Promise.all(
    regattaFiles.map(async (path) => {
      const response = await fetch(encodeURI(path), { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load ${path}`);
      }
      const text = await response.text();
      return csvToObjects(text);
    })
  );

  const allRows = results.flat();
  const regattaRows = allRows.filter(
    (row) => normalizeRegattaId(row.regatta_id) === regattaId
  );
  const sortedRows = sortRows(regattaRows);

  regattaNameEl.textContent = formatRegattaName(regattaId);
  regattaRacesEl.textContent = `Races: ${
    new Set(regattaRows.map((row) => row.race_id).filter(Boolean)).size
  }`;
  regattaTeamsEl.textContent = `Teams: ${
    new Set(regattaRows.map((row) => normalizeTeamName(row.team_name)).filter(Boolean)).size
  }`;
  regattaEntriesEl.textContent = `Entries: ${regattaRows.length}`;
  regattaStatusEl.textContent =
    regattaRows.length > 0 ? "Showing all recorded race entries." : "No results found.";

  updateAnalytics(regattaRows);
  renderRows(sortedRows);
}

const regattaId = getRegattaFromUrl();
if (!regattaId) {
  regattaNameEl.textContent = "No regatta selected";
  regattaStatusEl.textContent = "Return to the leaderboard and select a regatta.";
} else {
  loadRegattaSummary(regattaId).catch((error) => {
    regattaStatusEl.textContent = "Failed to load regatta data.";
    console.error(error);
  });
}
