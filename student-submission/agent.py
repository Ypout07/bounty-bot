import json
import os
import sys

# DEBUG: Check if we can import CAL
try:
    print("[DEBUG] Attempting to import CAL...")
    from CAL import Agent, FullCompressionMemory, GeminiLLM, StopTool, subagent
    from CAL.logger import MaximLogger
    print("[DEBUG] CAL imported successfully.")
except ImportError as e:
    print(f"[FATAL] Failed to import CAL: {e}")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    from prompt import MRE_SUBAGENT_PROMPT, SE_SUBAGENT_PROMPT, SYSTEM_PROMPT
    from tools import (
        execute_file,
        get_file_structure_context,
        read_contents_of_file,
        write_file,
    )
    print("[DEBUG] Local modules imported successfully.")
except Exception as e:
    print(f"[FATAL] Failed to import local modules: {e}")
    sys.exit(1)

load_dotenv()

# Hardcode Maxim API Key and Log Repo ID below
# THE USER WILL REPLACE THESE
os.environ["MAXIM_API_KEY"] = "INSERT_MAXIM_API_KEY_HERE"
os.environ["MAXIM_LOG_REPO_ID"] = "INSERT_MAXIM_LOG_REPO_ID_HERE"

api_key = os.getenv("GEMINI_API_KEY")


class MetricsLogger(MaximLogger):
    """
    A custom logger that logs to Maxim AI AND tracks total token usage
    to be outputted to metrics.json upon shutdown.
    """

    def __init__(self, metrics_path="/workspace/metrics.json", **kwargs):
        print(f"[DEBUG] Initializing MetricsLogger with kwargs: {kwargs}")
        try:
            super().__init__(**kwargs)
        except Exception as e:
            print(f"[ERROR] Failed to initialize MaximLogger: {e}")
            # If we fail to initialize the base logger, we still want our own functionality
            pass
        self.metrics_path = metrics_path
        self.total_tokens = 0

    def log_llm_response(
        self, message, iteration, model, provider, start_time, end_time
    ):
        # 1. Log to Maxim (standard behavior)
        try:
            super().log_llm_response(
                message, iteration, model, provider, start_time, end_time
            )
        except Exception as e:
            print(f"[WARNING] MaximLogger failed to log: {e}")

        # 2. Track tokens locally for metrics.json
        try:
            if hasattr(message, "usage") and message.usage:
                self.total_tokens += getattr(message.usage, "total_tokens", 0)
            elif isinstance(message, dict) and "usage" in message:
                self.total_tokens += message["usage"].get("total_tokens", 0)
        except Exception as e:
            print(f"[ERROR] Failed to track tokens: {e}")

    def shutdown(self):
        # 3. Write the agreed-upon metrics.json before closing
        try:
            with open(self.metrics_path, "w") as f:
                json.dump({"tokens_used": self.total_tokens}, f)
            print(f"\n[Logger] Final token count: {self.total_tokens}")
            print(f"[Logger] Metrics written to {self.metrics_path}")
        except Exception as e:
            print(f"[Logger] Failed to write metrics.json: {e}")

        # 4. Finalize Maxim session
        try:
            super().shutdown()
        except Exception as e:
             print(f"[WARNING] MaximLogger failed to shutdown: {e}")


try:
    print("[DEBUG] Initializing Logger...")
    # Initialize our integrated Logger
    logger = MetricsLogger(agent_name="DebugBot")

    print("[DEBUG] Initializing LLMs...")
    llm = GeminiLLM(model="gemini-3-flash-preview", api_key=api_key, max_tokens=32768)
    summarizer_llm = GeminiLLM(
        model="gemini-3-flash-preview", api_key=api_key, max_tokens=4096
    )

    print("[DEBUG] Initializing Memory...")
    # Pass logger to memory and agent
    memory = FullCompressionMemory(
        summarizer_llm=summarizer_llm, max_tokens=250000, logger=logger
    )

    @subagent(
        system_prompt=MRE_SUBAGENT_PROMPT,
        tools=[get_file_structure_context, read_contents_of_file, execute_file, write_file],
        llm=GeminiLLM(api_key=api_key, model="gemini-3-flash-preview", max_tokens=8192),
        max_calls=10,
        max_tokens=16384,
    )
    async def minimal_reproducible_example():
        pass

    @subagent(
        system_prompt=SE_SUBAGENT_PROMPT,
        tools=[get_file_structure_context, read_contents_of_file, execute_file, write_file],
        llm=GeminiLLM(api_key=api_key, model="gemini-3-flash-preview", max_tokens=8192),
        max_calls=10,
        max_tokens=16384,
    )
    async def side_effects():
        pass

    print("[DEBUG] Initializing Agent...")
    agent = Agent(
        llm=llm,
        system_prompt=SYSTEM_PROMPT,
        max_calls=20,
        max_tokens=32768,
        memory=memory,
        agent_name="DebugBot",
        tools=[
            StopTool(),
            get_file_structure_context,
            read_contents_of_file,
            execute_file,
            write_file,
            minimal_reproducible_example,
            side_effects
        ],
        logger=logger,
    )

    print("\n[DEBUG] Execution beginning:\n")
    result = agent.run("Look at the codebase in /workspace and fix all problems.")
    print(result.content)

except Exception as e:
    print(f"[FATAL] Agent crashed during setup or execution: {e}")
    import traceback
    traceback.print_exc()
finally:
    # This now handles both Maxim flushing AND metrics.json writing
    try:
        if 'logger' in locals():
            logger.shutdown()
    except Exception as e:
        print(f"[ERROR] Failed during logger shutdown: {e}")
