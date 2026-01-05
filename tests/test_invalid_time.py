from dragonboat_db.ingest.parsing import derive_status


def test_invalid_time_sets_status_and_clears_ms():
    status, time_ms = derive_status(["10:00.00"], "10:00.00", place=None)
    assert status == "INVALID_TIME"
    assert time_ms is None
