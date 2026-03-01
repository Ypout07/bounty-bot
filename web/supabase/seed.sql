-- =============================================
-- Seed data: Insert mock challenges
-- Run this in Supabase SQL Editor after schema.sql
-- =============================================

INSERT INTO challenges (title, company, description, request, posted_at, deadline, status, metrics, repo_url) VALUES
(
  'Build a Real-Time Fraud Detection Pipeline',
  'Capital One',
  'Design and implement a streaming data pipeline that detects fraudulent transactions in real time. You will work with synthetic transaction data and must flag anomalies using statistical or ML-based approaches within a 200ms latency window.',
  E'Build an agent that ingests a live stream of transaction events from a Kafka topic and classifies each as legitimate or fraudulent. Your agent must:\n\n1. Connect to the provided Kafka broker and consume from the `transactions` topic.\n2. For each transaction, extract features (amount, merchant category, time since last transaction, geolocation delta) and run them through a detection model.\n3. Flag transactions with a fraud score above 0.7 and write them to the `fraud-alerts` topic.\n4. Maintain a per-card sliding window of the last 50 transactions for contextual scoring.\n5. Achieve p95 end-to-end latency under 200ms.\n\nYou will be evaluated on detection accuracy (F1 score), latency, and false positive rate. The test harness replays 100k transactions with known labels.',
  '2026-02-26T10:00:00Z',
  '2026-03-05T23:59:00Z',
  'ongoing',
  ARRAY['p95 latency', 'F1 score', 'false positive rate'],
  NULL
),
(
  'Optimize a Legacy Search Index',
  'Elasticsearch',
  'Given a degraded search index serving 50k queries per second, identify bottlenecks and refactor the indexing strategy. Your solution should improve p95 latency by at least 40% without increasing infrastructure costs.',
  E'You are given a search cluster with 3 nodes, each holding a copy of a 12GB product catalog index. Current p95 latency is 380ms at 50k QPS. Your agent must:\n\n1. Analyze the provided index mappings and identify fields causing excessive memory usage or slow aggregations.\n2. Propose and implement a new mapping strategy that reduces field count and leverages `keyword` vs `text` types appropriately.\n3. Reindex the data using the optimized mappings.\n4. Tune shard count, replica settings, and refresh interval for the given hardware profile.\n5. Run the benchmark suite and produce a before/after comparison.\n\nTarget: p95 latency <= 228ms at 50k QPS with no additional nodes. Submit your revised mappings, reindex script, and benchmark results.',
  '2026-02-25T14:00:00Z',
  '2026-03-04T23:59:00Z',
  'submitted',
  ARRAY['p95 latency', 'QPS throughput'],
  NULL
),
(
  'Reverse Engineer a Minified API Client',
  'Trail of Bits',
  'You are given an obfuscated JavaScript API client. Reconstruct its request signing algorithm and produce a clean, documented implementation that passes the provided integration test suite.',
  E'You will receive `client.min.js`, an obfuscated 14KB JavaScript file that authenticates against a REST API using a custom HMAC-based request signing scheme. Your agent must:\n\n1. Deobfuscate the JavaScript and identify the signing function.\n2. Document the signing algorithm step by step: which headers are included, how the canonical request string is formed, and what hash function is used.\n3. Produce a clean Python implementation of the signing logic in a file called `signer.py`.\n4. Your implementation must pass all 25 integration tests in `test_signer.py`, which validate signatures against known request/response pairs.\n5. Write a brief report (`report.md`) explaining each obfuscation technique you encountered and how you defeated it.\n\nEvaluation: all tests pass, code clarity, and completeness of the report.',
  '2026-02-27T08:00:00Z',
  '2026-03-06T18:00:00Z',
  'unattempted',
  '{}',
  NULL
),
(
  'Container Escape CTF',
  'CrowdStrike',
  'Exploit a deliberately misconfigured container runtime to escape to the host. Document each step of your exploit chain and propose mitigations for each vulnerability you discover.',
  E'You are dropped into a shell inside a Docker container running on a Linux host. The container has been intentionally misconfigured. Your agent must:\n\n1. Enumerate the container environment: capabilities, mounted volumes, network namespace, and kernel version.\n2. Identify at least two distinct privilege escalation or escape vectors.\n3. Execute a full escape to gain a shell on the host and read the flag at `/root/flag.txt`.\n4. For each vulnerability exploited, write a mitigation recommendation (e.g., drop capabilities, read-only rootfs, seccomp profile).\n5. Submit `exploit.sh` (your exploit chain), `flag.txt` contents, and `mitigations.md`.\n\nScoring: flag capture (50%), number of unique vectors found (30%), quality of mitigations (20%).',
  '2026-02-24T12:00:00Z',
  '2026-03-03T23:59:00Z',
  'expired',
  '{}',
  NULL
),
(
  'Design a Distributed Rate Limiter',
  'Cloudflare',
  'Implement a distributed rate limiting service that operates across multiple data centers with eventual consistency. Handle clock skew, network partitions, and burst traffic while maintaining fair request distribution.',
  E'Implement a token-bucket rate limiter that runs across 3 simulated data centers. Your agent must:\n\n1. Implement the rate limiter as a gRPC service with `AllowRequest(client_id, tokens_requested)` and `GetStatus(client_id)` RPCs.\n2. Each data center maintains a local token bucket that syncs counters with peers every 500ms via gossip protocol.\n3. Handle network partitions gracefully — during a partition, each DC should enforce a local limit of `global_limit / num_dcs` and reconcile when connectivity is restored.\n4. Handle clock skew of up to 200ms between nodes without over- or under-counting.\n5. Pass the provided test suite which simulates 10k clients, burst traffic, partitions, and clock drift.\n\nDeliverables: service code, Dockerfile, and a design doc explaining your consistency trade-offs. Evaluated on correctness, fairness, and throughput.',
  '2026-02-27T16:00:00Z',
  '2026-03-07T23:59:00Z',
  'unattempted',
  '{}',
  NULL
),
(
  'Patch a Vulnerable Smart Contract',
  'Coinbase',
  'Audit the provided Solidity smart contract, identify all exploitable vulnerabilities, write proof-of-concept exploits, and submit a patched version that passes the full security test harness.',
  E'You are given `VaultV1.sol`, a DeFi vault contract with multiple known vulnerabilities. Your agent must:\n\n1. Audit the contract and identify all vulnerabilities (expect at least 4: reentrancy, integer overflow, access control, and front-running).\n2. For each vulnerability, write a Foundry test in `Exploit.t.sol` that demonstrates the exploit and drains or manipulates funds.\n3. Produce a patched `VaultV2.sol` that fixes all identified issues while preserving the original interface and functionality.\n4. Your patched contract must pass the original `Vault.t.sol` test suite (functional correctness) AND resist all exploits in your `Exploit.t.sol`.\n5. Write `audit.md` documenting each finding with severity, impact, and fix description.\n\nEvaluation: vulnerabilities found, exploit quality, patch correctness, and audit report clarity.',
  '2026-02-26T09:00:00Z',
  '2026-03-05T12:00:00Z',
  'ongoing',
  '{}',
  NULL
),
(
  'Build a Zero-Knowledge Proof Verifier',
  'StarkWare',
  'Implement a ZK-STARK verifier from scratch that can validate arithmetic circuit proofs. Your implementation must handle field arithmetic, Merkle commitments, and FRI-based polynomial verification.',
  E'Implement a STARK verifier in Rust or Python that validates proofs for arithmetic circuits over a 64-bit prime field. Your agent must:\n\n1. Implement finite field arithmetic (add, mul, inv, pow) over the Goldilocks field (p = 2^64 - 2^32 + 1).\n2. Implement a Merkle tree commitment scheme using SHA-256.\n3. Implement the FRI (Fast Reed-Solomon Interactive Oracle Proof) verification protocol for low-degree testing.\n4. Combine the above into a full STARK verifier that accepts a proof object and an arithmetic circuit description, and returns accept/reject.\n5. Verify all 10 provided test proofs (5 valid, 5 invalid) correctly.\n\nDeliverables: verifier source code and a `DESIGN.md` explaining your implementation of each component. Evaluated on correctness, code structure, and design doc quality.',
  '2026-02-25T11:00:00Z',
  '2026-03-06T23:59:00Z',
  'unattempted',
  '{}',
  NULL
),
(
  'Automate Infrastructure Drift Detection',
  'HashiCorp',
  'Create a tool that continuously compares live cloud infrastructure against Terraform state files and alerts on drift. Support AWS EC2, S3, and IAM resources with a configurable threshold for acceptable variance.',
  E'Build a CLI tool called `driftctl` that detects infrastructure drift between Terraform state and live AWS resources. Your agent must:\n\n1. Parse a Terraform state file (`terraform.tfstate`) and extract all managed EC2 instances, S3 buckets, and IAM roles/policies.\n2. Query the AWS API (using provided mock endpoints) to fetch the current state of those same resources.\n3. Diff each resource attribute and report changes as `added`, `modified`, or `deleted`.\n4. Support a `--threshold` flag: ignore drifts where the changed attribute count is below the threshold percentage.\n5. Output a JSON report and a human-readable summary to stdout.\n\nDeliverables: CLI source code, tests, and sample output. The test suite provides 3 state files with known drift. Evaluated on detection accuracy, output clarity, and code quality.',
  '2026-02-24T09:00:00Z',
  '2026-03-04T18:00:00Z',
  'ongoing',
  '{}',
  NULL
),
(
  'LLM Prompt Injection Defense',
  'Anthropic',
  'Design and implement a multi-layered defense system that detects and neutralizes prompt injection attacks against an LLM-powered customer service bot. Evaluate against a provided red-team dataset of 500 adversarial inputs.',
  E'Build a defense layer that sits between user input and an LLM-powered support bot. Your agent must:\n\n1. Implement an input classifier that scores each user message for injection likelihood (0.0 to 1.0) using pattern matching, perplexity analysis, or a lightweight ML model.\n2. Implement an output validator that checks the LLM''s response for policy violations (data leaks, role-breaking, harmful content) before returning it to the user.\n3. Implement a prompt armoring layer that rewrites the system prompt to be resistant to override attempts.\n4. Wire all three layers into a `DefenseMiddleware` class with `screen_input(msg) -> (safe: bool, score: float)` and `screen_output(response) -> (safe: bool, reason: str)` methods.\n5. Evaluate against the provided `redteam_500.jsonl` dataset and achieve >= 92% detection rate with <= 5% false positive rate on benign inputs.\n\nDeliverables: middleware code, evaluation script, and a results summary. Evaluated on detection rate, false positive rate, and defense robustness.',
  '2026-02-27T10:00:00Z',
  '2026-03-07T23:59:00Z',
  'unattempted',
  '{}',
  NULL
),
(
  'High-Frequency Trading Simulator',
  'Jane Street',
  'Build a matching engine simulator that processes limit and market orders with sub-microsecond precision. Implement price-time priority, handle partial fills, and support cancel/replace operations across multiple order books.',
  E'Implement a matching engine in C++ or Rust that maintains order books for 5 symbols. Your agent must:\n\n1. Support order types: Limit, Market, IOC (Immediate or Cancel), and FOK (Fill or Kill).\n2. Implement price-time priority matching: orders at the same price level are filled in FIFO order.\n3. Handle partial fills correctly — a market buy for 100 shares against asks of 60 and 50 should fill 60 from the first and 40 from the second.\n4. Support Cancel and Cancel/Replace operations by order ID.\n5. Process the provided `orders.csv` (1M orders across 5 symbols) and produce `trades.csv` and `book_snapshots.csv`.\n\nTarget: process all 1M orders in under 2 seconds on a single core. Evaluated on correctness (trade output matches reference), performance, and code clarity.',
  '2026-02-26T15:00:00Z',
  '2026-03-06T12:00:00Z',
  'unattempted',
  '{}',
  NULL
),
(
  'Malware Sandbox Evasion Analysis',
  'Mandiant',
  'Analyze a set of malware samples that employ sandbox evasion techniques. Document each evasion method, classify them by category, and build detection signatures that identify the evasion behavior without triggering false positives.',
  E'You are given 8 malware samples (PE binaries) that use various sandbox evasion techniques. Your agent must:\n\n1. Run each sample in the provided sandbox environment and observe its behavior (API calls, file access, network activity, timing checks).\n2. Identify and classify evasion techniques used by each sample (e.g., sleep acceleration detection, registry fingerprinting, user interaction checks, hardware enumeration).\n3. For each technique, write a YARA rule that detects the evasion pattern in static analysis.\n4. Validate your YARA rules against the 8 malicious samples (should match) and 20 benign samples (should not match).\n5. Produce `analysis.md` with a per-sample breakdown and `evasion_rules.yar` with all detection signatures.\n\nEvaluation: evasion techniques identified, YARA rule accuracy (true positive rate vs false positive rate), and analysis quality.',
  '2026-02-23T08:00:00Z',
  '2026-03-03T17:00:00Z',
  'submitted',
  '{}',
  NULL
),
(
  'Compiler Optimization Pass',
  'NVIDIA',
  'Write a custom LLVM optimization pass that identifies and vectorizes nested loop patterns common in matrix multiplication. Benchmark your pass against the baseline on provided CUDA kernel test cases.',
  E'Write an LLVM IR optimization pass that detects and vectorizes matrix multiplication patterns. Your agent must:\n\n1. Implement a `FunctionPass` that scans for nested loop nests matching the pattern `C[i][j] += A[i][k] * B[k][j]`.\n2. Transform the detected pattern to use LLVM vector intrinsics (e.g., `llvm.x86.avx2` or generic vector ops) for the inner loop.\n3. Handle edge cases: non-power-of-2 dimensions (requires a scalar epilogue), aliased pointers (must prove no-alias or skip), and different data types (f32, f64).\n4. Register the pass as a plugin loadable via `opt -load`.\n5. Run the pass on the 5 provided `.ll` test files and produce benchmark results comparing original vs optimized execution time.\n\nDeliverables: pass source code, CMakeLists.txt, and benchmark results. Evaluated on speedup achieved, correctness (output matches reference), and edge case handling.',
  '2026-02-27T14:00:00Z',
  '2026-03-08T23:59:00Z',
  'unattempted',
  '{}',
  NULL
),
(
  'Intelligent Code Review Agent',
  'Creevo',
  'Build an AI-powered code review agent that analyzes pull requests for bugs, security vulnerabilities, and style violations. The agent must provide actionable inline comments and an overall summary with a confidence score for each finding.',
  E'Build an agent that automates code review for Python and TypeScript repositories. Your agent must:\n\n1. Accept a GitHub pull request URL and fetch the diff via the GitHub API.\n2. Parse the diff to identify changed files, added lines, and removed lines.\n3. For each changed file, analyze the code for common bug patterns (null dereference, off-by-one, resource leaks), security issues (SQL injection, XSS, hardcoded secrets), and style violations (naming conventions, unused imports).\n4. Generate inline review comments with severity (info/warning/error), a description of the issue, and a suggested fix.\n5. Produce a summary report with total findings by category and an overall code quality score (0-100).\n\nYou will be evaluated on detection accuracy (precision and recall against a labeled dataset of 200 PRs), false positive rate, and quality of suggested fixes.',
  '2026-01-10T09:00:00Z',
  '2026-01-26T23:59:00Z',
  'expired',
  ARRAY['precision', 'recall', 'false positive rate'],
  NULL
),
(
  'Automated Test Generation Engine',
  'Creevo',
  'Create an agent that automatically generates unit tests for untested functions in a codebase. The agent should achieve at least 80% branch coverage on the target modules and produce tests that are readable, maintainable, and catch real bugs.',
  E'Build an agent that generates comprehensive unit tests for Python codebases. Your agent must:\n\n1. Accept a path to a Python package and identify all public functions and methods lacking test coverage.\n2. Analyze function signatures, docstrings, and implementation logic to infer expected behavior and edge cases.\n3. Generate pytest-compatible test files with descriptive test names and assertions.\n4. Include edge cases: empty inputs, boundary values, type errors, and exception handling paths.\n5. Run the generated tests and iterate until branch coverage reaches at least 80% on each target module.\n\nYou will be evaluated on branch coverage achieved, mutation testing score (% of seeded bugs caught), test readability, and execution time. The benchmark includes 10 Python packages of varying complexity.',
  '2026-02-01T14:00:00Z',
  '2026-02-17T23:59:00Z',
  'expired',
  ARRAY['branch coverage', 'mutation score', 'execution time'],
  NULL
);
