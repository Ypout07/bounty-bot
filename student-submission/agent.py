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
os.environ["MAXIM_API_KEY"] = "sk_mx_mm7nasrb_ifajFnrz3YAmilFWijSUNcogqc0ArrKQ"
os.environ["MAXIM_LOG_REPO_ID"] = "cmm7ndaup01cbm7vpa3c26wn9"

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
        self.metrics_path = metrics_path
        self.total_tokens = 0

    def _extract_tokens(self, obj):
        """Recursively search for token count in any response format."""
        # Direct attribute checks — Gemini format
        for attr in ("usage_metadata", "usageMetadata"):
            if hasattr(obj, attr):
                meta = getattr(obj, attr)
                if meta is None:
                    continue
                for field in ("total_token_count", "totalTokenCount"):
                    val = (
                        meta.get(field, 0)
                        if isinstance(meta, dict)
                        else getattr(meta, field, 0)
                    )
                    if val:
                        return int(val)
                # Sum prompt + candidates if total isn't available
                prompt = (
                    meta.get("prompt_token_count", 0)
                    if isinstance(meta, dict)
                    else getattr(meta, "prompt_token_count", 0)
                ) or 0
                candidates = (
                    meta.get("candidates_token_count", 0)
                    if isinstance(meta, dict)
                    else getattr(meta, "candidates_token_count", 0)
                ) or 0
                if prompt or candidates:
                    return int(prompt) + int(candidates)

        # OpenAI format
        if hasattr(obj, "usage") and obj.usage:
            u = obj.usage
            val = (
                u.get("total_tokens", 0)
                if isinstance(u, dict)
                else getattr(u, "total_tokens", 0)
            )
            if val:
                return int(val)

        # Dict top-level checks
        if isinstance(obj, dict):
            for key in ("usage_metadata", "usageMetadata", "usage"):
                if key in obj and obj[key]:
                    return self._extract_tokens_from_usage(obj[key])

        # Fallback: scan all attributes for anything with "token" in the name
        try:
            attrs = obj if isinstance(obj, dict) else vars(obj)
            for key, val in attrs.items() if isinstance(attrs, dict) else []:
                if (
                    "token" in str(key).lower()
                    and isinstance(val, (int, float))
                    and val > 0
                ):
                    print(f"[Logger] Found tokens via fallback attr '{key}': {val}")
                    return int(val)
        except TypeError:
            pass

        return 0

    def _extract_tokens_from_usage(self, usage):
        """Extract tokens from a usage/usage_metadata object or dict."""
        if isinstance(usage, dict):
            for key in (
                "total_token_count",
                "totalTokenCount",
                "total_tokens",
                "totalTokens",
            ):
                if usage.get(key):
                    return int(usage[key])
            prompt = (
                usage.get("prompt_token_count", 0) or usage.get("prompt_tokens", 0) or 0
            )
            completion = (
                usage.get("candidates_token_count", 0)
                or usage.get("completion_tokens", 0)
                or 0
            )
            if prompt or completion:
                return int(prompt) + int(completion)
        else:
            for attr in ("total_token_count", "totalTokenCount", "total_tokens"):
                val = getattr(usage, attr, 0)
                if val:
                    return int(val)
            prompt = (
                getattr(usage, "prompt_token_count", 0)
                or getattr(usage, "prompt_tokens", 0)
                or 0
            )
            completion = (
                getattr(usage, "candidates_token_count", 0)
                or getattr(usage, "completion_tokens", 0)
                or 0
            )
            if prompt or completion:
                return int(prompt) + int(completion)
        return 0

    def _write_metrics(self):
        """Write current token count to metrics.json."""
        try:
            os.makedirs(os.path.dirname(self.metrics_path), exist_ok=True)
            with open(self.metrics_path, "w") as f:
                json.dump({"tokens_used": self.total_tokens}, f)
        except Exception as e:
            print(f"[Logger] Failed to write metrics.json: {e}")

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

        # 2. Track tokens locally
        try:
            tokens = self._extract_tokens(message)
            if tokens > 0:
                self.total_tokens += tokens
                print(f"[Logger] +{tokens} tokens (total: {self.total_tokens})")
            else:
                print(
                    f"[Logger] No tokens found on {type(message).__name__} (attrs: {[a for a in dir(message) if not a.startswith('_')]})"
                )
        except Exception as e:
            print(f"[ERROR] Failed to track tokens: {e}")

        # 3. Write metrics incrementally after every LLM call
        self._write_metrics()

    def shutdown(self):
        # Final metrics write
        print(f"\n[Logger] Final token count: {self.total_tokens}")
        self._write_metrics()
        print(f"[Logger] Metrics written to {self.metrics_path}")

        # Finalize Maxim session
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
        tools=[
            get_file_structure_context,
            read_contents_of_file,
            execute_file,
            write_file,
        ],
        llm=GeminiLLM(api_key=api_key, model="gemini-3-flash-preview", max_tokens=8192),
        max_calls=10,
        max_tokens=16384,
    )
    async def minimal_reproducible_example():
        pass

    @subagent(
        system_prompt=SE_SUBAGENT_PROMPT,
        tools=[
            get_file_structure_context,
            read_contents_of_file,
            execute_file,
            write_file,
        ],
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
            side_effects,
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
        if "logger" in locals():
            logger.shutdown()
    except Exception as e:
        print(f"[ERROR] Failed during logger shutdown: {e}")
