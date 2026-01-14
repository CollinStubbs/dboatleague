const regattaFiles = [
  "regattas/2025/2025_CDBC_2025-08-21_day1_races.csv",
  "regattas/2025/2025_CDBC_2025-08-22_day2_races.csv",
  "regattas/2025/2025_CDBC_2025-08-23_day3_races.csv",
  "regattas/2025/2025_CDBC_2025-08-24_day4_races.csv",
  "regattas/2025/2025_CCNC.csv",
  "regattas/2025/2025_ohana.csv",
  "regattas/2025/2025_CONCORD_SAT.csv",
  "regattas/2025/2025_CONCORD_SUN.csv",
  "regattas/2025/2025_hamilton.csv",
  "regattas/2025/2025_KCDBF.csv",
  "regattas/2025/2025_Mercer_DBF.csv",
  "regattas/2025/2025_milton.csv",
  "regattas/2025/2025_New_York_IDBF.csv",
  "regattas/2025/2025_Orlando_DBF.csv",
  "regattas/2025/2025_PACCC_Fri.csv",
  "regattas/2025/2025_PACCC_Sat.csv",
  "regattas/2025/2025_PACCC_Sun.csv",
  "regattas/2025/2025_pickering_saturday.csv",
  "regattas/2025/2025_pickering_sunday.csv",
  "regattas/2025/2025_port_perry.csv",
  "regattas/2025/2025_USDBC.csv",
  "regattas/2025/2025_welland_hope_floats.csv",
  "regattas/2025/2025-Chicago-IDBF.csv",
  "regattas/2025/2025-GWNC.csv",
  "regattas/2025/2025-GWNS.csv",
  "regattas/2025/2025-Sarasota-IDBF.csv",
  "regattas/2025/2025-TIDBRF.csv",
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

const TEAM_ALIAS_MAP = {
  "BOSTON BBB": "Boston BBB DBC",
  "BOSTON BBB DBC WOMEN": "Boston BBB Women Premier",
  "BOSTON BBB WOMEN PREMIER": "Boston BBB Women Premier",
  "BOSTON BBB OPEN PREMIER": "Boston BBB Open Premier",
  "BOSTON BBB DBC OPEN": "Boston BBB Open Premier",
  "IRON DRAGONS BLUE UNIVERSITY": "Iron Dragons Blue",
  "IRON DRAGONS GOLD UNIVERSITY": "Iron Dragons Gold",
  "22D TRUE GRIT OPEN": "22Dragons True Grit 24U - Open",
  "22D TRUE GRIT": "22Dragons True Grit 24U",
  "22DRAGONS TRUE GRIT 24U": "22Dragons True Grit 24U",
  "BUCKS FREEDOM MIXED WOMEN": "Bucks Freedom Women",
  "UEAA DRAGON BOAT NYC NEW YORK": "UEAA Dragon Boat NYC",
  "IMMORTALS": "Maelstrom Immortals",
  "IMMORTALS OPEN": "Maelstrom Immortals - Open",
  "CARLETON U24": "Carleton U24",
  "CARLETON UNIVERSITY DBC MIXED": "Carleton U24",
  "CARLETON UNIVERSITY DBC": "Carleton U24",
  "JPMCDBFF / AZURE DRAGONS": "JPMCDBFF Azure Dragons",
  "ITHACA GORGES OPEN": "Ithaca Gorges Dragons - Open",
  "SNCC CANAL DRAGONS CANAL DRAGONS": "South Niagara Canoe Club Canal Dragons",
  "SNCC CANAL DRAGONS": "South Niagara Canoe Club Canal Dragons",
  "SOUTH NIAGARA CANOE CLUB CANAL DRAGONS": "South Niagara Canoe Club Canal Dragons",
  "HEAT MIXED": "Heat DBC",
  "HEAT DRAGON BOAT CLUB THE VILLAGES": "Heat DBC",
  "WATER VIPERS MASTER POWERED BY AFTERBURNFITNESS.CA": "Water Vipers Masters powered by Afterburn Fitness",
  "WATER VIPERS MASTERS POWERED BY AFTERBURN FITNESS": "Water Vipers Masters powered by Afterburn Fitness",
  "WATER VIPERS PERFORMANCE 1 POWERED BY AFTERBURNFITNESS.CA": "Water Vipers Performance powered by afterburnfitness.ca",
  "WATER VIPERS PERFORMANCE 1X": "Water Vipers Performance powered by afterburnfitness.ca",
  "WATER VIPERS PERFORMANCE POWERED BY AFTERBURNFITNESS.CA": "Water Vipers Performance powered by afterburnfitness.ca",
  "WATER VIPERS 1.5X POWERED BY": "Water Vipers 1.5X powered by Afterburnfitness.ca",
  "WATER VIPERS 1.5X POWERED BY AFTERBURNFITNESS.CA": "Water Vipers 1.5X powered by Afterburnfitness.ca",
  "CATCH22 PREMIER MIXED": "Catch22 Mixed NYC",
  "CATCH22 NYC": "Catch22 Mixed NYC",
  "CATCH22 MIXED NYC": "Catch22 Mixed NYC",
  "CATCH22 OPEN": "Catch22 Open",
  "CATCH22 NYC PREMIER OPEN": "Catch22 Open",
  "CATCH22 OPEN NYC": "Catch22 Open",
  "CATCH22 PADDLE QUEENS NYC": "Catch22 Paddle Queens",
  "CATCH22 NYC PADDLE QUEENS": "Catch22 Paddle Queens",
  "CATCH22 PADDLE QUEENS": "Catch22 Paddle Queens",
  "JDBC FLASH JACKSONVILLE BEACH": "JDBC Flash",
  "NJDBC JERSEY THUNDER WOMEN": "NJDBC Jersey Thunder",
  "HEAT WOMEN": "HEAT DBC - Women",
  "HEAT DBC WOMEN": "HEAT DBC - Women",
};

function applyTeamAlias(name) {
  const key = String(name || "").toUpperCase();
  return TEAM_ALIAS_MAP[key] || name;
}

function normalizeTeamName(name) {
  const cleaned = String(name || "")
    .replace(/[-"]/g, " ")
    .replace(/\s*[\[(][^\])]+[\])]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return applyTeamAlias(cleaned);
}

function normalizeTeamKey(name) {
  return normalizeTeamName(name).replace(/\s+/g, "").toUpperCase();
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

function getDivisionFromEvent(eventName) {
  const raw = String(eventName || "").trim();
  const text = raw.toUpperCase();
  const hasWomen = text.includes("WOMEN");
  const hasMixed = text.includes("MIXED");
  const hasOpen = text.includes("OPEN");
  const divisionHits = Number(hasWomen) + Number(hasMixed) + Number(hasOpen);

  return {
    division: normalizeDivisionName(eventName),
    isAmbiguous: divisionHits > 1,
  };
}

function getDivisionFromTeam(teamName) {
  if (teamNameHasDivision(teamName, "Women")) {
    return "Women";
  }
  if (teamNameHasDivision(teamName, "Open")) {
    return "Open";
  }
  if (teamNameHasDivision(teamName, "Mixed")) {
    return "Mixed";
  }
  if (teamNameHasDivision(teamName, "BCP")) {
    return "BCP";
  }
  if (teamNameHasDivision(teamName, "Para")) {
    return "Para";
  }
  if (teamNameHasDivision(teamName, "Special Needs")) {
    return "Special Needs";
  }
  if (teamNameHasDivision(teamName, "University")) {
    return "University";
  }
  if (teamNameHasDivision(teamName, "Youth")) {
    return "Youth";
  }
  return "";
}

function resolveDivision(eventName, teamName) {
  const eventDivision = getDivisionFromEvent(eventName);
  if (!eventDivision.isAmbiguous) {
    return eventDivision.division;
  }
  return getDivisionFromTeam(teamName) || "Mixed";
}

function teamNameHasDivision(teamName, division) {
  const text = String(teamName || "").toUpperCase();
  if (!text) {
    return false;
  }
  if (division === "Women") {
    return text.includes("WOMEN");
  }
  if (division === "Open") {
    return text.includes("OPEN");
  }
  if (division === "Mixed") {
    return text.includes("MIXED");
  }
  if (division === "BCP") {
    return text.includes("BCP") || text.includes("BCS") || text.includes("CANCER") || text.includes("SURVIVOR");
  }
  if (division === "Para") {
    return text.includes("PARA");
  }
  if (division === "Special Needs") {
    return text.includes("SPECIAL NEEDS");
  }
  if (division === "University") {
    return text.includes("UNIVERSITY");
  }
  if (division === "Youth") {
    return text.includes("YOUTH") || text.includes("JUNIOR");
  }
  return false;
}

function resolveDivisionForSplit(eventName, teamName) {
  const eventInfo = getDivisionFromEvent(eventName);
  if (!eventInfo.isAmbiguous) {
    return eventInfo.division;
  }
  return getDivisionFromTeam(teamName);
}

function pickPrimaryDivision(counts, baseName) {
  const explicitDivision = getDivisionFromTeam(baseName);
  if (explicitDivision && counts[explicitDivision]) {
    return explicitDivision;
  }
  if (!explicitDivision && counts.Mixed) {
    return "Mixed";
  }
  const priorities = ["Mixed", "Open", "Women", "BCP", "Para", "Special Needs", "University", "Youth"];
  let bestDivision = "";
  let bestCount = -1;

  Object.entries(counts).forEach(([division, count]) => {
    if (count > bestCount) {
      bestDivision = division;
      bestCount = count;
      return;
    }
    if (count === bestCount) {
      const currentIndex = priorities.indexOf(division);
      const bestIndex = priorities.indexOf(bestDivision);
      if (bestIndex === -1 || (currentIndex !== -1 && currentIndex < bestIndex)) {
        bestDivision = division;
      }
    }
  });

  return bestDivision;
}

function resolveDivisionWithPrimary(eventName, teamName, teamDivisionMap) {
  const eventInfo = getDivisionFromEvent(eventName);
  if (!eventInfo.isAmbiguous) {
    return eventInfo.division;
  }
  const baseName = normalizeTeamName(teamName);
  const teamKey = normalizeTeamKey(baseName);
  const entry = teamDivisionMap.get(teamKey);
  if (entry && entry.primary) {
    return entry.primary;
  }
  return getDivisionFromTeam(teamName) || "Mixed";
}

function buildTeamDivisionMap(rows) {
  const teamDivisions = new Map();

  rows.forEach((row) => {
    const baseName = normalizeTeamName(row.team_name);
    if (!baseName) {
      return;
    }
    const teamKey = normalizeTeamKey(baseName);
    const division = resolveDivisionForSplit(row.event, row.team_name);
    if (!division) {
      return;
    }
    const entry = teamDivisions.get(teamKey) || { counts: {}, primary: "", baseName };
    if (!entry.baseName) {
      entry.baseName = baseName;
    }
    entry.counts[division] = (entry.counts[division] || 0) + 1;
    teamDivisions.set(teamKey, entry);
  });

  teamDivisions.forEach((entry) => {
    entry.primary = pickPrimaryDivision(entry.counts, entry.baseName);
  });

  return teamDivisions;
}

function getEffectiveTeamName(teamName, division, teamDivisionMap) {
  const baseName = normalizeTeamName(teamName);
  if (!baseName) {
    return "";
  }
  if (teamNameHasDivision(baseName, division)) {
    return baseName;
  }
  const teamKey = normalizeTeamKey(baseName);
  const entry = teamDivisionMap.get(teamKey);
  const divisionCount = entry ? Object.keys(entry.counts).length : 0;
  if (!entry || divisionCount <= 1) {
    return baseName;
  }
  if (division === entry.primary) {
    return baseName;
  }
  return `${baseName} - ${division}`;
}

function isExcludedPlace(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "DNF" || normalized === "DNS" || normalized === "NA" || normalized === "N/A";
}

function formatRegattaName(regattaId) {
  const cleaned = String(regattaId || "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b(results|final)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) {
    return "REGATTA";
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
      const teamLabel = row.__teamEffective || normalizeTeamName(row.team_name);
      return `
        <tr>
          <td>${formatCell(row.date)}</td>
          <td>${formatCell(row.start_time)}</td>
          <td>${formatCell(row.race_no)}</td>
          <td>${formatCell(row.event)}</td>
          <td>${formatCell(row.round)}</td>
          <td>${formatDistance(row.distance_m)}</td>
          <td>${formatCell(row.lane)}</td>
          <td>${formatCell(teamLabel)}</td>
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
  const teamDivisionMap = buildTeamDivisionMap(allRows);
  const effectiveRows = allRows.map((row) => {
    const division = resolveDivisionWithPrimary(row.event, row.team_name, teamDivisionMap);
    return {
      ...row,
      __teamEffective: getEffectiveTeamName(row.team_name, division, teamDivisionMap),
    };
  });
  const regattaRows = effectiveRows.filter(
    (row) => normalizeRegattaId(row.regatta_id) === regattaId
  );
  const sortedRows = sortRows(regattaRows);

  regattaNameEl.textContent = formatRegattaName(regattaId);
  regattaRacesEl.textContent = `Races: ${
    new Set(regattaRows.map((row) => row.race_id).filter(Boolean)).size
  }`;
  regattaTeamsEl.textContent = `Teams: ${
    new Set(regattaRows.map((row) => row.__teamEffective || normalizeTeamName(row.team_name)).filter(Boolean)).size
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



