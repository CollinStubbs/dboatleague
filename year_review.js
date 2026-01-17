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
  "regattas/2025/2025_harrison.csv",
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

const reviewSummaryEl = document.querySelector("#year-review-summary");
const reviewStatusEl = document.querySelector("#year-review-status");

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

function getYearFromRegattaId(regattaId) {
  const match = String(regattaId || "").match(/(\d{4})/);
  return match ? match[1] : "";
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

function buildYearReview(rows, year) {
  const yearRows = rows.filter((row) => getYearFromRegattaId(row.regattaId) === year);
  const fastestByDistance = {};
  const raceGroups = new Map();

  yearRows.forEach((row) => {
    if (!isValidRaceRow(row)) {
      return;
    }
    const distanceKey = Math.round(row.distanceMeters).toString();
    const best = fastestByDistance[distanceKey];
    if (!best || row.timeSeconds < best.timeSeconds) {
      fastestByDistance[distanceKey] = {
        team: row.team,
        timeSeconds: row.timeSeconds,
        regattaId: row.regattaId,
        event: row.event || "",
        raceId: row.raceId,
        raceNo: row.raceNo || "",
      };
    }

    const raceKey = `${row.regattaId}-${row.raceId || row.raceNo || ""}-${distanceKey}`;
    if (!raceGroups.has(raceKey)) {
      raceGroups.set(raceKey, {
        regattaId: row.regattaId,
        raceId: row.raceId,
        raceNo: row.raceNo || "",
        event: row.event || "",
        distanceKey,
        timeSum: 0,
        count: 0,
        entries: [],
      });
    }
    const group = raceGroups.get(raceKey);
    group.timeSum += row.timeSeconds;
    group.count += 1;
    group.entries.push({ team: row.team, timeSeconds: row.timeSeconds });
  });

  const bestAverageByDistance = {};
  raceGroups.forEach((group) => {
    if (group.count === 0) {
      return;
    }
    const avg = group.timeSum / group.count;
    const best = bestAverageByDistance[group.distanceKey];
    if (!best || avg < best.avgSeconds) {
      bestAverageByDistance[group.distanceKey] = {
        avgSeconds: avg,
        regattaId: group.regattaId,
        raceId: group.raceId,
        raceNo: group.raceNo,
        event: group.event,
        entries: group.entries.slice().sort((a, b) => a.timeSeconds - b.timeSeconds),
      };
    }
  });

  return { fastestByDistance, bestAverageByDistance, year };
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

function renderYearReview(summary) {
  const distanceOrder = ["200", "500", "2000"];
  const fastestLines = distanceOrder
    .map((distance) => {
      const entry = summary.fastestByDistance[distance];
      if (!entry) {
        return `<li>${distance}m: --</li>`;
      }
      const regattaLabel = formatRegattaName(entry.regattaId);
      return `<li>${distance}m: ${formatDuration(entry.timeSeconds)} - ${entry.team} (${regattaLabel})</li>`;
    })
    .join("");

  const raceLines = distanceOrder
    .map((distance) => {
      const entry = summary.bestAverageByDistance[distance];
      if (!entry) {
        return `<li>${distance}m: --</li>`;
      }
      const regattaLabel = formatRegattaName(entry.regattaId);
      const raceLabel = entry.raceNo ? `Race ${entry.raceNo}` : entry.raceId || "Race";
      const entryLines = (entry.entries || [])
        .map(
          (teamEntry) =>
            `<li><span class="review-team">${teamEntry.team}</span> - ${formatDuration(teamEntry.timeSeconds)}</li>`
        )
        .join("");
      const entryList = entryLines ? `<ul class="review-sublist">${entryLines}</ul>` : "";
      return `<li>${distance}m: ${formatDuration(entry.avgSeconds)} avg - ${raceLabel} (${entry.event || "Event"}) at ${regattaLabel}${entryList}</li>`;
    })
    .join("");

  reviewSummaryEl.innerHTML = `
    <div class="review-section">
      <h4>Fastest Times</h4>
      <ul>${fastestLines}</ul>
    </div>
    <div class="review-section">
      <h4>Fastest Average Races</h4>
      <ul>${raceLines}</ul>
    </div>
  `;
}

function normalizeRows(rows) {
  return rows.map((row) => {
    const regattaId = normalizeRegattaId(row.regatta_id);
    return {
      regattaId,
      raceId: row.race_id || "",
      raceNo: row.race_no || "",
      event: row.event || "",
      place: numericValue(row.place),
      excludedPlace: isExcludedPlace(row.place),
      team: normalizeTeamName(row.team_name),
      timeSeconds: parseTimeToSeconds(row.time),
      distanceMeters: numericValue(row.distance_m),
    };
  });
}

async function loadYearReview() {
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

    const rawRows = results.flat();
    const normalized = normalizeRows(rawRows);
    const summary = buildYearReview(normalized, "2025");
    renderYearReview(summary);
    reviewStatusEl.textContent = "Loaded";
  } catch (error) {
    reviewStatusEl.textContent = "Failed to load data";
    reviewSummaryEl.textContent = "Unable to build the year in review.";
    console.error(error);
  }
}

loadYearReview();
