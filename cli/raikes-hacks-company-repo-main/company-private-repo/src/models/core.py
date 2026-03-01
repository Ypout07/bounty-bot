"""Core data models for TaskFlow."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any


class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


class Status(Enum):
    BACKLOG = "backlog"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"
    CANCELLED = "cancelled"


class UserRole(Enum):
    VIEWER = "viewer"
    CONTRIBUTOR = "contributor"
    MANAGER = "manager"
    ADMIN = "admin"


def _new_id() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    # Use timezone-aware UTC datetime for accuracy, then convert to naive 
    # to maintain compatibility with existing naive comparisons if any.
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------


@dataclass
class User:
    username: str
    email: str
    full_name: str
    role: UserRole = UserRole.CONTRIBUTOR
    id: str = field(default_factory=_new_id)
    created_at: datetime = field(default_factory=_now)
    is_active: bool = True
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role.value,
            "created_at": self.created_at.isoformat(),
            "is_active": self.is_active,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> User:
        user = cls(
            username=str(data["username"]),
            email=str(data["email"]),
            full_name=str(data["full_name"]),
            role=UserRole(data.get("role", "contributor")),
        )
        user.id = str(data.get("id", user.id))
        user.is_active = bool(data.get("is_active", True))
        user.metadata = dict(data.get("metadata", {}))
        if "created_at" in data:
            user.created_at = datetime.fromisoformat(str(data["created_at"]))
        return user


# ---------------------------------------------------------------------------
# Tag
# ---------------------------------------------------------------------------


@dataclass
class Tag:
    name: str
    color: str = "#6366f1"
    id: str = field(default_factory=_new_id)

    def to_dict(self) -> dict[str, Any]:
        return {"id": self.id, "name": self.name, "color": self.color}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Tag:
        return cls(
            name=str(data["name"]),
            color=str(data.get("color", "#6366f1")),
            id=str(data.get("id", _new_id())),
        )


# ---------------------------------------------------------------------------
# Comment
# ---------------------------------------------------------------------------


@dataclass
class Comment:
    author_id: str
    content: str
    id: str = field(default_factory=_new_id)
    created_at: datetime = field(default_factory=_now)
    edited_at: datetime | None = None
    mentions: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "author_id": self.author_id,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "edited_at": self.edited_at.isoformat() if self.edited_at else None,
            "mentions": self.mentions,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Comment:
        comment = cls(
            author_id=str(data["author_id"]),
            content=str(data["content"]),
            id=str(data.get("id", _new_id())),
            mentions=list(data.get("mentions", [])),
        )
        if "created_at" in data:
            comment.created_at = datetime.fromisoformat(str(data["created_at"]))
        if data.get("edited_at"):
            comment.edited_at = datetime.fromisoformat(str(data["edited_at"]))
        return comment


# ---------------------------------------------------------------------------
# Attachment
# ---------------------------------------------------------------------------


@dataclass
class Attachment:
    filename: str
    file_path: str
    uploaded_by: str
    file_size: int
    id: str = field(default_factory=_new_id)
    uploaded_at: datetime = field(default_factory=_now)
    mime_type: str = "application/octet-stream"

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "filename": self.filename,
            "file_path": self.file_path,
            "uploaded_by": self.uploaded_by,
            "file_size": self.file_size,
            "uploaded_at": self.uploaded_at.isoformat(),
            "mime_type": self.mime_type,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Attachment:
        attachment = cls(
            filename=str(data["filename"]),
            file_path=str(data["file_path"]),
            uploaded_by=str(data["uploaded_by"]),
            file_size=int(data["file_size"]),
            id=str(data.get("id", _new_id())),
            mime_type=str(data.get("mime_type", "application/octet-stream")),
        )
        if "uploaded_at" in data:
            attachment.uploaded_at = datetime.fromisoformat(str(data["uploaded_at"]))
        return attachment


# ---------------------------------------------------------------------------
# Task
# ---------------------------------------------------------------------------


@dataclass
class Task:
    title: str
    project_id: str
    creator_id: str
    description: str = ""
    status: Status = Status.TODO
    priority: Priority = Priority.MEDIUM
    assignee_ids: list[str] = field(default_factory=list)
    tag_ids: list[str] = field(default_factory=list)
    id: str = field(default_factory=_new_id)
    created_at: datetime = field(default_factory=_now)
    updated_at: datetime = field(default_factory=_now)
    due_date: datetime | None = None
    estimated_hours: float | None = None
    actual_hours: float = 0.0
    parent_task_id: str | None = None
    subtask_ids: list[str] = field(default_factory=list)
    comments: list[Comment] = field(default_factory=list)
    attachments: list[Attachment] = field(default_factory=list)
    watchers: list[str] = field(default_factory=list)
    custom_fields: dict[str, Any] = field(default_factory=dict)
    story_points: int | None = None
    sprint_id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "project_id": self.project_id,
            "creator_id": self.creator_id,
            "status": self.status.value,
            "priority": self.priority.value,
            "assignee_ids": self.assignee_ids,
            "tag_ids": self.tag_ids,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "estimated_hours": self.estimated_hours,
            "actual_hours": self.actual_hours,
            "parent_task_id": self.parent_task_id,
            "subtask_ids": self.subtask_ids,
            "comments": [c.to_dict() for c in self.comments],
            "attachments": [a.to_dict() for a in self.attachments],
            "watchers": self.watchers,
            "custom_fields": self.custom_fields,
            "story_points": self.story_points,
            "sprint_id": self.sprint_id,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Task:
        task = cls(
            title=str(data["title"]),
            project_id=str(data["project_id"]),
            creator_id=str(data["creator_id"]),
            description=str(data.get("description", "")),
            status=Status(data.get("status", "todo")),
            priority=Priority(int(data.get("priority", 2))),
        )
        task.id = str(data.get("id", task.id))
        task.assignee_ids = list(data.get("assignee_ids", []))
        task.tag_ids = list(data.get("tag_ids", []))
        task.estimated_hours = (
            float(data["estimated_hours"])
            if data.get("estimated_hours") is not None
            else None
        )
        task.actual_hours = float(data.get("actual_hours", 0.0))
        task.parent_task_id = (
            str(data["parent_task_id"]) if data.get("parent_task_id") else None
        )
        task.subtask_ids = list(data.get("subtask_ids", []))
        task.watchers = list(data.get("watchers", []))
        task.custom_fields = dict(data.get("custom_fields", {}))
        task.story_points = (
            int(data["story_points"]) if data.get("story_points") is not None else None
        )
        task.sprint_id = str(data["sprint_id"]) if data.get("sprint_id") else None
        
        # New: load comments and attachments
        if "comments" in data:
            task.comments = [Comment.from_dict(c) for c in data["comments"]]
        if "attachments" in data:
            task.attachments = [Attachment.from_dict(a) for a in data["attachments"]]
            
        if data.get("due_date"):
            task.due_date = datetime.fromisoformat(str(data["due_date"]))
        if data.get("created_at"):
            task.created_at = datetime.fromisoformat(str(data["created_at"]))
        if data.get("updated_at"):
            task.updated_at = datetime.fromisoformat(str(data["updated_at"]))
        return task


# ---------------------------------------------------------------------------
# Sprint
# ---------------------------------------------------------------------------


@dataclass
class Sprint:
    name: str
    project_id: str
    start_date: datetime
    end_date: datetime
    goal: str = ""
    id: str = field(default_factory=_new_id)
    created_at: datetime = field(default_factory=_now)
    is_active: bool = False
    velocity: float | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "project_id": self.project_id,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "goal": self.goal,
            "created_at": self.created_at.isoformat(),
            "is_active": self.is_active,
            "velocity": self.velocity,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Sprint:
        sprint = cls(
            name=str(data["name"]),
            project_id=str(data["project_id"]),
            start_date=datetime.fromisoformat(str(data["start_date"])),
            end_date=datetime.fromisoformat(str(data["end_date"])),
            goal=str(data.get("goal", "")),
        )
        sprint.id = str(data.get("id", sprint.id))
        if "created_at" in data:
            sprint.created_at = datetime.fromisoformat(str(data["created_at"]))
        sprint.is_active = bool(data.get("is_active", False))
        sprint.velocity = (
            float(data["velocity"]) if data.get("velocity") is not None else None
        )
        return sprint


# ---------------------------------------------------------------------------
# Project
# ---------------------------------------------------------------------------


@dataclass
class Project:
    name: str
    owner_id: str
    description: str = ""
    id: str = field(default_factory=_new_id)
    created_at: datetime = field(default_factory=_now)
    updated_at: datetime = field(default_factory=_now)
    is_archived: bool = False
    member_ids: list[str] = field(default_factory=list)
    tag_ids: list[str] = field(default_factory=list)
    settings: dict[str, Any] = field(default_factory=dict)
    default_assignee_id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "owner_id": self.owner_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "is_archived": self.is_archived,
            "member_ids": self.member_ids,
            "tag_ids": self.tag_ids,
            "settings": self.settings,
            "default_assignee_id": self.default_assignee_id,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Project:
        proj = cls(
            name=str(data["name"]),
            owner_id=str(data["owner_id"]),
            description=str(data.get("description", "")),
        )
        proj.id = str(data.get("id", proj.id))
        proj.is_archived = bool(data.get("is_archived", False))
        proj.member_ids = list(data.get("member_ids", []))
        proj.tag_ids = list(data.get("tag_ids", []))
        proj.settings = dict(data.get("settings", {}))
        proj.default_assignee_id = (
            str(data["default_assignee_id"])
            if data.get("default_assignee_id")
            else None
        )
        if data.get("created_at"):
            proj.created_at = datetime.fromisoformat(str(data["created_at"]))
        if data.get("updated_at"):
            proj.updated_at = datetime.fromisoformat(str(data["updated_at"]))
        return proj
