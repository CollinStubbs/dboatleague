from dragonboat_db.ingest.parsing import canonicalize_team_name


def test_canonicalize_team_name_strips_codes_and_tags():
    assert canonicalize_team_name("Harbor Wake (061)") == "Harbor Wake"
    assert canonicalize_team_name("Great Lakes (S)") == "Great Lakes"
    assert canonicalize_team_name("  River   Dragons ") == "River Dragons"
