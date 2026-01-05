from dragonboat_db.ingest.tidbrf import parse_tidbrf_page


def test_tidbrf_block_stitching_wraps_team_lines():
    text = """
WOMEN'S DIVISION A 200M FINAL
RACE LANE SD MIXED DIVISION QUALIFYING PL TIME
12 8:45 AM
1 U24 River
Dragons (061) 1 0:59.90
"""
    blocks, _ = parse_tidbrf_page(text, page_number=1)
    assert len(blocks) == 1
    entries = blocks[0].entries
    assert len(entries) == 1
    assert entries[0].seed_code == "U24"
    assert entries[0].raw_team_text == "River Dragons (061)"
    assert entries[0].time_display == "0:59.90"
