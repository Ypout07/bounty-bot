# SD Tester Agent

A CAL agent example that demonstrates building a practical testing and evaluation tool with multiple capabilities for test execution, data processing, and result analysis.

## Features

- **Test Execution**: Run and manage test cases with detailed execution tracking
- **Tool Integration**: Execute custom tools with flexible parameter handling
- **Agent Prompting**: Dynamic prompt-based task execution and evaluation
- **Result Analysis**: Process and analyze test results with comprehensive reporting
- **Demo Tool Support**: Extensible architecture for demonstrating custom functionality

## Setup

1. Create a `.env` file with your API keys:

```bash
LLM_API_KEY=your_llm_api_key
```

2. Install dependencies:

```bash
pip install git+https://github.com/Creevo-App/creevo-agent-library.git python-dotenv
```

3. Run the agent:

```bash
python agent.py
```

## Creating an Agent

Setup
```python
load_dotenv() #This loads all the variables found as environment
api_key = os.getenv("GEMINI_API_KEY") #Gets your GEMINI_API_KEY
llm = GeminiLLM(model="gemini-3-flash-preview", api_key=api_key, max_tokens=4096) #Here you pick the model you want to use and the max_tokens
summarizer_llm = GeminiLLM(model="gemini-3-flash-preview", api_key=api_key, max_tokens=2048) #Here you have the model used for memory
memory = FullCompressionMemory(summarizer_llm=summarizer_llm, max_tokens=50000) #Here you can change max tokens for memory


#This is where you create your Agent
agent = Agent(
    llm=llm,
    system_prompt=SYSTEM_PROMPT,
    max_calls=10, #Can change the max calls the agent makes
    max_tokens=4096, #Can change the max tokens it has
    memory=memory,
    agent_name="DebugBot", #Can change the name
    tools=[StopTool(), get_file_structure_context, read_contents_of_file, execute_file, write_file] 
)
```

Anaylzing this part of the code, StopTool() is always needed, the rest are tools available to you
```
tools=[StopTool(), get_file_structure_context, read_contents_of_file, execute_file, write_file]
```

Now you can:

1. Run a test on this function

2. Evaluate the performance metrics

3. Generate a test report

```python
result = agent.run("Find the main source code and run it. Look at the stacktrace and tell me what is the problem in simple terms")
print(result.content)
```

## File Structure

```
sd_tester/
├── agent.py       # Main agent setup and run loop
├── tools.py       # Custom tool definitions (@tool decorator)
├── prompt.py      # System prompts and guidelines
├── test.py        # Test suite and execution logic
└── Tutorial.md    # This file
```

## Key CAL Concepts Demonstrated

### 1. Custom Tools with `@tool` Decorator

```python
@tool
async def execute_test(test_name: str, parameters: dict):
    """Tool description for the LLM"""
    # Tool implementation
    return {
        "content": [{"type": "text", "text": "Test Result"}],
        "metadata": {"test_id": "123", "status": "passed"}
    }
```

### 2. Prompt Configuration

```python
# prompt.py contains:
# - System role and capabilities
# - Tool usage guidelines
# - Expected interaction patterns
# - Response formatting guidelines
```

### 3. Agent Configuration

```python
agent = Agent(
    llm=llm,
    system_prompt=SYSTEM_PROMPT,
    max_calls=50,
    max_tokens=4096,
    agent_name="sd-tester",
    tools=[tool1, tool2, ...],
)
```

## Demo Tool

### Overview

Recreating a tool that reads files (a tool we made for you 😊).

### Example Implementation

```python
@tool
async def read_from_file(filepath: str):
    """Description of what this tool does"""

    """This tool allows the Agent to read from file"""

    #Implementation
    try:
        with open(filepath, "r", encoding="utf-8") as file:
            content_text = file.read()

        #The data to return to the Agent
        return {
            "content": [{"type": "text", "text": content_text}],
            "metadata": {"filepath": filepath, "char_count": len(content_text)}
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error reading file: {str(e)}"}],
            "metadata": {"filepath": filepath, "status": "failed"}
        }
```

## Extending the Agent

To add new tools, use the `@tool` decorator in `tools.py`:

```python
@tool
async def custom_tool(arg1: str, arg2: int):
    """Description of what this tool does"""
    # Implementation
    return {
        "content": [{"type": "text", "text": "result"}],
        "metadata": {"key": "value"}
    }
```

Then add it to the agent's tools list in `agent.py`.