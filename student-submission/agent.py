import os

from CAL import Agent, FullCompressionMemory, GeminiLLM, StopTool, subagent
from dotenv import load_dotenv
from prompt import MRE_SUBAGENT_PROMPT, SE_SUBAGENT_PROMPT, SYSTEM_PROMPT
from tools import (
    execute_file,
    read_contents_of_file,
    write_file,
)

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
llm = GeminiLLM(model="gemini-3-flash-preview", api_key=api_key, max_tokens=32768)
summarizer_llm = GeminiLLM(
    model="gemini-3-flash-preview", api_key=api_key, max_tokens=4096
)
memory = FullCompressionMemory(summarizer_llm=summarizer_llm, max_tokens=250000)


@subagent(
    system_prompt=MRE_SUBAGENT_PROMPT,
    tools=[read_contents_of_file, execute_file, write_file],
    llm=GeminiLLM(api_key=api_key, model="gemini-3-flash-preview", max_tokens=8192),
    max_calls=10,
    max_tokens=16384,
)
async def minimal_reproducible_example():
    pass


@subagent(
    system_prompt=SE_SUBAGENT_PROMPT,
    tools=[read_contents_of_file, execute_file, write_file],
    llm=GeminiLLM(api_key=api_key, model="gemini-3-flash-preview", max_tokens=8192),
    max_calls=10,
    max_tokens=16384,
)
async def side_effects():
    pass


agent = Agent(
    llm=llm,
    system_prompt=SYSTEM_PROMPT,
    max_calls=20,
    max_tokens=32768,
    memory=memory,
    agent_name="DebugBot",
    tools=[
        StopTool(),
        read_contents_of_file,
        execute_file,
        write_file,
    ],
)

print("\n\nFirst prompt:\n")
result = agent.run(
    "Look at /workspace, run the tests, and fix the problems. Don't stop until all tests pass"
)
print(result.content)
