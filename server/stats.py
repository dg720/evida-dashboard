from __future__ import annotations

import math
from typing import Iterable


def mean(values: Iterable[float]) -> float | None:
    values = list(values)
    if not values:
        return None
    return sum(values) / len(values)


def variance(values: Iterable[float]) -> float | None:
    values = list(values)
    if not values:
        return None
    avg = mean(values)
    if avg is None:
        return None
    return sum((value - avg) ** 2 for value in values) / len(values)


def std(values: Iterable[float]) -> float | None:
    var = variance(values)
    if var is None:
        return None
    return math.sqrt(var)


def round_value(value: float | None, digits: int = 2) -> float | None:
    if value is None:
        return None
    factor = 10**digits
    return round(value * factor) / factor


def compute_stats(series: list[dict], fields: list[str]) -> dict[str, dict[str, float | None]]:
    stats: dict[str, dict[str, float | None]] = {}
    for field in fields:
        values = [
            entry.get(field)
            for entry in series
            if isinstance(entry, dict) and isinstance(entry.get(field), (int, float))
        ]
        stats[field] = {
            "mean": round_value(mean(values)),
            "variance": round_value(variance(values)),
            "std": round_value(std(values)),
        }
    return stats
