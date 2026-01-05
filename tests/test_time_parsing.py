from dragonboat_db.ingest.parsing import parse_time_to_ms


def test_parse_time_to_ms_formats():
    assert parse_time_to_ms("02:47.23") == 167230
    assert parse_time_to_ms("0:59.90") == 59900
    assert parse_time_to_ms("59.90") == 59900
    assert parse_time_to_ms("12:11.80") == 731800
    assert parse_time_to_ms("bad") is None
