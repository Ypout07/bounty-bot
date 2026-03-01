"""General utility helpers for TaskFlow."""

from __future__ import annotations

import hashlib
import re
import unicodedata
from datetime import date, datetime, timedelta
from typing import Any

from models.core import _now


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


def truncate(text: str, max_length: int = 80, suffix: str = "...") -> str:
    if len(text) <= max_length:
        return text
    return text[: max_length - len(suffix)] + suffix


def extract_mentions(text: str) -> list[str]:
    return re.findall(r"@(\w+)", text)


def mask_email(email: str) -> str:
    parts = email.split("@")
    if len(parts) != 2:
        return email
    local, domain = parts
    if len(local) <= 2:
        return f"{'*' * len(local)}@{domain}"
    return f"{local[0]}{'*' * (len(local) - 2)}{local[-1]}@{domain}"


def is_overdue(due_date: datetime | None) -> bool:
    if due_date is None:
        return False
    return due_date < _now()


def days_until(dt: datetime | None) -> int | None:
    if dt is None:
        return None
    delta = dt.date() - _now().date()
    return delta.days


def business_days_until(dt: datetime | None) -> int | None:
    if dt is None:
        return None
    start: date = _now().date()
    end: date = dt.date()
    if end <= start:
        return 0
    count = 0
    current = start
    while current < end:
        if current.weekday() < 5:
            count += 1
        current += timedelta(days=1)
    return count


def format_relative(dt: datetime) -> str:
    now = _now()
    seconds = int((now - dt).total_seconds())
    if seconds < 0: # Future
        return "in the future"
    if seconds < 60:
        return "just now"
    if seconds < 3600:
        mins = seconds // 60
        return f"{mins} minute{'s' if mins != 1 else ''} ago"
    if seconds < 86400:
        hours = seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    days = seconds // 86400
    if days < 30:
        return f"{days} day{'s' if days != 1 else ''} ago"
    months = days // 30
    if months < 12:
        return f"{months} month{'s' if months != 1 else ''} ago"
    years = days // 365
    return f"{years} year{'s' if years != 1 else ''} ago"


def validate_hex_color(color: str) -> bool:
    return bool(re.match(r"^#[0-9A-Fa-f]{6}$", color))


def validate_story_points(points: Any) -> bool:
    valid_values = {1, 2, 3, 5, 8, 13, 21}
    try:
        return int(points) in valid_values
    except (TypeError, ValueError):
        return False


def paginate(
    items: list[Any], page: int = 1, per_page: int = 20
) -> tuple[list[Any], dict[str, Any]]:
    total = len(items)
    total_pages = max(1, (total + per_page - 1) // per_page)
    page = max(1, min(page, total_pages))
    start = (page - 1) * per_page
    end = start + per_page
    return items[start:end], {
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }


def short_id(full_id: str, length: int = 8) -> str:
    return hashlib.md5(full_id.encode()).hexdigest()[:length]


def generate_task_key(project_name: str, sequence: int) -> str:
    prefix = slugify(project_name)[:4].upper().replace("-", "")
    return f"{prefix}-{sequence}"
