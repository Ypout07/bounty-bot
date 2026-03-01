"""In-memory data store with optional JSON persistence."""

from __future__ import annotations

import json
import os
import threading
from datetime import datetime, timezone
from typing import Any

from models.core import Project, Sprint, Tag, Task, User, _now


class StorageError(Exception):
    pass


class NotFoundError(StorageError):
    pass


class DataStore:
    """Thread-safe in-memory store with optional JSON persistence."""

    def __init__(self, persist_path: str | None = None) -> None:
        self._lock = threading.RLock()
        self._users: dict[str, User] = {}
        self._projects: dict[str, Project] = {}
        self._tasks: dict[str, Task] = {}
        self._tags: dict[str, Tag] = {}
        self._sprints: dict[str, Sprint] = {}
        
        # Indexes for performance
        self._project_tasks_map: dict[str, set[str]] = {}
        self._project_sprints_map: dict[str, set[str]] = {}
        
        self._persist_path = persist_path

        if persist_path and os.path.exists(persist_path):
            self.load(persist_path)

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------

    def add_user(self, user: User) -> User:
        with self._lock:
            if user.id in self._users:
                raise StorageError(f"User {user.id} already exists")
            for u in self._users.values():
                if u.username == user.username:
                    raise StorageError(f"Username '{user.username}' is already taken")
            self._users[user.id] = user
            return user

    def get_user(self, user_id: str) -> User:
        with self._lock:
            if user_id not in self._users:
                raise NotFoundError(f"User {user_id} not found")
            return self._users[user_id]

    def get_user_by_username(self, username: str) -> User | None:
        with self._lock:
            for user in self._users.values():
                if user.username == username:
                    return user
            return None

    def list_users(self, active_only: bool = False) -> list[User]:
        with self._lock:
            users = list(self._users.values())
        if active_only:
            users = [u for u in users if u.is_active]
        return users

    def update_user(self, user: User) -> User:
        with self._lock:
            if user.id not in self._users:
                raise NotFoundError(f"User {user.id} not found")
            self._users[user.id] = user
            return user

    def delete_user(self, user_id: str) -> None:
        with self._lock:
            if user_id not in self._users:
                raise NotFoundError(f"User {user_id} not found")
            del self._users[user_id]

    # ------------------------------------------------------------------
    # Projects
    # ------------------------------------------------------------------

    def add_project(self, project: Project) -> Project:
        with self._lock:
            if project.id in self._projects:
                raise StorageError(f"Project {project.id} already exists")
            self._projects[project.id] = project
            self._project_tasks_map.setdefault(project.id, set())
            self._project_sprints_map.setdefault(project.id, set())
            return project

    def get_project(self, project_id: str) -> Project:
        with self._lock:
            if project_id not in self._projects:
                raise NotFoundError(f"Project {project_id} not found")
            return self._projects[project_id]

    def list_projects(self, include_archived: bool = False) -> list[Project]:
        with self._lock:
            projects = list(self._projects.values())
        if not include_archived:
            projects = [p for p in projects if not p.is_archived]
        return projects

    def list_projects_for_user(
        self, user_id: str, include_archived: bool = False
    ) -> list[Project]:
        with self._lock:
            projects = list(self._projects.values())
        return [
            p
            for p in projects
            if (include_archived or not p.is_archived)
            and (p.owner_id == user_id or user_id in p.member_ids)
        ]

    def update_project(self, project: Project) -> Project:
        with self._lock:
            if project.id not in self._projects:
                raise NotFoundError(f"Project {project.id} not found")
            project.updated_at = _now()
            self._projects[project.id] = project
            return project

    def delete_project(self, project_id: str) -> None:
        with self._lock:
            if project_id not in self._projects:
                raise NotFoundError(f"Project {project_id} not found")
            del self._projects[project_id]
            self._project_tasks_map.pop(project_id, None)
            self._project_sprints_map.pop(project_id, None)

    # ------------------------------------------------------------------
    # Tasks
    # ------------------------------------------------------------------

    def add_task(self, task: Task) -> Task:
        with self._lock:
            if task.id in self._tasks:
                raise StorageError(f"Task {task.id} already exists")
            self._tasks[task.id] = task
            self._project_tasks_map.setdefault(task.project_id, set()).add(task.id)
            return task

    def get_task(self, task_id: str) -> Task:
        with self._lock:
            if task_id not in self._tasks:
                raise NotFoundError(f"Task {task_id} not found")
            return self._tasks[task_id]

    def list_tasks(self, project_id: str | None = None) -> list[Task]:
        with self._lock:
            if project_id is not None:
                task_ids = self._project_tasks_map.get(project_id, set())
                return [self._tasks[tid] for tid in task_ids if tid in self._tasks]
            return list(self._tasks.values())

    def list_tasks_for_user(self, user_id: str) -> list[Task]:
        with self._lock:
            return [t for t in self._tasks.values() if user_id in t.assignee_ids]

    def list_tasks_in_sprint(self, sprint_id: str) -> list[Task]:
        with self._lock:
            return [t for t in self._tasks.values() if t.sprint_id == sprint_id]

    def update_task(self, task: Task) -> Task:
        with self._lock:
            if task.id not in self._tasks:
                raise NotFoundError(f"Task {task.id} not found")
            task.updated_at = _now()
            # Handle project move if project_id changed (though UI might not support it yet)
            old_task = self._tasks[task.id]
            if old_task.project_id != task.project_id:
                if old_task.project_id in self._project_tasks_map:
                    self._project_tasks_map[old_task.project_id].discard(task.id)
                self._project_tasks_map.setdefault(task.project_id, set()).add(task.id)
                
            self._tasks[task.id] = task
            return task

    def delete_task(self, task_id: str) -> None:
        with self._lock:
            if task_id not in self._tasks:
                raise NotFoundError(f"Task {task_id} not found")
            task = self._tasks[task_id]
            if task.project_id in self._project_tasks_map:
                self._project_tasks_map[task.project_id].discard(task_id)
            del self._tasks[task_id]

    # ------------------------------------------------------------------
    # Tags
    # ------------------------------------------------------------------

    def add_tag(self, tag: Tag) -> Tag:
        with self._lock:
            self._tags[tag.id] = tag
            return tag

    def get_tag(self, tag_id: str) -> Tag:
        with self._lock:
            if tag_id not in self._tags:
                raise NotFoundError(f"Tag {tag_id} not found")
            return self._tags[tag_id]

    def list_tags(self) -> list[Tag]:
        with self._lock:
            return list(self._tags.values())

    def get_tag_by_name(self, name: str) -> Tag | None:
        with self._lock:
            for tag in self._tags.values():
                if tag.name.lower() == name.lower():
                    return tag
            return None

    # ------------------------------------------------------------------
    # Sprints
    # ------------------------------------------------------------------

    def add_sprint(self, sprint: Sprint) -> Sprint:
        with self._lock:
            self._sprints[sprint.id] = sprint
            self._project_sprints_map.setdefault(sprint.project_id, set()).add(sprint.id)
            return sprint

    def get_sprint(self, sprint_id: str) -> Sprint:
        with self._lock:
            if sprint_id not in self._sprints:
                raise NotFoundError(f"Sprint {sprint_id} not found")
            return self._sprints[sprint_id]

    def list_sprints(self, project_id: str | None = None) -> list[Sprint]:
        with self._lock:
            if project_id is not None:
                sprint_ids = self._project_sprints_map.get(project_id, set())
                return [self._sprints[sid] for sid in sprint_ids if sid in self._sprints]
            return list(self._sprints.values())

    def update_sprint(self, sprint: Sprint) -> Sprint:
        with self._lock:
            if sprint.id not in self._sprints:
                raise NotFoundError(f"Sprint {sprint.id} not found")
            self._sprints[sprint.id] = sprint
            return sprint

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self, path: str | None = None) -> None:
        target = path or self._persist_path
        if not target:
            return
        with self._lock:
            data: dict[str, Any] = {
                "users": {uid: u.to_dict() for uid, u in self._users.items()},
                "projects": {pid: p.to_dict() for pid, p in self._projects.items()},
                "tasks": {tid: t.to_dict() for tid, t in self._tasks.items()},
                "tags": {gid: g.to_dict() for gid, g in self._tags.items()},
                "sprints": {sid: s.to_dict() for sid, s in self._sprints.items()},
                "saved_at": _now().isoformat(),
            }
        with open(target, "w") as f:
            json.dump(data, f, indent=2)

    def load(self, path: str) -> None:
        with open(path) as f:
            data: dict[str, Any] = json.load(f)
        with self._lock:
            self.clear()
            for uid, udata in data.get("users", {}).items():
                self.add_user(User.from_dict(udata))
            for pid, pdata in data.get("projects", {}).items():
                self.add_project(Project.from_dict(pdata))
            for tid, tdata in data.get("tasks", {}).items():
                self.add_task(Task.from_dict(tdata))
            for gid, gdata in data.get("tags", {}).items():
                self.add_tag(Tag.from_dict(gdata))
            for sid, sdata in data.get("sprints", {}).items():
                self.add_sprint(Sprint.from_dict(sdata))

    def clear(self) -> None:
        with self._lock:
            self._users.clear()
            self._projects.clear()
            self._tasks.clear()
            self._tags.clear()
            self._sprints.clear()
            self._project_tasks_map.clear()
            self._project_sprints_map.clear()
