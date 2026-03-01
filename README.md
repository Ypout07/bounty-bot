# BountyBot

A next-generation evaluation platform developed to accelerate rising software engineers in an ever-growing, AI-native world. 

## The Problem

As AI Agents rapidly lower the barriers to creating software, the business models we have relied on for decades are being turned on their heads. When a team of agents can produce solutions faster and cheaper than humans, the job of a software engineer changes drastically. Historically, developers were paid to implement software that achieves specific tasks under strict constraints. Today, that paradigm is shifting. 

## The Future

In a recent case study in China, a consulting firm agreed to forgo hourly billing. Instead, they chose to be paid strictly for the **outcomes** they produced for their clients. The verdict? It worked flawlessly for both parties. Agentic AI allowed them to produce solutions rapidly, empowering developers to iterate and pivot faster than ever before. 

In anticipation of exponential AI growth, BountyBot provides students with the infrastructure, experience, and tools they need to thrive in this new, **outcome-driven world**. 

## So, What Does BountyBot Actually Do?

BountyBot is an enterprise-grade, multi-tenant CI/CD evaluation engine for AI agents. Instead of submitting static code, students submit autonomous agents designed to fix broken enterprise codebases. 



Our platform orchestrates the entire lifecycle:

1. **The Web Portal (Next.js & Supabase):** Hackathon organizers create "Bounties" (failing codebases). Students submit their agent's Docker Hub image tag to the cloud queue via a seamless frontend.
2. **The Execution Node (Go CLI):** A ruthless, highly concurrent Go orchestrator continuously polls the database for pending jobs. When a student's agent is queued, the engine locks the database row to prevent race conditions.
3. **Secure Sandboxing (Docker):** The orchestrator pulls the student's untrusted image and boots it inside an isolated Docker volume containing the target codebase. 
4. **Runtime Secret Injection:** To prevent students from leaking API keys on Docker Hub, the Go engine securely injects sponsored LLM API keys (like Gemini) directly into the container's memory at runtime.
5. **Autonomous Evaluation:** The student's agent attempts to fix the codebase. Once the container spins down, the Go engine runs the test suite, parses the `metrics.json` file to calculate token efficiency and execution time, and aggressively reverts the Git workspace to prepare for the next competitor.
6. **Real-Time Leaderboard:** Metrics are securely transmitted back to Vercel, instantly updating a live, dynamically sorted leaderboard based on test pass rates, token efficiency, and speed.

## Quick Start for Students

1. **Code:** Write your agent logic inside our provided template. **Never hardcode API keys;** our orchestrator securely injects them at runtime.
2. **Containerize:** Build and push your agent to Docker Hub: 
   `docker build -t your-username/agent:v1 . && docker push your-username/agent:v1`
3. **Submit:** Paste your exact Docker Hub image tag into the BountyBot web portal to enter the execution queue.

## Authors
This project was authored by Nathan McCormick, Adam Alkawaz, and Ogochuckwu Ibe-Ikechi at the University of Nebraska-Lincoln's RaikesHacks hackathon on February 28 - March 1, 2026. The theme was "for students, by students." This distributed architecture was brought from ideation to production in less than 24 hours.
