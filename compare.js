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

const teamASelect = document.querySelector("#team-a");
const teamBSelect = document.querySelector("#team-b");
const swapButton = document.querySelector("#swap-teams");
const compareBody = document.querySelector("#compare-table tbody");
const compareStatus = document.querySelector("#compare-status");
const teamAHeader = document.querySelector("#team-a-header");
const teamBHeader = document.querySelector("#team-b-header");

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
  "SUNNYSIDE PADDLING CLUB WILD WEDNESDAY": "Sunnyside Paddling Club Wild Wednesdays",
  "SUNNYSIDE PADDLING CLUB WILD WEDNESDAYS": "Sunnyside Paddling Club Wild Wednesdays",
  "MON SHEONG RED PANDA": "Mon Sheong Red Pandas",
  "MON SHEONG RED PANDAS": "Mon Sheong Red Pandas",
  "BARRIE'S RIBBONS OF HOPE": "Barrie's Ribbons of Hope",
  "BARRIES RIBBONS OF HOPE": "Barrie's Ribbons of Hope",
  "BARRIE'S RIBBONS OF HOPE BCP": "Barrie's Ribbons of Hope",
  "BARRIES RIBBONS OF HOPE BCP": "Barrie's Ribbons of Hope",
  "BARRIE'S RIBBONS OF HOPE WOMEN": "Barrie's Ribbons of Hope",
  "BARRIES RIBBONS OF HOPE WOMEN": "Barrie's Ribbons of Hope",
  "UNIVERSITY OF WATERLOO DRAGON WARRIORS 1 8": "University of Waterloo Dragon Warriors",
  "UNIVERSITY OF WATERLOO DRAGON WARRIORS MIXED": "University of Waterloo Dragon Warriors",
  "HOLY MAC ROW UNIVERSITY": "Holy Mac Row",
  "MCGILL DRAGON BOAT Z UNIVERSITY": "McGill Dragon Boat Z",
  "RC LIQUID ASSETS BULLS UNIVERSITY": "RC Liquid Assets Bulls",
  "RC LIQUID ASSETS BEARS UNIVERSITY": "RC Liquid Assets Bears",
  "NDUC JADE DRAGONS UNIVERSITY": "NDUC Jade Dragons",
  "IRON DRAGONS OPEN": "Iron Dragons Lady Godiva",
};

let normalizedRows = [];

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

function applyTeamAlias(name) {
  const key = String(name || "").toUpperCase();
  return TEAM_ALIAS_MAP[key] || name;
}

function normalizeTeamName(name) {
  return applyTeamAlias(
    String(name || "")
      .replace(/[-"]/g, " ")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\s*[\[(][^\])]+[\])]\s*$/, "")
      .replace(/\s+/g, " ")
      .trim()
  );
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

function numericValue(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
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

function isExcludedPlace(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "DNF" || normalized === "DNS" || normalized === "NA" || normalized === "N/A";
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

function isValidRaceRow(row) {
  if (row.excludedPlace) {
    return false;
  }
  if (row.timeSeconds === null || row.distanceMeters === null) {
    return false;
  }
  if (row.timeSeconds <= 0) {
    return false;
  }
  const distanceKey = Math.round(row.distanceMeters).toString();
  if (distanceKey === "500" && row.timeSeconds > 4 * 60 + 30) {
    return false;
  }
  if (distanceKey === "200" && row.timeSeconds > 2 * 60 + 30) {
    return false;
  }
  if (distanceKey === "2000" && row.timeSeconds > 15 * 60) {
    return false;
  }
  return true;
}

function normalizeRows(rows) {
  return rows.map((row) => ({
    regattaId: normalizeRegattaId(row.regatta_id),
    raceId: row.race_id || "",
    raceNo: row.race_no || "",
    event: row.event || "",
    team: normalizeTeamName(row.team_name),
    timeSeconds: parseTimeToSeconds(row.time),
    distanceMeters: numericValue(row.distance_m),
    place: numericValue(row.place),
    excludedPlace: isExcludedPlace(row.place),
  }));
}

function buildTeamStats(rows, teamName) {
  const stats = {
    team: teamName,
    races: 0,
    timeTotals: { 200: 0, 500: 0, 2000: 0 },
    timeCounts: { 200: 0, 500: 0, 2000: 0 },
    bestTimes: { 200: null, 500: null, 2000: null },
  };

  rows.forEach((row) => {
    if (row.team !== teamName) {
      return;
    }
    if (!isValidRaceRow(row)) {
      return;
    }
    const distanceKey = Math.round(row.distanceMeters).toString();
    if (!Object.prototype.hasOwnProperty.call(stats.timeTotals, distanceKey)) {
      return;
    }
    stats.races += 1;
    stats.timeTotals[distanceKey] += row.timeSeconds;
    stats.timeCounts[distanceKey] += 1;
    const currentBest = stats.bestTimes[distanceKey];
    if (currentBest === null || row.timeSeconds < currentBest) {
      stats.bestTimes[distanceKey] = row.timeSeconds;
    }
  });

  return stats;
}

function formatAvg(stats, distanceKey) {
  const count = stats.timeCounts[distanceKey];
  if (!count) {
    return "--";
  }
  return formatDuration(stats.timeTotals[distanceKey] / count);
}

function formatBest(stats, distanceKey) {
  return formatDuration(stats.bestTimes[distanceKey]);
}

function renderComparison(teamA, teamB) {
  const statsA = buildTeamStats(normalizedRows, teamA);
  const statsB = buildTeamStats(normalizedRows, teamB);

  teamAHeader.textContent = teamA || "Team A";
  teamBHeader.textContent = teamB || "Team B";

  const rows = [
    ["Total races", statsA.races || "--", statsB.races || "--"],
    ["Avg 200m", formatAvg(statsA, "200"), formatAvg(statsB, "200")],
    ["Avg 500m", formatAvg(statsA, "500"), formatAvg(statsB, "500")],
    ["Avg 2000m", formatAvg(statsA, "2000"), formatAvg(statsB, "2000")],
    ["Best 200m", formatBest(statsA, "200"), formatBest(statsB, "200")],
    ["Best 500m", formatBest(statsA, "500"), formatBest(statsB, "500")],
    ["Best 2000m", formatBest(statsA, "2000"), formatBest(statsB, "2000")],
  ];

  compareBody.innerHTML = rows
    .map(
      (row) =>
        `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`
    )
    .join("");
}

function populateTeams(teams) {
  teamASelect.innerHTML = "";
  teamBSelect.innerHTML = "";
  teams.forEach((teamName) => {
    const optionA = document.createElement("option");
    optionA.value = teamName;
    optionA.textContent = teamName;
    const optionB = optionA.cloneNode(true);
    teamASelect.appendChild(optionA);
    teamBSelect.appendChild(optionB);
  });
  teamASelect.selectedIndex = 0;
  teamBSelect.selectedIndex = teams.length > 1 ? 1 : 0;
}

function handleSelectionChange() {
  const teamA = teamASelect.value;
  const teamB = teamBSelect.value;
  renderComparison(teamA, teamB);
}

swapButton.addEventListener("click", () => {
  const currentA = teamASelect.value;
  const currentB = teamBSelect.value;
  teamASelect.value = currentB;
  teamBSelect.value = currentA;
  handleSelectionChange();
});

teamASelect.addEventListener("change", handleSelectionChange);
teamBSelect.addEventListener("change", handleSelectionChange);

async function loadComparison() {
  try {
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

    normalizedRows = normalizeRows(results.flat());
    const teamSet = new Set(
      normalizedRows
        .map((row) => row.team)
        .filter((team) => team && team.trim() !== "")
    );
    const teams = Array.from(teamSet).sort();
    if (!teams.length) {
      compareStatus.textContent = "No teams available";
      return;
    }
    populateTeams(teams);
    compareStatus.textContent = "Loaded";
    handleSelectionChange();
  } catch (error) {
    compareStatus.textContent = "Failed to load data";
    compareBody.innerHTML = "";
    console.error(error);
  }
}

loadComparison();
