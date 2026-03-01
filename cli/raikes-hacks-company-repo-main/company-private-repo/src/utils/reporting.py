"""Reporting utilities — CSV and text reports."""

from __future__ import annotations

import csv
import io
from datetime import date, datetime, timedelta
from typing import Any

from models.core import Sprint, Status, User, _now
from models.store import DataStore


def format_duration(hours: float | None) -> str:
    if hours is None:
        return "—"
    if hours < 1:
        return f"{int(hours * 60)}m"
    h = int(hours)
    m = int((hours - h) * 60)
    return f"{h}h {m}m" if m else f"{h}h"


def format_date(dt: datetime | None) -> str:
    if dt is None:
        return "—"
    return dt.strftime("%Y-%m-%d")


class ReportGenerator:
    def __init__(self, store: DataStore) -> None:
        self._store = store

    def _resolve_user(self, user_id: str) -> User | None:
        try:
            return self._store.get_user(user_id)
        except Exception:
            return None

    def _resolve_users(self, user_ids: list[str]) -> list[User]:
        result: list[User] = []
        for uid in user_ids:
            u = self._resolve_user(uid)
            if u is not None:
                result.append(u)
        return result

    # ------------------------------------------------------------------
    # CSV exports
    # ------------------------------------------------------------------

    def export_tasks_csv(self, project_id: str) -> str:
        tasks = self._store.list_tasks(project_id=project_id)
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=[
                "id",
                "title",
                "status",
                "priority",
                "assignees",
                "due_date",
                "estimated_hours",
                "actual_hours",
                "story_points",
                "created_at",
                "updated_at",
            ],
        )
        writer.writeheader()
        for task in tasks:
            assignees = ", ".join(
                u.full_name for u in self._resolve_users(task.assignee_ids)
            )
            writer.writerow(
                {
                    "id": task.id,
                    "title": task.title,
                    "status": task.status.value,
                    "priority": task.priority.name,
                    "assignees": assignees,
                    "due_date": format_date(task.due_date),
                    "estimated_hours": task.estimated_hours
                    if task.estimated_hours is not None
                    else "",
                    "actual_hours": task.actual_hours,
                    "story_points": task.story_points
                    if task.story_points is not None
                    else "",
                    "created_at": format_date(task.created_at),
                    "updated_at": format_date(task.updated_at),
                }
            )
        return output.getvalue()

    def export_members_csv(self, project_id: str) -> str:
        project = self._store.get_project(project_id)
        output = io.StringIO()
        writer = csv.DictWriter(
            output, fieldnames=["id", "username", "full_name", "email", "role"]
        )
        writer.writeheader()
        for uid in project.member_ids:
            user = self._resolve_user(uid)
            if user is not None:
                writer.writerow(
                    {
                        "id": user.id,
                        "username": user.username,
                        "full_name": user.full_name,
                        "email": user.email,
                        "role": user.role.value,
                    }
                )
        return output.getvalue()

    # ------------------------------------------------------------------
    # Text reports
    # ------------------------------------------------------------------

    def project_summary_text(self, project_id: str) -> str:
        project = self._store.get_project(project_id)
        tasks = self._store.list_tasks(project_id=project_id)
        now = _now()

        # Optimization: resolved user once
        owner = self._resolve_user(project.owner_id)
        owner_name = owner.full_name if owner is not None else "(unknown)"

        lines = [
            f"Project: {project.name}",
            f"{'=' * (len(project.name) + 9)}",
            f"Description: {project.description or '(none)'}",
            f"Owner: {owner_name}",
            f"Members: {len(project.member_ids)}",
            f"Archived: {'Yes' if project.is_archived else 'No'}",
            "",
            "Task Summary",
            "------------",
        ]

        status_counts: dict[str, int] = {}
        for task in tasks:
            s = task.status.value
            status_counts[s] = status_counts.get(s, 0) + 1

        for status_val, count in sorted(status_counts.items()):
            lines.append(f"  {status_val:15s}: {count}")

        total = len(tasks)
        done = status_counts.get("done", 0)
        if total:
            lines.append(
                f"\n  Total: {total}  |  Completed: {done}  |  Rate: {done / total * 100:.1f}%"
            )
        else:
            lines.append("\n  No tasks.")

        overdue = [
            t
            for t in tasks
            if t.due_date is not None
            and t.due_date < now
            and t.status not in (Status.DONE, Status.CANCELLED)
        ]
        lines.append(f"\nOverdue Tasks: {len(overdue)}")
        for t in overdue[:5]:
            lines.append(
                f"  - [{t.priority.name}] {t.title} (due {format_date(t.due_date)})"
            )
        if len(overdue) > 5:
            lines.append(f"  ... and {len(overdue) - 5} more")

        lines.append(f"\nGenerated: {now.strftime('%Y-%m-%d %H:%M UTC')}")
        return "\n".join(lines)

    def sprint_report_text(self, sprint_id: str) -> str:
        sprint: Sprint = self._store.get_sprint(sprint_id)
        tasks = self._store.list_tasks_in_sprint(sprint_id)
        now = _now()

        completed = [t for t in tasks if t.status == Status.DONE]
        in_progress = [t for t in tasks if t.status == Status.IN_PROGRESS]
        remaining = [t for t in tasks if t.status in (Status.TODO, Status.BACKLOG)]

        total_pts = sum(t.story_points or 0 for t in tasks)
        done_pts = sum(t.story_points or 0 for t in completed)

        lines = [
            f"Sprint: {sprint.name}",
            f"{'=' * (len(sprint.name) + 8)}",
            f"Goal    : {sprint.goal or '(none)'}",
            f"Period  : {format_date(sprint.start_date)} → {format_date(sprint.end_date)}",
            f"Status  : {'Active' if sprint.is_active else 'Inactive'}",
            "",
            (
                f"Progress: {done_pts}/{total_pts} story points ({done_pts / total_pts * 100:.1f}%)"
                if total_pts
                else "Progress: 0 story points"
            ),
            f"Tasks   : {len(completed)} done / {len(in_progress)} in progress / {len(remaining)} remaining",
            "",
            "Completed Tasks:",
        ]
        for t in completed:
            lines.append(f"  ✓ {t.title} ({t.story_points or '?'} pts)")
        lines.append("\nIn Progress:")
        for t in in_progress:
            lines.append(f"  ⚙ {t.title} ({t.story_points or '?'} pts)")
        lines.append("\nNot Started:")
        for t in remaining:
            lines.append(f"  ○ {t.title} ({t.story_points or '?'} pts)")

        lines.append(f"\nGenerated: {now.strftime('%Y-%m-%d %H:%M UTC')}")
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Burndown data
    # ------------------------------------------------------------------

    def get_burndown_data(self, sprint_id: str) -> list[dict[str, Any]]:
        sprint: Sprint = self._store.get_sprint(sprint_id)
        tasks = self._store.list_tasks_in_sprint(sprint_id)
        total_points = sum(t.story_points or 0 for t in tasks)

        completions: list[tuple[date, int]] = []
        for task in tasks:
            if task.status == Status.DONE and task.story_points is not None:
                completions.append((task.updated_at.date(), task.story_points))
        completions.sort(key=lambda x: x[0])

        data_points: list[dict[str, Any]] = []
        remaining = total_points
        current: date = sprint.start_date.date()
        end: date = sprint.end_date.date()
        comp_idx = 0

        while current <= end:
            while comp_idx < len(completions) and completions[comp_idx][0] == current:
                remaining -= completions[comp_idx][1]
                comp_idx += 1
            data_points.append(
                {
                    "date": current.isoformat(),
                    "remaining_points": max(0, remaining),
                }
            )
            current += timedelta(days=1)

        return data_points

    def team_performance_report(self, project_id: str) -> dict[str, Any]:
        """
        Generates a performance report for all active project members.
        
        Efficiency Ratio is calculated as (Total Estimated Hours / Total Actual Hours)
        for completed tasks. A ratio > 1.0 means tasks were completed faster than estimated.
        """
        tasks = self._store.list_tasks(project_id=project_id)
        users = self._store.list_users(active_only=True)
        now = _now()
        
        # Pre-map tasks to users to achieve O(U + T) complexity
        user_tasks_map: dict[str, list[Any]] = {u.id: [] for u in users}
        for t in tasks:
            for uid in t.assignee_ids:
                if uid in user_tasks_map:
                    user_tasks_map[uid].append(t)

        members: list[dict[str, Any]] = []
        for user in users:
            assigned_tasks = user_tasks_map[user.id]
            if not assigned_tasks:
                continue
                
            done_tasks = [t for t in assigned_tasks if t.status == Status.DONE]
            overdue_tasks = [
                t
                for t in assigned_tasks
                if t.due_date is not None
                and t.due_date < now
                and t.status not in (Status.DONE, Status.CANCELLED)
            ]
            total_est = sum(t.estimated_hours or 0.0 for t in done_tasks)
            total_actual = sum(t.actual_hours for t in done_tasks)
            
            # Efficiency > 1.0 means faster than estimated
            efficiency: float | None = (
                (total_est / total_actual) if total_actual > 0 else None
            )

            members.append(
                {
                    "user_id": user.id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "tasks_assigned": len(assigned_tasks),
                    "tasks_completed": len(done_tasks),
                    "tasks_overdue": len(overdue_tasks),
                    "completion_rate": round(
                        len(done_tasks) / len(assigned_tasks) * 100, 1
                    ),
                    "total_estimated_hours": round(total_est, 2),
                    "total_actual_hours": round(total_actual, 2),
                    "efficiency_ratio": round(efficiency, 3)
                    if efficiency is not None
                    else None,
                }
            )

        members.sort(key=lambda m: float(m["completion_rate"]), reverse=True)
        return {
            "project_id": project_id,
            "generated_at": now.isoformat(),
            "members": members,
        }
