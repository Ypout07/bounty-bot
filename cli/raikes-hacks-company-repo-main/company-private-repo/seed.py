"""
seed.py — Populate the TaskFlow store with a realistic demo dataset.
Run from the taskflow/ directory: python seed.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "src"))

import random
from datetime import datetime, timedelta, timezone

from src.api.app import TaskFlowAPI
from src.models.core import Priority, Status, UserRole

UTC = timezone.utc

random.seed(42)

FIRST_NAMES = ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank", "Grace", "Hector"]
LAST_NAMES = ["Smith", "Jones", "White", "Brown", "Davis", "Wilson", "Moore", "Taylor"]

TASK_TITLES = [
    "Implement user authentication",
    "Fix memory leak in cache layer",
    "Add pagination to list endpoints",
    "Write unit tests for payment module",
    "Refactor database connection pool",
    "Update dependencies",
    "Design onboarding flow",
    "Fix broken links in documentation",
    "Add rate limiting middleware",
    "Improve error messages",
    "Set up monitoring alerts",
    "Optimize slow SQL queries",
    "Implement dark mode",
    "Add export to PDF feature",
    "Fix timezone handling in scheduler",
    "Write migration script for v2 schema",
    "Add two-factor authentication",
    "Performance test the API under load",
    "Implement webhook delivery system",
    "Clean up legacy feature flags",
]


def make_name(first, last):
    return f"{first} {last}"


def seed(api: TaskFlowAPI, output_path: str = "demo_data.json"):
    print("Seeding TaskFlow demo data...")

    # ── Users ──────────────────────────────────────────
    users = []
    roles = [UserRole.ADMIN, UserRole.MANAGER] + [UserRole.CONTRIBUTOR] * 6
    for i, (first, last) in enumerate(zip(FIRST_NAMES, LAST_NAMES)):
        username = first.lower()
        email = f"{username}@example.com"
        role = roles[i]
        u = api.users.create_user(username, email, make_name(first, last), role)
        users.append(u)
        print(f"  Created user: {u.username} ({u.role.value})")

    # ── Tags ───────────────────────────────────────────
    tag_defs = [
        ("bug", "#ef4444"),
        ("feature", "#22c55e"),
        ("documentation", "#3b82f6"),
        ("chore", "#a855f7"),
        ("performance", "#f59e0b"),
        ("security", "#0ea5e9"),
    ]
    tags = {name: api.tags.create_tag(name, color) for name, color in tag_defs}
    print(f"  Created {len(tags)} tags")

    # ── Projects ───────────────────────────────────────
    owner = users[0]
    projects = []
    for proj_name in ["Backend API", "Frontend Dashboard", "Mobile App"]:
        proj = api.projects.create_project(
            proj_name, owner.id, f"The {proj_name} project"
        )
        for u in users[1:]:
            api.projects.add_member(proj.id, u.id, owner.id)
        projects.append(proj)
        print(f"  Created project: {proj.name}")

    # ── Sprints ────────────────────────────────────────
    now = datetime.now(UTC)
    for proj in projects:
        for i in range(3):
            start = now - timedelta(weeks=(3 - i) * 2)
            end = start + timedelta(weeks=2)
            sprint = api.sprints.create_sprint(
                proj.id,
                f"Sprint {i + 1}",
                start,
                end,
                goal=f"Deliver sprint {i + 1} scope",
            )
            if i == 2:
                api.sprints.activate_sprint(sprint.id)
            else:
                api.sprints.complete_sprint(sprint.id)
        print(f"  Created 3 sprints for {proj.name}")

    # ── Tasks ──────────────────────────────────────────
    statuses = list(Status)
    priorities = list(Priority)
    tag_list = list(tags.values())

    for proj in projects:
        sprints = api.sprints.list_sprints(proj.id)
        active_sprint = next((s for s in sprints if s.is_active), sprints[-1])

        for i, title in enumerate(TASK_TITLES):
            assignee = random.choice(users[1:])
            priority = random.choice(priorities)
            status = random.choice(statuses)
            task_tags = random.sample(tag_list, k=random.randint(0, 2))
            sp = random.choice([1, 2, 3, 5, 8, 13])
            est = random.uniform(1, 20)
            actual = est * random.uniform(0.5, 1.8)
            due = now + timedelta(days=random.randint(-5, 30))

            task = api.create_task(
                actor_id=owner.id,
                title=f"{title} [{proj.name[:3]}]",
                project_id=proj.id,
                description=f"Detailed description for: {title}. "
                f"This task involves careful analysis and implementation.",
                priority=priority,
                assignee_ids=[assignee.id],
                tag_ids=[t.id for t in task_tags],
                due_date=due,
                estimated_hours=round(est, 1),
                story_points=sp,
                sprint_id=active_sprint.id,
            )

            # Update status and actual hours
            api.tasks.update_task(
                task["id"],
                status=status,
                actual_hours=round(actual, 1),
            )

            # Add a comment on some tasks
            if random.random() < 0.4:
                commenter = random.choice(users)
                api.add_comment(
                    task["id"],
                    commenter.id,
                    f"@{assignee.username} this looks good, let me know if you need help.",
                )

        print(f"  Created {len(TASK_TITLES)} tasks for {proj.name}")

    api.save(output_path)
    print(f"\nDone! Data saved to {output_path}")
    print(f"  Users: {len(users)}")
    print(f"  Projects: {len(projects)}")
    print(f"  Tasks: {len(TASK_TITLES) * len(projects)}")


if __name__ == "__main__":
    app = TaskFlowAPI()
    seed(app)
