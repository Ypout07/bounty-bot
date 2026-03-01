"""Notification service — event log and per-user inbox."""

from __future__ import annotations

import threading
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable

from models.core import _now
from models.store import DataStore


class EventType(Enum):
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    TASK_DELETED = "task_deleted"
    TASK_ASSIGNED = "task_assigned"
    TASK_COMPLETED = "task_completed"
    COMMENT_ADDED = "comment_added"
    COMMENT_EDITED = "comment_edited"
    MENTION = "mention"
    DUE_DATE_APPROACHING = "due_date_approaching"
    SPRINT_STARTED = "sprint_started"
    SPRINT_COMPLETED = "sprint_completed"
    PROJECT_ARCHIVED = "project_archived"
    MEMBER_ADDED = "member_added"
    MEMBER_REMOVED = "member_removed"


def _new_id() -> str:
    return str(uuid.uuid4())


@dataclass
class Event:
    event_type: EventType
    payload: dict[str, Any]
    actor_id: str | None = None
    id: str = field(default_factory=_new_id)
    occurred_at: datetime = field(default_factory=_now)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "event_type": self.event_type.value,
            "payload": self.payload,
            "actor_id": self.actor_id,
            "occurred_at": self.occurred_at.isoformat(),
        }


@dataclass
class Notification:
    recipient_id: str
    event: Event
    message: str
    id: str = field(default_factory=_new_id)
    created_at: datetime = field(default_factory=_now)
    is_read: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "recipient_id": self.recipient_id,
            "event": self.event.to_dict(),
            "message": self.message,
            "created_at": self.created_at.isoformat(),
            "is_read": self.is_read,
        }


EventCallback = Callable[[Event], None]


class NotificationService:
    def __init__(self, max_event_log: int = 1000, max_inbox_size: int = 200) -> None:
        self._lock = threading.RLock()
        self._event_log: list[Event] = []
        self._inbox: dict[str, list[Notification]] = {}
        self._subscribers: dict[EventType, list[EventCallback]] = {}
        self._max_event_log = max_event_log
        self._max_inbox_size = max_inbox_size

    def publish(self, event: Event) -> None:
        with self._lock:
            self._event_log.append(event)
            # Cap event log size
            if len(self._event_log) > self._max_event_log:
                self._event_log = self._event_log[-self._max_event_log:]
                
            callbacks = list(self._subscribers.get(event.event_type, []))
        for cb in callbacks:
            try:
                cb(event)
            except Exception:
                pass

    def subscribe(self, event_type: EventType, callback: EventCallback) -> None:
        with self._lock:
            self._subscribers.setdefault(event_type, []).append(callback)

    def unsubscribe(self, event_type: EventType, callback: EventCallback) -> None:
        with self._lock:
            callbacks = self._subscribers.get(event_type, [])
            try:
                callbacks.remove(callback)
            except ValueError:
                pass

    def send_notification(
        self, recipient_id: str, event: Event, message: str
    ) -> Notification:
        notif = Notification(recipient_id=recipient_id, event=event, message=message)
        with self._lock:
            inbox = self._inbox.setdefault(recipient_id, [])
            inbox.append(notif)
            # Cap inbox size
            if len(inbox) > self._max_inbox_size:
                # Prioritize keeping unread notifications? 
                # For simplicity, just keep the latest ones.
                self._inbox[recipient_id] = inbox[-self._max_inbox_size:]
        return notif

    def get_notifications(
        self, user_id: str, unread_only: bool = False, limit: int = 50
    ) -> list[Notification]:
        with self._lock:
            notifs = list(self._inbox.get(user_id, []))
        if unread_only:
            notifs = [n for n in notifs if not n.is_read]
        notifs.sort(key=lambda n: n.created_at, reverse=True)
        return notifs[:limit]

    def mark_read(self, user_id: str, notification_id: str) -> bool:
        with self._lock:
            for notif in self._inbox.get(user_id, []):
                if notif.id == notification_id:
                    notif.is_read = True
                    return True
        return False

    def mark_all_read(self, user_id: str) -> int:
        count = 0
        with self._lock:
            for notif in self._inbox.get(user_id, []):
                if not notif.is_read:
                    notif.is_read = True
                    count += 1
        return count

    def get_unread_count(self, user_id: str) -> int:
        with self._lock:
            return sum(1 for n in self._inbox.get(user_id, []) if not n.is_read)

    def clear_inbox(self, user_id: str) -> None:
        with self._lock:
            self._inbox[user_id] = []

    def get_event_log(
        self,
        event_type: EventType | None = None,
        actor_id: str | None = None,
        since: datetime | None = None,
        limit: int = 100,
    ) -> list[Event]:
        with self._lock:
            events = list(self._event_log)
        if event_type is not None:
            events = [e for e in events if e.event_type == event_type]
        if actor_id is not None:
            events = [e for e in events if e.actor_id == actor_id]
        if since is not None:
            events = [e for e in events if e.occurred_at >= since]
        events.sort(key=lambda e: e.occurred_at, reverse=True)
        return events[:limit]


class TaskEventEmitter:
    def __init__(
        self, notification_service: NotificationService, store: DataStore
    ) -> None:
        self._notif = notification_service
        self._store = store

    def on_task_created(self, task_id: str, project_id: str, creator_id: str) -> None:
        event = Event(
            event_type=EventType.TASK_CREATED,
            payload={"task_id": task_id, "project_id": project_id},
            actor_id=creator_id,
        )
        self._notif.publish(event)
        try:
            project = self._store.get_project(project_id)
            for member_id in project.member_ids:
                if member_id != creator_id:
                    _ = self._notif.send_notification(
                        recipient_id=member_id,
                        event=event,
                        message=f"A new task was created in project {project.name}",
                    )
        except Exception:
            pass

    def on_task_assigned(self, task_id: str, assignee_id: str, actor_id: str) -> None:
        event = Event(
            event_type=EventType.TASK_ASSIGNED,
            payload={"task_id": task_id, "assignee_id": assignee_id},
            actor_id=actor_id,
        )
        self._notif.publish(event)
        if assignee_id != actor_id:
            _ = self._notif.send_notification(
                recipient_id=assignee_id,
                event=event,
                message=f"You have been assigned task {task_id}",
            )

    def on_comment_mention(
        self, task_id: str, mentioned_user_id: str, author_id: str
    ) -> None:
        event = Event(
            event_type=EventType.MENTION,
            payload={"task_id": task_id, "mentioned_user_id": mentioned_user_id},
            actor_id=author_id,
        )
        self._notif.publish(event)
        _ = self._notif.send_notification(
            recipient_id=mentioned_user_id,
            event=event,
            message=f"You were mentioned in a comment on task {task_id}",
        )

    def on_task_completed(
        self, task_id: str, project_id: str, actor_id: str, watchers: list[str]
    ) -> None:
        event = Event(
            event_type=EventType.TASK_COMPLETED,
            payload={"task_id": task_id, "project_id": project_id},
            actor_id=actor_id,
        )
        self._notif.publish(event)
        for watcher_id in watchers:
            if watcher_id != actor_id:
                _ = self._notif.send_notification(
                    recipient_id=watcher_id,
                    event=event,
                    message=f"Task {task_id} has been completed",
                )
