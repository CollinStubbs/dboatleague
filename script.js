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

const tableBody = document.querySelector("#leaderboard tbody");
const headers = Array.from(document.querySelectorAll("#leaderboard thead th"));
const yearSelect = document.querySelector("#year-filter");
const regattaSelect = document.querySelector("#regatta-filter");
const boatSelect = document.querySelector("#boat-filter");
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

function isExcludedPlace(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "DNF" || normalized === "DNS" || normalized === "NA" || normalized === "N/A";
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

function normalizeRow(row, teamDivisionMap) {
  const place = numericValue(row.place);
  const excludedPlace = isExcludedPlace(row.place);
  const timeSeconds = parseTimeToSeconds(row.time);
  const distanceMeters = numericValue(row.distance_m);
  const regattaId = normalizeRegattaId(row.regatta_id);
  const division = resolveDivisionWithPrimary(row.event, row.team_name, teamDivisionMap);
  const effectiveTeam = getEffectiveTeamName(row.team_name, division, teamDivisionMap);
  const eventText = String(row.event || "");
  const teamText = effectiveTeam || String(row.team_name || "");
  const isSmall = /\bsmall\b/i.test(eventText) || /\bsmall\b/i.test(teamText);
  const raceId =
    row.race_id ||
    `${regattaId || "UNKNOWN"}-${row.race_no || "RACE"}-${row.date || ""}`;

  return {
    regattaId: regattaId || "UNKNOWN",
    raceId,
    event: row.event || "",
    round: row.round || "",
    team: effectiveTeam || normalizeTeamName(row.team_name),
    teamKey: normalizeTeamKey(effectiveTeam || row.team_name),
    division,
    isSmall,
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

function buildLeaderboard(rows) {
  const teams = new Map();

  rows.forEach((row) => {
    if (!row.teamKey) {
      return;
    }
    if (row.excludedPlace) {
      return;
    }
    const entry = teams.get(row.teamKey) || {
      teamKey: row.teamKey,
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
        const normalizedDivision = row.division || normalizeDivisionName(row.event);
        entry.divisionCounts[normalizedDivision] =
          (entry.divisionCounts[normalizedDivision] || 0) + 1;
        if (normalizedDivision === "BCP") {
          entry.hasBcpDivision = true;
        }
      }
    }

    if (!entry.team) {
      entry.team = row.team;
    }
    teams.set(row.teamKey, entry);
  });  const leaderboard = Array.from(teams.values()).map((entry) => {
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
    const combinedAvg =
      avg200 !== null && avg500 !== null && avg2000 !== null
        ? avg200 + avg500 + avg2000
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
      teamKey: entry.teamKey,
      division,
      races: entry.races,
            avg200,
      avg500,
      avg2000,
      combinedAvg,
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
      <td>${formatDuration(entry.combinedAvg)}</td>
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

function filterRowsByBoat(rows) {
  const boatValue = boatSelect.value;
  if (boatValue === "SMALL") {
    return rows.filter((row) => row.isSmall);
  }
  if (boatValue === "STANDARD") {
    return rows.filter((row) => !row.isSmall);
  }
  return rows;
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
  const boatRows = filterRowsByBoat(yearRows);
  const filtered =
    regattaId === "ALL"
      ? boatRows
      : boatRows.filter((row) => row.regattaId === regattaId);
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
  const boatRows = filterRowsByBoat(yearRows);
  const regattaIds = new Set(boatRows.map((row) => row.regattaId));
  updateRegattaOptions(regattaIds);
  const divisions = new Set(
    boatRows
      .map((row) => row.division)
      .filter((divisionName) => divisionName)
  );
  updateDivisionOptions(divisions);
  applyRegattaFilter("ALL");
});

boatSelect.addEventListener("change", () => {
  const yearRows = filterRowsByYear(rawRows);
  const boatRows = filterRowsByBoat(yearRows);
  const regattaIds = new Set(boatRows.map((row) => row.regattaId));
  updateRegattaOptions(regattaIds);
  const divisions = new Set(
    boatRows
      .map((row) => row.division)
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
      return csvToObjects(text);
    })
  );

  const rawRowsCsv = results.flat();
  const teamDivisionMap = buildTeamDivisionMap(rawRowsCsv);
  rawRows = rawRowsCsv.map((row) => normalizeRow(row, teamDivisionMap));
  availableYears = Array.from(
    new Set(rawRows.map((row) => getYearFromRegattaId(row.regattaId)).filter(Boolean))
  ).sort();
  updateYearOptions(availableYears);
  if (availableYears.length > 0) {
    yearSelect.value = availableYears[0];
  }
  const yearRows = filterRowsByYear(rawRows);
  const boatRows = filterRowsByBoat(yearRows);
  const regattaIds = new Set(boatRows.map((row) => row.regattaId));
  const divisions = new Set(
    boatRows
      .map((row) => row.division)
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





