
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "company-private-repo", "src"))

from models.core import Project, User, UserRole
from models.store import DataStore
from services.project_service import ProjectService, PermissionError

class TestPermissionBug(unittest.TestCase):
    def setUp(self):
        self.store = DataStore()
        self.service = ProjectService(self.store)
        
        # Create an admin to be able to do stuff if needed, 
        # but we'll use raw store to avoid permission checks during setup if any.
        self.admin = User(username="admin", email="admin@test.com", full_name="Admin", role=UserRole.ADMIN)
        self.store.add_user(self.admin)
        
        self.contributor_owner = User(username="owner", email="owner@test.com", full_name="Owner", role=UserRole.CONTRIBUTOR)
        self.store.add_user(self.contributor_owner)
        
        self.manager_non_owner = User(username="manager", email="manager@test.com", full_name="Manager", role=UserRole.MANAGER)
        self.store.add_user(self.manager_non_owner)
        
        self.project = Project(name="Test Project", owner_id=self.contributor_owner.id)
        self.project.member_ids.append(self.contributor_owner.id)
        self.project.member_ids.append(self.manager_non_owner.id)
        self.store.add_project(self.project)

    def test_manager_non_owner_can_manage(self):
        # This should NOT raise PermissionError
        try:
            self.service._require_manager(self.project, self.manager_non_owner.id)
        except PermissionError as e:
            self.fail(f"MANAGER who is member was rejected: {e}")

    def test_contributor_owner_can_manage(self):
        # This should NOT raise PermissionError
        try:
            self.service._require_manager(self.project, self.contributor_owner.id)
        except PermissionError as e:
            self.fail(f"CONTRIBUTOR who is owner was rejected: {e}")

if __name__ == "__main__":
    unittest.main()
