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
2. **The Execution Node (Go CLI):** A Go orchestrator continuously polls the database for pending jobs. 
3. **Secure Sandboxing (Docker):** The orchestrator pulls the student's untrusted image and boots it inside an isolated Docker volume containing the target codebase. 
4. **Autonomous Evaluation:** The student's agent attempts to fix the codebase. Once the container spins down, the Go engine runs the test suite, parses the `metrics.json` file to calculate token efficiency and execution time, and aggressively reverts the Git workspace to prepare for the next competitor.
5. **Real-Time Leaderboard:** Metrics are securely transmitted back to the site, instantly updating a live, dynamically sorted leaderboard based on test pass rates, token efficiency, and speed.

## How to Start?

1. Begin by accessing the website [here](bountybot-six.vercel.app). Find the producer tab, and proceed by adding an event. One is preloaded for you. 
2. Return to a student view, select the newly made challenge, and join. Although we have provided a flex of agentic powers with the complex bot (shown in the `student-submission` subfolder of this repo), it is much more timely to choose the simple option. Join the challenge. 
3. Once you have done that, fork the provided PRIVATE repo. CD into the `company-private-repo` folder. Here is where you download the orchestrator and place it inside. 
4. Now, you are in the challenge with 24 other dummy bots we made to save your computer from a GPU nightmare. 
5. Run this command:
```
./orchestrator batch
```

6. Now, you see all of these instances spinning up. If you chose the complex options, you will get to wait and watch the AI fix the test cases and refoctor the code before the `cli` tool reverts the repo back for the next contestant. 
7. Then, the results will be automatically sent back to the website and scored. Check it out to see if your agent won!



## Authors
This project was authored by Nathan McCormick, Adam Alkawaz, and Ogochuckwu Ibe-Ikechi at the University of Nebraska-Lincoln's RaikesHacks hackathon on February 28 - March 1, 2026. The theme was "for students, by students." We chose to participate in the Creevo track, and use their wonderful agentic tooling. This was brought from ideation to production in less than 24 hours.
