# Dragon Boat League Toolkit

Database + PDF ingestion tooling for North American dragon boat regatta results.

## Setup

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -e .
```

## Initialize the database

```bash
dragonboat-db db init --db-url sqlite:///dragonboat.db
```

## Ingest a PDF

```bash
dragonboat-db ingest pdf \
  --db-url sqlite:///dragonboat.db \
  --pdf "C:\\Users\\Collin_Stubbs\\VSCODE\\dboatleague\\regattas\\example.pdf" \
  --regatta-name "Hamilton Dragon Boat Festival" \
  --venue "Hamilton Harbour" \
  --location "Hamilton, ON" \
  --start-date 2025-08-02 \
  --end-date 2025-08-03
```

## Export CSV

```bash
dragonboat-db export csv \
  --db-url sqlite:///dragonboat.db \
  --regatta-id <uuid> \
  --out results.csv
```

## Notes

- Supports Hamilton "Race Progression" and TIDBRF "Race Results Final.xlsx" layouts via pdfplumber.
- Raw rows are always stored in `raw_race_row` for audit and reprocessing.
- For SQLite, lane uniqueness per race is enforced in ingest logic.
