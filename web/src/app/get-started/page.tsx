"use client";

import { useState } from "react";
import { Highlight } from "prism-react-renderer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { TEMPLATE_FILES, downloadStarterTemplate } from "@/lib/templateFiles";

const TUTORIAL_MD = `# SD Tester Agent

A CAL agent example that demonstrates building a practical testing and evaluation tool with multiple capabilities for test execution, data processing, and result analysis.

## Features

- **Test Execution**: Run and manage test cases with detailed execution tracking
- **Tool Integration**: Execute custom tools with flexible parameter handling
- **Agent Prompting**: Dynamic prompt-based task execution and evaluation
- **Result Analysis**: Process and analyze test results with comprehensive reporting
- **Demo Tool Support**: Extensible architecture for demonstrating custom functionality

## Setup

1. Create a \`.env\` file with your API keys:

\`\`\`bash
LLM_API_KEY=your_llm_api_key
\`\`\`

2. Install dependencies:

\`\`\`bash
pip install git+https://github.com/Creevo-App/creevo-agent-library.git python-dotenv
\`\`\`

3. Run the agent:

\`\`\`bash
python agent.py
\`\`\`

## Creating an Agent

Setup
\`\`\`python
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
\`\`\`

Analyzing this part of the code, StopTool() is always needed, the rest are tools available to you
\`\`\`
tools=[StopTool(), get_file_structure_context, read_contents_of_file, execute_file, write_file]
\`\`\`

Now you can:

1. Run a test on this function

2. Evaluate the performance metrics

3. Generate a test report

\`\`\`python
result = agent.run("Find the main source code and run it. Look at the stacktrace and tell me what is the problem in simple terms")
print(result.content)
\`\`\`

## File Structure

\`\`\`
sd_tester/
├── agent.py       # Main agent setup and run loop
├── tools.py       # Custom tool definitions (@tool decorator)
├── prompt.py      # System prompts and guidelines
├── test.py        # Test suite and execution logic
└── Tutorial.md    # This file
\`\`\`

## Key CAL Concepts Demonstrated

### 1. Custom Tools with \`@tool\` Decorator

\`\`\`python
@tool
async def execute_test(test_name: str, parameters: dict):
    """Tool description for the LLM"""
    # Tool implementation
    return {
        "content": [{"type": "text", "text": "Test Result"}],
        "metadata": {"test_id": "123", "status": "passed"}
    }
\`\`\`

### 2. Prompt Configuration

\`\`\`python
# prompt.py contains:
# - System role and capabilities
# - Tool usage guidelines
# - Expected interaction patterns
# - Response formatting guidelines
\`\`\`

### 3. Agent Configuration

\`\`\`python
agent = Agent(
    llm=llm,
    system_prompt=SYSTEM_PROMPT,
    max_calls=50,
    max_tokens=4096,
    agent_name="sd-tester",
    tools=[tool1, tool2, ...],
)
\`\`\`

## Demo Tool

### Overview

Recreating a tool that reads files (a tool we made for you).

### Example Implementation

\`\`\`python
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
\`\`\`

## Extending the Agent

To add new tools, use the \`@tool\` decorator in \`tools.py\`:

\`\`\`python
@tool
async def custom_tool(arg1: str, arg2: int):
    """Description of what this tool does"""
    # Implementation
    return {
        "content": [{"type": "text", "text": "result"}],
        "metadata": {"key": "value"}
    }
\`\`\`

Then add it to the agent's tools list in \`agent.py\`.
`;

const lightColorful = {
  plain: { color: "#1d1d1f", backgroundColor: "#f5f5f7" },
  styles: [
    { types: ["comment", "prolog", "doctype", "cdata"], style: { color: "#6a737d" } },
    { types: ["punctuation"], style: { color: "#444" } },
    { types: ["property", "tag", "boolean", "number", "constant", "symbol"], style: { color: "#0550ae" } },
    { types: ["attr-name", "string", "char", "builtin", "inserted"], style: { color: "#22863a" } },
    { types: ["operator", "entity", "url"], style: { color: "#d63384" } },
    { types: ["atrule", "attr-value", "keyword"], style: { color: "#cf222e" } },
    { types: ["function", "class-name"], style: { color: "#8250df" } },
    { types: ["regex", "important", "variable"], style: { color: "#e36209" } },
    { types: ["decorator", "annotation"], style: { color: "#e36209" } },
    { types: ["triple-quoted-string", "template-string"], style: { color: "#22863a" } },
  ],
};

function CodeBlock({ code, language = "python" }: { code: string; language?: string }) {
  return (
    <Highlight theme={lightColorful} code={code.trim()} language={language}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className="rounded-xl p-4 mb-4 overflow-x-auto text-xs leading-relaxed border border-surface-hover"
          style={{ ...style }}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

export default function GetStartedPage() {
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [tabHovered, setTabHovered] = useState(false);
  const router = useRouter();
  const previewed = TEMPLATE_FILES.find((f) => f.name === previewFile);

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <Navbar />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {/* Page header */}
          <h1 className="text-4xl font-bold text-heading mb-2">Get Started</h1>
          <p className="text-muted text-sm mb-10">
            Everything you need to build and submit your agent.
          </p>

          {/* Download + preview section */}
          <section className="rounded-2xl bg-surface-overlay border border-surface-hover p-6 mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-heading">
                  Starter Template
                </h2>
                <p className="text-xs text-muted mt-1">
                  Preview files below, or download the full template.
                </p>
              </div>
              <button
                onClick={downloadStarterTemplate}
                className="px-5 py-2 text-sm font-medium text-white bg-accent rounded-full hover:bg-accent-dim transition-colors"
              >
                Download All
              </button>
            </div>

            {/* File tabs */}
            <div className="flex gap-2 mb-4">
              {TEMPLATE_FILES.map((file) => (
                <button
                  key={file.name}
                  onClick={() =>
                    setPreviewFile(
                      previewFile === file.name ? null : file.name
                    )
                  }
                  className={`px-4 py-2 text-xs font-medium rounded-full border transition-colors ${
                    previewFile === file.name
                      ? "bg-heading text-white border-heading"
                      : "bg-white text-body border-surface-hover hover:border-muted/30"
                  }`}
                >
                  {file.name}
                </button>
              ))}
            </div>

            {/* Preview pane */}
            {previewed && (
              <div className="rounded-xl overflow-hidden bg-white border border-surface-hover">
                <div className="flex items-center justify-between px-4 py-2 border-b border-surface-hover bg-surface-raised">
                  <span className="text-xs font-medium text-heading">
                    {previewed.name}
                  </span>
                  <span className="text-xs text-muted">
                    {previewed.content.split("\n").length} lines
                  </span>
                </div>
                <Highlight
                  theme={lightColorful}
                  code={previewed.content}
                  language="python"
                >
                  {({ style, tokens, getLineProps, getTokenProps }) => (
                    <pre
                      className="p-4 overflow-auto max-h-96 text-xs leading-relaxed"
                      style={{ ...style }}
                    >
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })}>
                          <span className="inline-block w-8 text-right mr-4 select-none text-muted/50">
                            {i + 1}
                          </span>
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                          ))}
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              </div>
            )}
          </section>

          {/* Tutorial content */}
          <article className="prose-custom">
            <h2>SD Tester Agent</h2>
            <p>
              A CAL agent example that demonstrates building a practical testing
              and evaluation tool with multiple capabilities for test execution,
              data processing, and result analysis.
            </p>

            <h3>Features</h3>
            <ul>
              <li>
                <strong>Test Execution</strong> &mdash; Run and manage test
                cases with detailed execution tracking
              </li>
              <li>
                <strong>Tool Integration</strong> &mdash; Execute custom tools
                with flexible parameter handling
              </li>
              <li>
                <strong>Agent Prompting</strong> &mdash; Dynamic prompt-based
                task execution and evaluation
              </li>
              <li>
                <strong>Result Analysis</strong> &mdash; Process and analyze
                test results with comprehensive reporting
              </li>
              <li>
                <strong>Demo Tool Support</strong> &mdash; Extensible
                architecture for demonstrating custom functionality
              </li>
            </ul>

            <h3>Setup</h3>
            <p>
              1. Create a <code>.env</code> file with your API keys:
            </p>
            <CodeBlock language="bash" code="LLM_API_KEY=your_llm_api_key" />

            <p>2. Install dependencies:</p>
            <CodeBlock language="bash" code="pip install git+https://github.com/Creevo-App/creevo-agent-library.git python-dotenv" />

            <p>3. Run the agent:</p>
            <CodeBlock language="bash" code="python agent.py" />

            <h3>Creating an Agent</h3>
            <p>Setup</p>
            <CodeBlock code={`load_dotenv() #This loads all the variables found as environment
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
)`} />

            <p>
              Analyzing this part of the code, <code>StopTool()</code> is always
              needed, the rest are tools available to you
            </p>
            <CodeBlock code="tools=[StopTool(), get_file_structure_context, read_contents_of_file, execute_file, write_file]" />

            <p>Now you can:</p>
            <ol>
              <li>Run a test on this function</li>
              <li>Evaluate the performance metrics</li>
              <li>Generate a test report</li>
            </ol>

            <CodeBlock code={`result = agent.run("Find the main source code and run it. Look at the stacktrace and tell me what is the problem in simple terms")
print(result.content)`} />

            <h3>File Structure</h3>
            <CodeBlock language="bash" code={`sd_tester/
├── agent.py       # Main agent setup and run loop
├── tools.py       # Custom tool definitions (@tool decorator)
├── prompt.py      # System prompts and guidelines
├── test.py        # Test suite and execution logic
└── Tutorial.md    # This file`} />

            <h3>Key CAL Concepts Demonstrated</h3>

            <h4>1. Custom Tools with @tool Decorator</h4>
            <CodeBlock code={`@tool
async def execute_test(test_name: str, parameters: dict):
    """Tool description for the LLM"""
    # Tool implementation
    return {
        "content": [{"type": "text", "text": "Test Result"}],
        "metadata": {"test_id": "123", "status": "passed"}
    }`} />

            <h4>2. Prompt Configuration</h4>
            <CodeBlock code={`# prompt.py contains:
# - System role and capabilities
# - Tool usage guidelines
# - Expected interaction patterns
# - Response formatting guidelines`} />

            <h4>3. Agent Configuration</h4>
            <CodeBlock code={`agent = Agent(
    llm=llm,
    system_prompt=SYSTEM_PROMPT,
    max_calls=50,
    max_tokens=4096,
    agent_name="sd-tester",
    tools=[tool1, tool2, ...],
)`} />

            <h3>Demo Tool</h3>

            <h4>Overview</h4>
            <p>
              Recreating a tool that reads files (a tool we made for you).
            </p>

            <h4>Example Implementation</h4>
            <CodeBlock code={`@tool
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
        }`} />

            <h3>Extending the Agent</h3>
            <p>
              To add new tools, use the <code>@tool</code> decorator in{" "}
              <code>tools.py</code>:
            </p>
            <CodeBlock code={`@tool
async def custom_tool(arg1: str, arg2: int):
    """Description of what this tool does"""
    # Implementation
    return {
        "content": [{"type": "text", "text": "result"}],
        "metadata": {"key": "value"}
    }`} />
            <p>
              Then add it to the agent&apos;s tools list in{" "}
              <code>agent.py</code>.
            </p>
          </article>
        </div>
      </div>

      {/* Challenges side tab – full circle, center pinned to right edge */}
      <div
        onMouseEnter={() => setTabHovered(true)}
        onMouseLeave={() => setTabHovered(false)}
        onClick={() => router.push("/challenges")}
        className={`fixed z-50 cursor-pointer rounded-full flex items-center transition-all duration-300 ease-out ${
          tabHovered
            ? "bg-blue-600 shadow-[-6px_0_24px_rgba(0,0,0,0.25)]"
            : "bg-blue-500/30"
        }`}
        style={{
          top: "3.5rem",
          width: "calc(100vh - 3.5rem)",
          height: "calc(100vh - 3.5rem)",
          /* half the diameter off-screen so the midpoint sits on the edge */
          right: tabHovered
            ? "calc(-1 * (100vh - 3.5rem) / 2 - 180px)"
            : "calc(-1 * (100vh - 3.5rem) / 2 - 240px)",
        }}
      >
        <div className="pl-[calc(10%-60px)] flex flex-col items-start">
          <span
            className={`text-lg tracking-wide whitespace-nowrap transition-all duration-300 ${
              tabHovered ? "font-bold text-white" : "font-semibold text-accent"
            }`}
          >
            Challenges
          </span>
          <svg
            viewBox="0 0 100 12"
            className={`w-[7rem] h-3 mt-1 transition-all duration-300 ${
              tabHovered ? "text-white" : "text-accent"
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="0" y1="6" x2="90" y2="6" />
            <polyline points="82,1 90,6 82,11" />
          </svg>
        </div>
      </div>
    </main>
  );
}
