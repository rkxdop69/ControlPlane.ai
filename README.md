# ControlPlane.ai — Technical Submission README

## Accenture Innovation Challenge 2026 — Round 2 | Problem Track 1
**Team:** AccentureInnovators#AI — IIT Kanpur  
**Members:** Himanshu Mahale (Leader), Vineet Nagrale, Rajat Kumar

---

## Overview

**ControlPlane.ai** is a real-time AI oversight middleware that intercepts and evaluates every AI-generated response **before** it reaches the end user. It acts as an enterprise-grade AI firewall across three dimensions: **Performance** (hallucination), **Cost** (token efficiency), and **Responsibility** (PII, bias, toxicity).

To best demonstrate both the **speed** of our architecture and the **deep technical capability** of our grounding engine, we have provided two separate prototype versions in this submission.

---

## 1. Prototype V1: The Interactive Core Demo (`controlplane-prototype`)

This is our primary demonstration environment. It relies on a deterministic TF-IDF grounding model.

**Why we built this:** We wanted to provide a frictionless, zero-dependency environment so judges can instantly feel the speed and UI of the ControlPlane. 

### How to Run V1
1. Open the `controlplane-prototype` folder.
2. Double-click `index.html` to open it in your browser.
3. No local server, installations, or dependencies are required.

### What to Test in V1
Navigate to the **Live Sandbox** on the left menu and test the following:
*   **Responsibility Risk (PII):** Select the PII scenario. Watch ControlPlane instantly **BLOCK** the response and generate a safe, auto-redacted fallback string, protecting user data.
*   **Cost Anomaly:** Select the Token Threshold scenario. Watch ControlPlane trigger a **WARN** due to excessive generation loops exceeding the budget.
*   **Systemic Drift:** Trigger the same failure multiple times. Return to the **Live Traffic** dashboard to see the red banner automatically escalating the anomaly to the Engineering team via webhook.

---

## 2. Prototype V2: The Deep Tech Proof (`controlplane-prototype-v2`)

This is our advanced implementation environment. It replaces the TF-IDF engine with a real, open-source neural network (`transformers.js` + `all-MiniLM-L6-v2`) running directly in the browser via WebAssembly. 

**Why we built this:** To prove to technical judges that our edge-compute architecture is mathematically viable for complex semantic understanding without relying on cloud APIs.

### How to Run V2
Because it loads a 22MB neural network, V2 requires a local HTTP server to bypass browser CORS restrictions.
1. Open a terminal and navigate to the `controlplane-prototype-v2` folder.
2. Run `python -m http.server 8001` (or any equivalent local server).
3. Open `http://localhost:8001` in your browser.
4. Watch the top right corner: It features **Progressive Enhancement**. You can use the app instantly, and once the 22MB model finishes downloading in the background, it silently upgrades to the real neural network.

### What to Test in V2
*   **Semantic Hallucination (Factual Contradiction):** Go to the Sandbox. Enter the prompt `What is the refund policy?` and paste the response: `Customers may request a full refund within 60 days of purchase.`
*   Watch as the system calculates the 384-dimensional dense vectors of your input, compares it against the company corpus (30 days), catches the exact numeric contradiction, and triggers a **Tier 1 Hard Block**.

---

## Technology Stack
- **Frontend Core:** Vanilla HTML5, CSS3, JavaScript (ES6+). Zero heavy frameworks to ensure sub-50ms rendering.
- **V1 Embeddings:** Custom TF-IDF engine with cosine similarity.
- **V2 Embeddings:** `transformers.js` running WebAssembly (WASM).
- **Security Checksums:** Luhn algorithm (Credit Cards), Verhoeff algorithm (Aadhaar).

---

## Technical Architecture Deep-Dive

### Prototype V1: Lightweight Edge Firewall (TF-IDF)
**Goal:** Prove the sub-50ms latency interception layer.
- **Execution Environment:** Client-side browser execution (zero-backend).
- **Grounding Engine:** Custom TF-IDF (Term Frequency-Inverse Document Frequency) implementation. Converts the corpus and response into sparse vectors and calculates Cosine Similarity.
- **Policy Engine:** Hardcoded deterministic rules (e.g., Regex for SSN, Checksums for PCI data).
- **Cost Engine:** Heuristic token counting predicting API burn rates.
- **Performance:** Executes all Tier 1 checks in under **5ms**.

### Prototype V2: Advanced Semantic Firewall (Neural Network)
**Goal:** Prove edge-based deep semantic understanding without relying on cloud LLM APIs.
- **Execution Environment:** Client-side browser execution via WebAssembly (WASM) using `Transformers.js`.
- **Model:** `all-MiniLM-L6-v2` (quantized to ~22MB).
- **Grounding Engine:** Generates 384-dimensional dense vectors. Performs real-time semantic similarity and factual contradiction checks against the knowledge corpus.
- **Progressive Enhancement:** The UI loads instantly, and the WASM model downloads asynchronously in a Web Worker, preventing thread-blocking.
- **Performance:** Executes full semantic retrieval and inference entirely locally in under **250ms**.
