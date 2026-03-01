"""Task service — business logic for tasks, comments, search, and analytics."""

from __future__ import annotations

import re
from datetime import datetime, timedelta
from typing import Any

from models.core import Comment, Priority, Sprint, Status, Task, _now
from models.store import DataStore, NotFoundError, StorageError


class TaskService:
    def __init__(self, store: DataStore) -> None:
        self._store = store

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def create_task(
        self,
        title: str,
        project_id: str,
        creator_id: str,
        description: str = "",
        priority: Priority = Priority.MEDIUM,
        assignee_ids: list[str] | None = None,
        tag_ids: list[str] | None = None,
        due_date: datetime | None = None,
        estimated_hours: float | None = None,
        parent_task_id: str | None = None,
        story_points: int | None = None,
        sprint_id: str | None = None,
    ) -> Task:
        project = self._store.get_project(project_id)
        if project.is_archived:
            raise StorageError("Cannot add tasks to an archived project")

        self._store.get_user(creator_id)

        for uid in assignee_ids or []:
            self._store.get_user(uid)

        if parent_task_id is not None:
            parent = self._store.get_task(parent_task_id)
            if parent.project_id != project_id:
                raise StorageError("Parent task belongs to a different project")

        task = Task(
            title=title,
            project_id=project_id,
            creator_id=creator_id,
            description=description,
            priority=priority,
            assignee_ids=list(assignee_ids or []),
            tag_ids=list(tag_ids or []),
            due_date=due_date,
            estimated_hours=estimated_hours,
            parent_task_id=parent_task_id,
            story_points=story_points,
            sprint_id=sprint_id,
        )

        if not task.assignee_ids and project.default_assignee_id is not None:
            task.assignee_ids = [project.default_assignee_id]

        self._store.add_task(task)

        if parent_task_id is not None:
            parent = self._store.get_task(parent_task_id)
            parent.subtask_ids.append(task.id)
            self._store.update_task(parent)

        return task

    def update_task(self, task_id: str, **kwargs: Any) -> Task:
        task = self._store.get_task(task_id)
        allowed = {
            "title",
            "description",
            "status",
            "priority",
            "assignee_ids",
            "tag_ids",
            "due_date",
            "estimated_hours",
            "actual_hours",
            "story_points",
            "sprint_id",
            "custom_fields",
            "watchers",
        }
        for key, val in kwargs.items():
            if key not in allowed:
                raise StorageError(f"Field '{key}' cannot be updated via this method")
            setattr(task, key, val)
        return self._store.update_task(task)

    def delete_task(self, task_id: str) -> None:
        task = self._store.get_task(task_id)

        if task.parent_task_id is not None:
            try:
                parent = self._store.get_task(task.parent_task_id)
                if task_id in parent.subtask_ids:
                    parent.subtask_ids.remove(task_id)
                    self._store.update_task(parent)
            except NotFoundError:
                pass

        for sub_id in list(task.subtask_ids):
            try:
                self.delete_task(sub_id)
            except NotFoundError:
                pass

        self._store.delete_task(task_id)

    def get_task(self, task_id: str) -> Task:
        return self._store.get_task(task_id)

    # ------------------------------------------------------------------
    # Comments
    # ------------------------------------------------------------------

    def add_comment(self, task_id: str, author_id: str, content: str) -> Comment:
        self._store.get_task(task_id)
        self._store.get_user(author_id)

        mentions = re.findall(r"@(\w+)", content)
        mentioned_ids: list[str] = []
        for username in mentions:
            user = self._store.get_user_by_username(username)
            if user is not None:
                mentioned_ids.append(user.id)

        comment = Comment(author_id=author_id, content=content, mentions=mentioned_ids)
        task = self._store.get_task(task_id)
        task.comments.append(comment)
        self._store.update_task(task)
        return comment

    def edit_comment(self, task_id: str, comment_id: str, new_content: str) -> Comment:
        task = self._store.get_task(task_id)
        for comment in task.comments:
            if comment.id == comment_id:
                comment.content = new_content
                comment.edited_at = _now()
                self._store.update_task(task)
                return comment
        raise NotFoundError(f"Comment {comment_id} not found on task {task_id}")

    def delete_comment(self, task_id: str, comment_id: str) -> None:
        task = self._store.get_task(task_id)
        original_len = len(task.comments)
        task.comments = [c for c in task.comments if c.id != comment_id]
        if len(task.comments) == original_len:
            raise NotFoundError(f"Comment {comment_id} not found on task {task_id}")
        self._store.update_task(task)

    # ------------------------------------------------------------------
    # Search & filtering
    # ------------------------------------------------------------------

    def search_tasks(
        self,
        query: str = "",
        project_id: str | None = None,
        status: Status | None = None,
        priority: Priority | None = None,
        assignee_id: str | None = None,
        tag_id: str | None = None,
        sprint_id: str | None = None,
        due_before: datetime | None = None,
        due_after: datetime | None = None,
        overdue_only: bool = False,
    ) -> list[Task]:
        tasks = self._store.list_tasks(project_id=project_id)
        now = _now()
        results: list[Task] = []

        for task in tasks:
            if query:
                haystack = (task.title + " " + task.description).lower()
                if query.lower() not in haystack:
                    continue
            if status is not None and task.status != status:
                continue
            if priority is not None and task.priority != priority:
                continue
            if assignee_id is not None and assignee_id not in task.assignee_ids:
                continue
            if tag_id is not None and tag_id not in task.tag_ids:
                continue
            if sprint_id is not None and task.sprint_id != sprint_id:
                continue
            if due_before is not None and (
                task.due_date is None or task.due_date > due_before
            ):
                continue
            if due_after is not None and (
                task.due_date is None or task.due_date < due_after
            ):
                continue
            if overdue_only:
                if task.due_date is None or task.due_date >= now:
                    continue
                if task.status in (Status.DONE, Status.CANCELLED):
                    continue
            results.append(task)

        return results

    def get_tasks_by_priority(self, project_id: str) -> dict[str, list[Task]]:
        tasks = self._store.list_tasks(project_id=project_id)
        grouped: dict[str, list[Task]] = {p.name: [] for p in Priority}
        for task in tasks:
            grouped[task.priority.name].append(task)
        return grouped

    def get_task_hierarchy(self, task_id: str) -> dict[str, Any]:
        task = self._store.get_task(task_id)
        result: dict[str, Any] = task.to_dict()
        subtasks: list[dict[str, Any]] = []
        for sub_id in task.subtask_ids:
            try:
                subtasks.append(self.get_task_hierarchy(sub_id))
            except NotFoundError:
                pass
        result["subtasks"] = subtasks
        return result

    # ------------------------------------------------------------------
    # Analytics
    # ------------------------------------------------------------------

    def compute_project_stats(self, project_id: str) -> dict[str, Any]:
        tasks = self._store.list_tasks(project_id=project_id)
        now = _now()

        total = len(tasks)
        status_counts: dict[str, int] = {}
        priority_counts: dict[str, int] = {}
        total_estimated = 0.0
        total_actual = 0.0
        overdue = 0
        total_story_points = 0
        completed_story_points = 0
        assignee_load: dict[str, int] = {}

        for task in tasks:
            s = task.status.value
            status_counts[s] = status_counts.get(s, 0) + 1

            p = task.priority.name
            priority_counts[p] = priority_counts.get(p, 0) + 1

            if task.estimated_hours is not None:
                total_estimated += task.estimated_hours
            total_actual += task.actual_hours

            if (
                task.due_date is not None
                and task.due_date < now
                and task.status not in (Status.DONE, Status.CANCELLED)
            ):
                overdue += 1

            if task.story_points is not None:
                total_story_points += task.story_points
                if task.status == Status.DONE:
                    completed_story_points += task.story_points

            for uid in task.assignee_ids:
                assignee_load[uid] = assignee_load.get(uid, 0) + 1

        done_count = status_counts.get("done", 0)
        completion_rate = (done_count / total * 100) if total > 0 else 0.0
        hours_variance: float | None = (
            (total_actual - total_estimated) if total_estimated > 0 else None
        )

        return {
            "project_id": project_id,
            "total_tasks": total,
            "status_breakdown": status_counts,
            "priority_breakdown": priority_counts,
            "completion_rate": round(completion_rate, 2),
            "total_estimated_hours": round(total_estimated, 2),
            "total_actual_hours": round(total_actual, 2),
            "hours_variance": round(hours_variance, 2)
            if hours_variance is not None
            else None,
            "overdue_count": overdue,
            "total_story_points": total_story_points,
            "completed_story_points": completed_story_points,
            "assignee_load": assignee_load,
            "computed_at": now.isoformat(),
        }

    def compute_sprint_stats(self, sprint_id: str) -> dict[str, Any]:
        sprint: Sprint = self._store.get_sprint(sprint_id)
        tasks = self._store.list_tasks_in_sprint(sprint_id)

        total_points = sum(t.story_points or 0 for t in tasks)
        completed_points = sum(
            (t.story_points or 0) for t in tasks if t.status == Status.DONE
        )
        remaining_points = total_points - completed_points

        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.status == Status.DONE)

        # Use total_seconds to avoid integer division issues and get more precision
        duration_seconds = (sprint.end_date - sprint.start_date).total_seconds()
        elapsed_seconds = (_now() - sprint.start_date).total_seconds()
        elapsed_seconds = max(0.0, min(elapsed_seconds, duration_seconds))

        # Ideal remaining points based on a linear burndown
        if duration_seconds > 0:
            ideal_remaining = total_points * (1.0 - (elapsed_seconds / duration_seconds))
        else:
            ideal_remaining = 0.0 if _now() >= sprint.end_date else float(total_points)

        return {
            "sprint_id": sprint_id,
            "sprint_name": sprint.name,
            "total_story_points": total_points,
            "completed_story_points": completed_points,
            "remaining_story_points": remaining_points,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "days_elapsed": int(elapsed_seconds // 86400),
            "days_remaining": int((duration_seconds - elapsed_seconds) // 86400),
            "ideal_remaining_points": round(ideal_remaining, 1),
            "is_on_track": remaining_points <= (ideal_remaining + 0.01),
        }

    def get_workload_report(self, project_id: str) -> list[dict[str, Any]]:
        tasks = self._store.list_tasks(project_id=project_id)
        users = self._store.list_users(active_only=True)

        # Aggregate data by assignee for O(U + T) performance
        user_workload: dict[str, dict[str, Any]] = {}
        for user in users:
            user_workload[user.id] = {
                "user_id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "total_assigned": 0,
                "open_tasks": 0,
                "story_points": 0,
                "estimated_hours": 0.0,
            }

        for task in tasks:
            for assignee_id in task.assignee_ids:
                if assignee_id in user_workload:
                    stats = user_workload[assignee_id]
                    stats["total_assigned"] += 1
                    if task.status not in (Status.DONE, Status.CANCELLED):
                        stats["open_tasks"] += 1
                        stats["story_points"] += (task.story_points or 0)
                        stats["estimated_hours"] += (task.estimated_hours or 0.0)

        report = list(user_workload.values())
        report.sort(key=lambda x: int(x["open_tasks"]), reverse=True)
        return report

    def get_velocity_trend(
        self, project_id: str, last_n_sprints: int = 5
    ) -> list[dict[str, Any]]:
        sprints = self._store.list_sprints(project_id=project_id)
        now = _now()
        completed = sorted(
            [s for s in sprints if s.end_date < now],
            key=lambda s: s.end_date,
        )[-last_n_sprints:]

        trend: list[dict[str, Any]] = []
        for sprint in completed:
            sprint_tasks = self._store.list_tasks_in_sprint(sprint.id)
            points = sum(
                (t.story_points or 0) for t in sprint_tasks if t.status == Status.DONE
            )
            trend.append(
                {
                    "sprint_id": sprint.id,
                    "sprint_name": sprint.name,
                    "end_date": sprint.end_date.isoformat(),
                    "velocity": points,
                }
            )
        return trend

    def find_blocked_tasks(self, project_id: str) -> list[Task]:
        tasks = self._store.list_tasks(project_id=project_id)
        blocked: list[Task] = []
        now = _now()
        threshold = timedelta(days=14)

        for task in tasks:
            if task.status != Status.IN_PROGRESS:
                continue
            if now - task.updated_at > threshold:
                blocked.append(task)
                continue
            if (
                task.estimated_hours is not None
                and task.actual_hours > task.estimated_hours * 3
            ):
                blocked.append(task)

        return blocked
