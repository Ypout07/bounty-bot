from CAL import tool
from dotenv import load_dotenv
import os
import subprocess
import sys

load_dotenv()

def get_tree_string(root_dir, prefix=""):
    """
    Recursively builds a string representing the directory tree.
    """
    tree_lines = []
    
    try:
        # Get and sort items: folders first, then files alphabetically
        items = sorted(os.listdir(root_dir), 
                       key=lambda x: (os.path.isfile(os.path.join(root_dir, x)), x.lower()))
    except PermissionError:
        return f"{prefix}└── [Permission Denied]\n"

    for i, item in enumerate(items):
        path = os.path.join(root_dir, item)
        is_last = (i == len(items) - 1)
        
        # Select the branch character
        connector = "└── " if is_last else "├── "
        tree_lines.append(f"{prefix}{connector}{item}")
        
        if os.path.isdir(path):
            # Recurse and add the resulting lines to our list
            extension = "    " if is_last else "│   "
            tree_lines.append(get_tree_string(path, prefix + extension).rstrip())

    return "\n".join(tree_lines)

@tool
async def get_file_structure_context(path: str = "./"):
    """
    Generates a visual tree representation of the directory structure.
    
    Args:
        path: The directory path to map. Defaults to the current directory.
    
    Returns:
        A dictionary containing the text-based tree structure of the files.
    """
    tree_output = get_tree_string(path)

    return {
        "content": [{"type": "text", "text": tree_output}],
        "metadata": {"path": path, "output_length": len(tree_output)}
    }

@tool
async def read_contents_of_file(filepath: str):
    """
    Reads and returns the full text content of a specified file.
    
    Args:
        filepath: The relative or absolute path to the file.
    
    Returns:
        The text content of the file or an error message.
    """
    try:
        with open(filepath, "r", encoding="utf-8") as file:
            content_text = file.read()
            
        return {
            "content": [{"type": "text", "text": content_text}],
            "metadata": {"filepath": filepath, "char_count": len(content_text)}
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error reading file: {str(e)}"}],
            "metadata": {"filepath": filepath, "status": "failed"}
        }

@tool
async def execute_file(filepath: str):
    """
    Executes a Python file and captures its output, errors, and exit code.
    
    Args:
        filepath: The path to the Python script to be executed.
    
    Returns:
        A dictionary containing stdout, stderr, and the exit status.
    """
    cmd = [sys.executable, filepath]
    # Using 'capture_output' to get both stdout and stderr
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    
    output_data = {
        "status": "success" if result.returncode == 0 else "error",
        "stdout": result.stdout,
        "stderr": result.stderr,
        "exit_code": result.returncode
    }
    
    return {
        "content": [{"type": "text", "text": str(output_data)}],
        "metadata": {"executed_file": filepath}
    }

@tool
async def write_file(filename: str, data: str):
    """
    Writes or overwrites a file with the provided data and verifies the write.
    
    Args:
        filename: The name/path of the file to create or modify.
        data: The string content to write into the file.
    
    Returns:
        The content of the file after the write operation for verification.
    """
    try:
        # Write the data
        with open(filename, "w", encoding="utf-8") as file:
            file.write(data)
            
        # Re-read to verify integrity
        with open(filename, "r", encoding="utf-8") as file:
            verification_content = file.read()
            
        return {
            "content": [{"type": "text", "text": verification_content}],
            "metadata": {"filename": filename, "bytes_written": len(data)}
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error writing file: {str(e)}"}],
            "metadata": {"filename": filename, "status": "failed"}
        }