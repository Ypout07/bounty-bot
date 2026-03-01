import os
from CAL import Agent, GeminiLLM, StopTool, FullCompressionMemory, subagent
from dotenv import load_dotenv
from tools import get_file_structure_context, read_contents_of_file, execute_file, write_file
from prompt import SYSTEM_PROMPT, SUBAGENT_PROMPT

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
llm = GeminiLLM(model="gemini-3-flash-preview", api_key=api_key, max_tokens=32768)
summarizer_llm = GeminiLLM(model="gemini-3-flash-preview", api_key=api_key, max_tokens=4096)
memory = FullCompressionMemory(summarizer_llm=summarizer_llm, max_tokens=250000)

@subagent(
    system_prompt=SUBAGENT_PROMPT,
    tools=[get_file_structure_context, read_contents_of_file, execute_file, write_file],
    llm=GeminiLLM(api_key=api_key, model="gemini-3-flash-preview", max_tokens=8192),
    max_calls=10,
    max_tokens=16384,
)
async def minimal_reproducible_example():
    pass


agent = Agent(
    llm=llm,
    system_prompt=SYSTEM_PROMPT,
    max_calls=30,
    max_tokens=32768,
    memory=memory,
    agent_name="DebugBot",
    tools=[StopTool(), get_file_structure_context, read_contents_of_file, execute_file, write_file, minimal_reproducible_example]
)

print("\n\nFirst prompt:\n")
result = agent.run("Look at the codebase, run the tests, and fix the problems. Don't stop until all tests pass")
print(result.content)

print("\n\nSecond prompt:\n")
result = agent.run("Find any other problems that may exist in the code base. Remember this is for deployment. Fix all potential errors (human and code errors). If no problems are found you can stop.")
print(result.content)