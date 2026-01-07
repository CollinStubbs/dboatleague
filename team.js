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

const teamNameEl = document.querySelector("#team-name");
const teamRegattasEl = document.querySelector("#team-regattas");
const teamRacesEl = document.querySelector("#team-races");
const teamStatusEl = document.querySelector("#team-status");
const tableBody = document.querySelector("#team-results-body");
const analyticsEventEl = document.querySelector("#analytics-event");
const analyticsPodiumsEl = document.querySelector("#analytics-podiums");
const analyticsAvg200El = document.querySelector("#analytics-avg-200");
const analyticsAvg500El = document.querySelector("#analytics-avg-500");
const analyticsAvg2000El = document.querySelector("#analytics-avg-2000");
const analyticsBest200El = document.querySelector("#analytics-best-200");
const analyticsBest500El = document.querySelector("#analytics-best-500");
const analyticsBest2000El = document.querySelector("#analytics-best-2000");
const analyticsSandbagEl = document.querySelector("#analytics-sandbag");

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

function formatSignedDurationFromSeconds(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "--";
  }
  if (seconds < 0) {
    return `-${formatDurationFromSeconds(Math.abs(seconds))}`;
  }
  return `+${formatDurationFromSeconds(seconds)}`;
}


function formatDuration(value) {
  if (!value) {
    return "--";
  }
  return value;
}

function formatRegattaName(regattaId) {
  return regattaId ? regattaId.replace(/_/g, " ").replace(/\s+/g, " ").trim() : "Unknown";
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

function normalizeRegattaId(regattaId) {
  const raw = String(regattaId || "").trim();
  if (raw.startsWith("2025_CDBC_")) {
    return "2025_CDBC";
  }
  return raw;
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

function mostCommonLabel(counter) {
  let bestLabel = "--";
  let bestCount = 0;
  Object.entries(counter).forEach(([label, count]) => {
    if (count > bestCount) {
      bestCount = count;
      bestLabel = label;
    }
  });
  return bestLabel;
}

function updateAnalytics(teamRows) {
  const eventCounts = {};
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
  const sandbagTotals = {
    qualifying: 0,
    finals: 0,
  };
  const sandbagCounts = {
    qualifying: 0,
    finals: 0,
  };
  let podiums = 0;

  teamRows.forEach((row) => {
    if (isExcludedPlace(row.place)) {
      return;
    }
    if (row.event) {
      eventCounts[row.event] = (eventCounts[row.event] || 0) + 1;
    }

    const place = Number.parseInt(row.place, 10);
    if (!Number.isNaN(place) && place >= 1 && place <= 3) {
      podiums += 1;
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

    if (distanceKey === "500") {
      const round = (row.round || "").toLowerCase();
      const isFinal =
        (round.includes("cup") || round.includes("final") || round.includes("champ")) && !round.includes("semi");
      if (isFinal) {
        sandbagTotals.finals += timeSeconds;
        sandbagCounts.finals += 1;
      } else {
        sandbagTotals.qualifying += timeSeconds;
        sandbagCounts.qualifying += 1;
      }
    }
  });

  const avg200 =
    timeCounts["200"] > 0 ? timeTotals["200"] / timeCounts["200"] : null;
  const avg500 =
    timeCounts["500"] > 0 ? timeTotals["500"] / timeCounts["500"] : null;
  const avg2000 =
    timeCounts["2000"] > 0 ? timeTotals["2000"] / timeCounts["2000"] : null;

  analyticsEventEl.textContent = mostCommonLabel(eventCounts);
  analyticsPodiumsEl.textContent = podiums.toString();
  analyticsAvg200El.textContent = formatDurationFromSeconds(avg200);
  analyticsAvg500El.textContent = formatDurationFromSeconds(avg500);
  analyticsAvg2000El.textContent = formatDurationFromSeconds(avg2000);
  analyticsBest200El.textContent = formatDurationFromSeconds(bestTimes["200"]);
  analyticsBest500El.textContent = formatDurationFromSeconds(bestTimes["500"]);
  analyticsBest2000El.textContent = formatDurationFromSeconds(bestTimes["2000"]);

  const qualifyingAvg =
    sandbagCounts.qualifying > 0
      ? sandbagTotals.qualifying / sandbagCounts.qualifying
      : null;
  const finalsAvg =
    sandbagCounts.finals > 0 ? sandbagTotals.finals / sandbagCounts.finals : null;
  const sandbagDelta =
    qualifyingAvg !== null && finalsAvg !== null ? qualifyingAvg - finalsAvg : null;
  analyticsSandbagEl.textContent = formatSignedDurationFromSeconds(sandbagDelta);
}

function renderRows(rows) {
  tableBody.innerHTML = rows
    .map((row) => {
      const regattaId = normalizeRegattaId(row.regatta_id);
      const regattaLabel = formatRegattaName(regattaId);
      const regattaLink = regattaId
        ? `<a class="regatta-link" href="regatta.html?regatta=${encodeURIComponent(regattaId)}">${regattaLabel}</a>`
        : regattaLabel;
      return `
        <tr>
          <td>${regattaLink}</td>
          <td>${formatCell(row.date)}</td>
          <td>${formatCell(row.start_time)}</td>
          <td>${formatCell(row.race_no)}</td>
          <td>${formatCell(row.event)}</td>
          <td>${formatCell(row.round)}</td>
          <td>${formatDistance(row.distance_m)}</td>
          <td>${formatCell(row.lane)}</td>
          <td>${formatCell(row.place)}</td>
          <td>${formatDuration(row.time)}</td>
        </tr>
      `;
    })
    .join("");
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

function getTeamFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("team");
}

async function loadTeamResults(teamName) {
  const normalizedTarget = normalizeTeamName(teamName).toUpperCase();
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
  const teamRows = allRows.filter(
    (row) => normalizeTeamName(row.team_name).toUpperCase() === normalizedTarget
  );
  const sortedRows = sortRows(teamRows);

  teamNameEl.textContent = normalizedTarget || "Team Results";
  teamRegattasEl.textContent = `Regattas: ${
    new Set(teamRows.map((row) => row.regatta_id).filter(Boolean)).size
  }`;
  teamRacesEl.textContent = `Races: ${teamRows.length}`;
  teamStatusEl.textContent =
    teamRows.length > 0 ? "Showing all recorded race entries." : "No results found.";

  updateAnalytics(teamRows);
  renderRows(sortedRows);
}

const teamName = getTeamFromUrl();
if (!teamName) {
  teamNameEl.textContent = "No team selected";
  teamStatusEl.textContent = "Return to the leaderboard and select a team.";
} else {
  loadTeamResults(teamName).catch((error) => {
    teamStatusEl.textContent = "Failed to load race data.";
    console.error(error);
  });
}
