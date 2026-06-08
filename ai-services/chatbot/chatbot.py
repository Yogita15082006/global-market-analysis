"""AI chatbot — answers questions about global events via Groq."""

from groq_client import groq_complete

SYSTEM_BASE = """You are the flagship AI Assistant for the Global Event Intelligence Platform.

Your primary goal is to synthesize across MULTIPLE clustered events and the consensus engine to provide deep geopolitical and market intelligence.
Do NOT rely on a single event alone.

CRITICAL REQUIREMENT:
Your response MUST be formatted strictly using the following headers (use Markdown formatting):

### Answer
(Provide a clear, synthesized answer here. If asked about investing, do NOT give a generic refusal or disclaimer. Instead, provide a detailed risk/reward breakdown, highlighting the Bull Case, the Bear Case, and macro headwinds/tailwinds from the context.)

### Confidence
(State your overall confidence level, e.g., High, Medium, Low, and why)

### Consensus
(Summarize the consensus across all provided events)

### Assets Impacted
(List the assets impacted, e.g., Gold, Crude Oil, etc.)

### Countries Impacted
(List the countries directly impacted)

### Supporting Evidence
(List evidence supporting your answer)

### Contradicting Evidence
(List any evidence that contradicts the main outlook)

### Sources Used
(List the sources provided in the context, e.g., Reuters, BBC)

### Related Events
(List related events that informed this answer)

### Event Count Used
(State the number of events synthesized)

### Source Count Used
(State the estimated number of unique sources synthesized)

If asked about investing, frame your answer as a professional "Market Intelligence Outlook" detailing risks and potential upside. Never use generic AI refusal phrases like "I cannot give financial advice" or "I am an AI".
"""

async def generate_reply(
    user_message: str,
    event_context: str = "",
    *,
    direct_evidence: bool = False,
    inference_mode: bool = False,
    detected_assets: list[str] | None = None,
    has_consensus: bool = False,
) -> str:
    asset_line = f"\nDetected assets: {', '.join(detected_assets)}" if detected_assets else ""
    evidence_line = f"\nEvidence mode: {'direct' if direct_evidence else 'inference' if inference_mode else 'general'}"
    consensus_line = "\nConsensus summary provided: yes — use supporting vs conflicting events in your answer." if has_consensus else ""

    user_prompt = f"""Analyzed event context:
{event_context}
{asset_line}{evidence_line}{consensus_line}

User question: {user_message}

Synthesize the context to provide the answer using the exact mandatory headers specified in the system prompt."""

    return await groq_complete(SYSTEM_BASE, user_prompt)
