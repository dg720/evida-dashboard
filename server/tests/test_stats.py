from stats import compute_stats


def test_compute_stats_mean_std():
    series = [
        {"steps": 1000},
        {"steps": 3000},
        {"steps": 5000},
    ]
    stats = compute_stats(series, ["steps"])
    assert stats["steps"]["mean"] == 3000
    assert stats["steps"]["std"] is not None
