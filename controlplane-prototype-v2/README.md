# ControlPlane.ai — README

## Overview

**ControlPlane.ai** is a real-time AI oversight middleware that intercepts and evaluates every AI-generated response **before** it reaches the end user. It acts as an enterprise-grade AI firewall, evaluating outputs against configurable policies, trusted grounding documents, and risk thresholds across three dimensions: **Performance** (hallucination), **Cost** (token efficiency), and **Responsibility** (PII, bias, toxicity).

Built for the **Accenture Innovation Challenge 2026 — Round 2 (Problem Track 1)**.

**Team:** AccentureInnovators#AI — IIT Kanpur  
**Members:** Himanshu Mahale (Leader), Vineet Nagrale, Rajat Kumar

---

## How to Run the Prototype

### Prerequisites
- Any modern web browser (Chrome, Firefox, Edge, Safari)
- No installation, no server, no dependencies required

### Quick Start (Recommended)
1. **Download or clone** the repository
2. **Open `index.html`** in your browser by double-clicking the file  
   - Path: `controlplane-prototype/index.html`
3. That's it — the prototype loads instantly and is fully functional

### Alternative: Run with a Local Server (optional)
If you prefer running via a local web server (e.g., for stricter CORS):

```bash
# Using Python (any version)
cd controlplane-prototype
python -m http.server 8000

# Then open http://localhost:8000 in your browser
```

### Alternative: Using Node.js
```bash
cd controlplane-prototype
npx serve .
```

---

## Prototype Features & Navigation

### 1. Live Traffic Dashboard
- **What it does:** Displays a real-time event stream of AI interactions flowing through the pipeline
- **How to use:** Click **"Auto-Play Traffic"** to simulate live traffic, or manually process scenarios
- **What to look for:** Color-coded PASS (green), WARN (yellow), BLOCK (red), REVIEW (blue) badges with real latency metrics

### 2. Deep Inspection View
- **What it does:** Full dimension-by-dimension forensic analysis of any interaction
- **How to use:** Click any event in the Live Traffic dashboard to drill into it
- **What to look for:** PII findings with checksum validation, grounding verdicts per claim, toxicity signals, cost metrics, and bias analysis

### 3. Policy Engine
- **What it does:** Live-configurable thresholds per use case
- **How to use:** Switch between Customer Support / Internal KB / Regulatory tabs. Adjust sliders for hallucination and PII thresholds. Select regulatory profiles (NONE / GDPR / HIPAA)
- **What to look for:** Changes take effect immediately on subsequent traffic

### 4. Live Sandbox
- **What it does:** Interactive testing — type any prompt + response and get instant analysis
- **How to use:** Enter a prompt and response, select a use case, click "Analyze"
- **What to look for:** Real-time detection results showing exactly what was flagged and why

### 5. Analytics Dashboard
- **What it does:** Runs the full evaluation suite and computes Precision, Recall, F1
- **How to use:** Click "Run Evaluation" to execute all 11 scenarios
- **What to look for:** Confusion matrix, per-scenario pass/fail, overall accuracy metrics

### 6. Architecture View
- **What it does:** Interactive 7-stage pipeline diagram
- **How to use:** Navigate to the Architecture tab
- **What to look for:** Complete flow from User → AI Model → Tier 1 → Grounding → Tier 2 → Policy Router → Safe Output with latency annotations

---

## Architecture Overview

```
User → AI Model → [ControlPlane.ai Pipeline] → Safe Output
                          │
                   ┌──────┴──────┐
                   │   TIER 1    │  <50ms, always-on
                   │ Deterministic│  PII, Toxicity, Bias,
                   │   Engine    │  Cost, High-Stakes
                   └──────┬──────┘
                          │
                   ┌──────┴──────┐
                   │  GROUNDING  │  TF-IDF retrieval
                   │   ENGINE    │  Claim verification
                   └──────┬──────┘
                          │
                   ┌──────┴──────┐
                   │   TIER 2    │  Only if flagged
                   │ LLM-as-Judge│  ~400-800ms
                   └──────┬──────┘
                          │
                   ┌──────┴──────┐
                   │   POLICY    │  Per-use-case rules
                   │   ROUTER    │  PASS/WARN/BLOCK/REVIEW
                   └─────────────┘
```

---

## Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Frontend | Vanilla HTML/CSS/JS | Zero dependencies, instant load, offline-capable |
| Fonts | Inter + Outfit (Google Fonts) | Premium typography |
| Icons | Material Icons Round | Consistent enterprise UI |
| Charts | Chart.js (CDN) | Analytics visualizations |
| Detection | Custom regex + TF-IDF | Deterministic, auditable, no black boxes |
| Grounding | TF-IDF cosine similarity | Offline corpus verification |

---

## File Structure

```
controlplane-prototype/
├── index.html              # Main application entry point
├── css/
│   ├── index.css           # Design system & tokens
│   ├── dashboard.css       # Live traffic styles
│   ├── inspection.css      # Deep inspection styles
│   ├── policy.css          # Policy engine styles
│   ├── sandbox.css         # Sandbox styles
│   └── analytics.css       # Analytics styles
├── js/
│   ├── data/
│   │   ├── scenarios.js    # 11 labeled test scenarios across 3 use cases
│   │   └── corpus.js       # 9+ trusted enterprise documents
│   ├── detection.js        # Unified Detection Engine (PII, Bias, Toxicity, Cost, etc.)
│   ├── grounding.js        # TF-IDF Grounding Engine with claim verification
│   ├── tier2.js            # Simulated LLM-as-a-Judge
│   ├── simulation.js       # ControlPlane core engine (policies, routing, audit)
│   ├── dashboard.js        # Live Traffic Dashboard view
│   ├── inspection.js       # Deep Inspection view with human review
│   ├── policy.js           # Policy Engine view (regulatory profiles)
│   ├── sandbox.js          # Live Sandbox view
│   ├── analytics.js        # Analytics & Evaluation view
│   ├── loadTest.js         # Scale/throughput testing module
│   └── app.js              # Application shell & navigation
├── tests/
│   └── tests.js            # Automated regression suite
└── verify_*.js             # Node.js verification scripts
```

---

## Test Scenarios

The prototype includes 11 curated scenarios with ground-truth labels:

| ID | Use Case | Expected | Description |
|----|----------|----------|-------------|
| req_001 | Customer Support | PASS | Clean refund policy response |
| req_002 | Customer Support | BLOCK | Fabricated lifetime guarantee (hallucination) |
| req_003 | Customer Support | BLOCK | Full credit card + email + address (PII leak) |
| req_004 | Customer Support | BLOCK | Death threats and violence (toxicity) |
| req_005 | Customer Support | PASS | Clean return policy response |
| req_006 | Customer Support | BLOCK | Private jet claim + overlapping risk |
| req_007 | Internal KB | PASS | Clean financial summary |
| req_008 | Internal KB | BLOCK | Gender-based discrimination (bias) |
| req_009 | Internal KB | PASS | Educational discussion about bias |
| req_010 | Regulatory | BLOCK | Fabricated legal citations (hallucination) |
| req_011 | Regulatory | REVIEW | Autonomous lending decision (high-stakes) |

---

## Key Innovations

1. **Tiered Architecture:** Tier 1 handles ~90% of traffic in <50ms. Tier 2 fires only on ambiguous cases, saving cost and latency.
2. **Corpus-Grounded Verification:** Claims are individually extracted and verified against trusted documents using TF-IDF, with numeric conflict and polarity conflict detection.
3. **Corpus Ambiguity Detection:** When multiple trusted sources contradict each other, the system flags an AMBIGUOUS verdict instead of silently picking one.
4. **Regulatory Profiles:** GDPR and HIPAA profiles change detection behavior at the engine level, not just labels.
5. **Human Feedback Loop:** Reviewer decisions auto-adjust policy thresholds with safe clamping — the system learns from human judgment.
6. **Latency Budget Enforcement:** Each use case has a latency budget. If Tier 2 would exceed it, the system applies fail-open or fail-closed policies.

---

## Assumptions & Constraints

- The prototype operates fully offline — no API keys or network calls required
- Tier 2 (LLM-as-a-Judge) is simulated to demonstrate logic flow without active API dependencies
- Data resets on page reload (no persistent storage)
- Sample data is illustrative — designed to demonstrate detection capabilities across diverse risk categories
- Latency values are real `performance.now()` measurements, not hardcoded

---

## Contact

**Team AccentureInnovators#AI**  
Indian Institute of Technology Kanpur  
Himanshu Mahale · Vineet Nagrale · Rajat Kumar
