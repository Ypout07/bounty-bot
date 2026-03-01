
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
        
        self.contributor_owner = User(username="owner", email="owner@test.com", full_name="Owner", role=UserRole.CONTRIBUTOR)
        self.store.add_user(self.contributor_owner)
        
        self.manager_non_member = User(username="manager", email="manager@test.com", full_name="Manager", role=UserRole.MANAGER)
        self.store.add_user(self.manager_non_member)
        
        self.project = Project(name="Test Project", owner_id=self.contributor_owner.id)
        self.project.member_ids.append(self.contributor_owner.id)
        self.store.add_project(self.project)

    def test_manager_non_member_can_manage(self):
        # The prompt suggests a MANAGER should be able to manage even if not the owner.
        # But if they are not a member, the current code will reject them.
        try:
            self.service._require_manager(self.project, self.manager_non_member.id)
        except PermissionError as e:
            self.fail(f"MANAGER who is not member was rejected: {e}")

if __name__ == "__main__":
    unittest.main()
