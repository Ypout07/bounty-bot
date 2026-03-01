"""TaskFlow API — high-level facade over all services."""

from __future__ import annotations

from typing import Any

from models.core import Status
from models.store import DataStore
from services.notification_service import NotificationService, TaskEventEmitter
from services.project_service import (
    ProjectService,
    SprintService,
    TagService,
    UserService,
)
from services.task_service import TaskService
from utils.helpers import paginate
from utils.reporting import ReportGenerator


class TaskFlowAPI:
    def __init__(self, persist_path: str | None = None) -> None:
        self._store = DataStore(persist_path=persist_path)
        self.users = UserService(self._store)
        self.projects = ProjectService(self._store)
        self.tasks = TaskService(self._store)
        self.tags = TagService(self._store)
        self.sprints = SprintService(self._store)
        self.notifications = NotificationService()
        self._emitter = TaskEventEmitter(self.notifications, self._store)
        self._reporter = ReportGenerator(self._store)

    def create_task(self, actor_id: str, **kwargs: Any) -> dict[str, Any]:
        task = self.tasks.create_task(creator_id=actor_id, **kwargs)
        self._emitter.on_task_created(task.id, task.project_id, actor_id)
        for uid in task.assignee_ids:
            self._emitter.on_task_assigned(task.id, uid, actor_id)
        return task.to_dict()

    def complete_task(self, task_id: str, actor_id: str) -> dict[str, Any]:
        task = self.tasks.update_task(task_id, status=Status.DONE)
        self._emitter.on_task_completed(
            task.id, task.project_id, actor_id, task.watchers
        )
        return task.to_dict()

    def add_comment(self, task_id: str, author_id: str, content: str) -> dict[str, Any]:
        comment = self.tasks.add_comment(task_id, author_id, content)
        for uid in comment.mentions:
            self._emitter.on_comment_mention(task_id, uid, author_id)
        return comment.to_dict()

    def search_tasks(
        self, page: int = 1, per_page: int = 20, **kwargs: Any
    ) -> dict[str, Any]:
        results = self.tasks.search_tasks(**kwargs)
        items, meta = paginate(results, page=page, per_page=per_page)
        return {
            "items": [t.to_dict() for t in items],
            "pagination": meta,
        }

    def project_report(self, project_id: str) -> str:
        return self._reporter.project_summary_text(project_id)

    def sprint_report(self, sprint_id: str) -> str:
        return self._reporter.sprint_report_text(sprint_id)

    def export_tasks(self, project_id: str) -> str:
        return self._reporter.export_tasks_csv(project_id)

    def project_stats(self, project_id: str) -> dict[str, Any]:
        return self.tasks.compute_project_stats(project_id)

    def workload_report(self, project_id: str) -> list[dict[str, Any]]:
        return self.tasks.get_workload_report(project_id)

    def velocity_trend(self, project_id: str, last_n: int = 5) -> list[dict[str, Any]]:
        return self.tasks.get_velocity_trend(project_id, last_n_sprints=last_n)

    def burndown_data(self, sprint_id: str) -> list[dict[str, Any]]:
        return self._reporter.get_burndown_data(sprint_id)

    def team_performance(self, project_id: str) -> dict[str, Any]:
        return self._reporter.team_performance_report(project_id)

    def save(self, path: str | None = None) -> None:
        self._store.save(path)

    def load(self, path: str) -> None:
        self._store.load(path)
