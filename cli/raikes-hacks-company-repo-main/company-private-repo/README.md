# TaskFlow - Private Company Repo

A Python project management backend system for teams working with sprints, tasks, and project analytics.

## Structure

```
company-private-repo/
├── api/
│   └── app.py              # High-level API facade (main entry point)
├── models/
│   ├── core.py             # Data models: User, Project, Task, Sprint, etc.
│   └── store.py            # In-memory data store with JSON persistence
├── services/
│   ├── task_service.py     # Task CRUD, search, analytics
│   ├── project_service.py  # User, Project, Tag, Sprint services
│   └── notification_service.py  # Events and in-app notifications
├── utils/
│   ├── helpers.py          # String, date, and validation utilities
│   └── reporting.py        # CSV/text report generation
├── tests/
│   └── test.py             # Unit and integration tests
└── seed.py                 # Demo data generator
```

## Usage

### Run the tests

```bash
cd taskflow
python -m pytest tests/ -v
# or
python tests/test.py
```

### Generate demo data

```bash
cd company-private-repo
python seed.py
```

### Quick start

```python
from api.app import TaskFlowAPI
from models.core import Priority, UserRole
from datetime import datetime, timedelta

api = TaskFlowAPI()

# Create users
alice = api.users.create_user("alice", "alice@example.com", "Alice Smith", UserRole.ADMIN)
bob = api.users.create_user("bob", "bob@example.com", "Bob Jones")

# Create project and sprint
proj = api.projects.create_project("My Project", alice.id)
api.projects.add_member(proj.id, bob.id, alice.id)

sprint = api.sprints.create_sprint(
    proj.id, "Sprint 1",
    datetime.utcnow(),
    datetime.utcnow() + timedelta(weeks=2),
)
api.sprints.activate_sprint(sprint.id)

# Create a task
task = api.create_task(
    actor_id=alice.id,
    title="Build the dashboard",
    project_id=proj.id,
    priority=Priority.HIGH,
    assignee_ids=[bob.id],
    story_points=8,
    sprint_id=sprint.id,
)

# Get project analytics
stats = api.project_stats(proj.id)
print(stats)

# Persist
api.save("data.json")
```

## Key Features

- **Task management**: full CRUD with subtask hierarchies, comments, attachments metadata, custom fields
- **Sprint tracking**: velocity, burndown data, sprint activation/completion
- **Notifications**: event-driven in-app notifications with @mention parsing
- **Analytics**: project stats, workload reports, velocity trends, team performance
- **Export**: CSV task export, human-readable text reports
- **Persistence**: JSON serialization/deserialization
