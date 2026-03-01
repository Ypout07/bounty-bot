"""User, Project, Tag, and Sprint services."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from models.core import Project, Sprint, Tag, User, UserRole
from models.store import DataStore, NotFoundError, StorageError


class PermissionError(Exception):
    pass


class UserService:
    def __init__(self, store: DataStore) -> None:
        self._store = store

    def create_user(
        self,
        username: str,
        email: str,
        full_name: str,
        role: UserRole = UserRole.CONTRIBUTOR,
    ) -> User:
        if not username or not email:
            raise StorageError("Username and email are required")
        if "@" not in email:
            raise StorageError("Invalid email address")
        for user in self._store.list_users():
            if user.email.lower() == email.lower():
                raise StorageError(f"Email '{email}' is already registered")
        user = User(username=username, email=email, full_name=full_name, role=role)
        return self._store.add_user(user)

    def get_user(self, user_id: str) -> User:
        return self._store.get_user(user_id)

    def get_by_username(self, username: str) -> User | None:
        return self._store.get_user_by_username(username)

    def update_profile(
        self,
        user_id: str,
        full_name: str | None = None,
        email: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> User:
        user = self._store.get_user(user_id)
        if full_name is not None:
            user.full_name = full_name
        if email is not None:
            if "@" not in email:
                raise StorageError("Invalid email address")
            user.email = email
        if metadata is not None:
            user.metadata.update(metadata)
        return self._store.update_user(user)

    def deactivate_user(self, user_id: str) -> User:
        user = self._store.get_user(user_id)
        user.is_active = False
        return self._store.update_user(user)

    def change_role(self, user_id: str, new_role: UserRole, actor_id: str) -> User:
        actor = self._store.get_user(actor_id)
        if actor.role != UserRole.ADMIN:
            raise PermissionError("Only admins can change user roles")
        user = self._store.get_user(user_id)
        user.role = new_role
        return self._store.update_user(user)

    def list_users(self, active_only: bool = True) -> list[User]:
        return self._store.list_users(active_only=active_only)


class ProjectService:
    def __init__(self, store: DataStore) -> None:
        self._store = store

    def create_project(
        self,
        name: str,
        owner_id: str,
        description: str = "",
        settings: dict[str, Any] | None = None,
    ) -> Project:
        if not name:
            raise StorageError("Project name is required")
        self._store.get_user(owner_id)
        project = Project(
            name=name,
            owner_id=owner_id,
            description=description,
            settings=settings or {},
        )
        project.member_ids.append(owner_id)
        return self._store.add_project(project)

    def get_project(self, project_id: str) -> Project:
        return self._store.get_project(project_id)

    def update_project(
        self,
        project_id: str,
        actor_id: str,
        name: str | None = None,
        description: str | None = None,
        settings: dict[str, Any] | None = None,
        default_assignee_id: str | None = None,
    ) -> Project:
        project = self._store.get_project(project_id)
        self._require_manager(project, actor_id)
        if name is not None:
            project.name = name
        if description is not None:
            project.description = description
        if settings is not None:
            project.settings.update(settings)
        if default_assignee_id is not None:
            self._store.get_user(default_assignee_id)
            project.default_assignee_id = default_assignee_id
        return self._store.update_project(project)

    def archive_project(self, project_id: str, actor_id: str) -> Project:
        project = self._store.get_project(project_id)
        self._require_manager(project, actor_id)
        project.is_archived = True
        return self._store.update_project(project)

    def add_member(self, project_id: str, user_id: str, actor_id: str) -> Project:
        project = self._store.get_project(project_id)
        self._require_manager(project, actor_id)
        self._store.get_user(user_id)
        if user_id not in project.member_ids:
            project.member_ids.append(user_id)
        return self._store.update_project(project)

    def remove_member(self, project_id: str, user_id: str, actor_id: str) -> Project:
        project = self._store.get_project(project_id)
        self._require_manager(project, actor_id)
        if user_id == project.owner_id:
            raise StorageError("Cannot remove the project owner")
        if user_id in project.member_ids:
            project.member_ids.remove(user_id)
        return self._store.update_project(project)

    def list_projects(
        self,
        user_id: str | None = None,
        include_archived: bool = False,
    ) -> list[Project]:
        if user_id is not None:
            return self._store.list_projects_for_user(user_id, include_archived)
        return self._store.list_projects(include_archived)

    def get_project_members(self, project_id: str) -> list[User]:
        project = self._store.get_project(project_id)
        members: list[User] = []
        for uid in project.member_ids:
            try:
                members.append(self._store.get_user(uid))
            except NotFoundError:
                pass
        return members

    def _require_manager(self, project: Project, actor_id: str) -> None:
        """
        Check if the actor has manager privileges for the project.
        ADMIN and MANAGER roles have global access.
        Project owner has access even if they have a CONTRIBUTOR role.
        """
        actor = self._store.get_user(actor_id)
        
        # Admin and Manager roles are globally authorized
        if actor.role in (UserRole.ADMIN, UserRole.MANAGER):
            return
            
        # Project owner is authorized regardless of role
        if actor_id == project.owner_id:
            return

        # Check membership for non-managers
        if actor_id not in project.member_ids:
            raise PermissionError("You are not a member of this project")
            
        # They are a member but not a manager/owner
        raise PermissionError("Manager or owner privileges required")


class TagService:
    def __init__(self, store: DataStore) -> None:
        self._store = store

    def create_tag(self, name: str, color: str = "#6366f1") -> Tag:
        existing = self._store.get_tag_by_name(name)
        if existing is not None:
            return existing
        tag = Tag(name=name, color=color)
        return self._store.add_tag(tag)

    def list_tags(self) -> list[Tag]:
        return self._store.list_tags()

    def get_tag(self, tag_id: str) -> Tag:
        return self._store.get_tag(tag_id)


class SprintService:
    def __init__(self, store: DataStore) -> None:
        self._store = store

    def create_sprint(
        self,
        project_id: str,
        name: str,
        start_date: datetime,
        end_date: datetime,
        goal: str = "",
    ) -> Sprint:
        if end_date <= start_date:
            raise StorageError("Sprint end date must be after start date")
        self._store.get_project(project_id)
        sprint = Sprint(
            name=name,
            project_id=project_id,
            start_date=start_date,
            end_date=end_date,
            goal=goal,
        )
        return self._store.add_sprint(sprint)

    def activate_sprint(self, sprint_id: str) -> Sprint:
        sprint = self._store.get_sprint(sprint_id)
        for s in self._store.list_sprints(project_id=sprint.project_id):
            if s.is_active and s.id != sprint_id:
                s.is_active = False
                self._store.update_sprint(s)
        sprint.is_active = True
        return self._store.update_sprint(sprint)

    def complete_sprint(self, sprint_id: str) -> Sprint:
        sprint = self._store.get_sprint(sprint_id)
        sprint.is_active = False
        tasks = self._store.list_tasks_in_sprint(sprint_id)
        from models.core import Status

        sprint.velocity = float(
            sum((t.story_points or 0) for t in tasks if t.status == Status.DONE)
        )
        return self._store.update_sprint(sprint)

    def list_sprints(self, project_id: str) -> list[Sprint]:
        return self._store.list_sprints(project_id=project_id)
