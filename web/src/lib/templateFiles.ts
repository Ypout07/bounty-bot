import JSZip from "jszip";

export const TEMPLATE_FILES: { name: string; content: string }[] = [
  {
    name: "agent.py",
    content: `import os
from CAL import Agent, GeminiLLM, StopTool, FullCompressionMemory
from dotenv import load_dotenv
from tools import get_file_structure_context, read_contents_of_file, execute_file, write_file
from prompt import SYSTEM_PROMPT

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
llm = GeminiLLM(model="gemini-3-flash-preview", api_key=api_key, max_tokens=4096)
summarizer_llm = GeminiLLM(model="gemini-3-flash-preview", api_key=api_key, max_tokens=2048)
memory = FullCompressionMemory(summarizer_llm=summarizer_llm, max_tokens=50000)

agent = Agent(
    llm=llm,
    system_prompt=SYSTEM_PROMPT,
    max_calls=10,
    max_tokens=4096,
    memory=memory,
    agent_name="DebugBot",
    tools=[StopTool(), get_file_structure_context, read_contents_of_file, execute_file, write_file]
)

result = agent.run("Find the main source code and run it. Look at the stacktrace and tell me what is the problem in simple terms")
print(result.content)`,
  },
  {
    name: "tools.py",
    content: `from CAL import tool
from dotenv import load_dotenv
import subprocess
import sys

load_dotenv()

@tool
async def get_file_structure_context(path: str = "./"):
    """
    Generates a visual tree representation of the directory structure.

    Args:
        path: The directory path to map. Defaults to the current directory.

    Returns:
        A dictionary containing the text-based tree structure of the files.
    """
    try:
        cmd = ["tree", "/f", path]
        tree_output = subprocess.check_output(cmd, shell=True).decode("utf-8", errors="ignore")
    except subprocess.CalledProcessError as e:
        tree_output = f"Error retrieving structure: {str(e)}"

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
        with open(filename, "w", encoding="utf-8") as file:
            file.write(data)

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
        }`,
  },
  {
    name: "prompt.py",
    content: `ROLE_PROMPT = """
<role>
You are an expert Software Developer AI agent. Your purpose is to diagnose, resolve, and implement code solutions by:
- Mapping and understanding existing project architectures.
- Reading and analyzing source code for bugs, bottlenecks, or anti-patterns.
- Safely implementing changes and new features.
- Validating solutions through execution and testing.

You are precise, cautious with legacy code, and highly logical. You prioritize code readability, maintainability, and security.
</role>
"""

GUIDELINES_PROMPT = """
<guidelines>
## Engineering Best Practices

1. **Context First**: Never modify code without first understanding its dependencies.
2. **Incremental Changes**: Make small, atomic changes rather than massive refactors.
3. **Verify Assumptions**: Use file execution to confirm bugs exist before fixing them.
4. **Style Consistency**: Match the existing codebase's conventions.
5. **Dry Principle**: Look for opportunities to reduce redundancy.

## Communication Style

- Use technical, precise language.
- Provide diff-like explanations for changes.
- Clearly state the "Why" behind a fix, not just the "What."
- Warn the user before performing destructive operations.
</guidelines>
"""

TOOL_USAGE_PROMPT = """
<tool-usage>
## Available Tools

### \`get_file_structure_context\`: Map the workspace
### \`read_contents_of_file\`: Analyze specific code
### \`execute_file\`: Validate and Test
### \`write_file\`: Implement changes

## Workflow
1. **Analyze**: Use \`get_file_structure_context\` to find the relevant module.
2. **Diagnose**: Use \`read_contents_of_file\` to find the bug.
3. **Reproduce**: Use \`execute_file\` to see the error in action.
4. **Fix**: Use \`write_file\` to apply the solution.
5. **Verify**: Use \`execute_file\` again to ensure the test passes.
</tool-usage>
"""

SYSTEM_PROMPT = ROLE_PROMPT + GUIDELINES_PROMPT + TOOL_USAGE_PROMPT`,
  },
  {
    name: "requirements.txt",
    content: `creevo-agent-library[mcp]`,
  },
];

export async function downloadStarterTemplate() {
  const zip = new JSZip();
  TEMPLATE_FILES.forEach((f) => {
    zip.file(f.name, f.content);
  });
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "starter-template.zip";
  a.click();
  URL.revokeObjectURL(url);
}
