
import os
import sys
import unittest
import tempfile
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "company-private-repo", "src"))

from models.core import Task, Comment, Priority, Status
from models.store import DataStore

class TestDataLoss(unittest.TestCase):
    def test_task_persistence_loss(self):
        store = DataStore()
        
        # Setup: Task with comments
        task = Task(
            title="Persistent Task",
            project_id="p1",
            creator_id="u1",
        )
        comment = Comment(author_id="u1", content="This is a comment")
        task.comments.append(comment)
        store.add_task(task)
        
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as f:
            path = f.name
        
        try:
            store.save(path)
            
            store2 = DataStore()
            store2.load(path)
            
            loaded_task = store2.get_task(task.id)
            self.assertEqual(len(loaded_task.comments), 1, "Comments were lost during persistence!")
            self.assertEqual(loaded_task.comments[0].content, "This is a comment")
            
        finally:
            if os.path.exists(path):
                os.unlink(path)

if __name__ == "__main__":
    unittest.main()
