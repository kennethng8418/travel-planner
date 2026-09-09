"""
Centralized LLM configuration.

Two tiers:
  - fast_llm:   cheap, low-latency — for classification, extraction, validation
  - strong_llm: high-quality reasoning — for itinerary generation and refinement
"""

import os
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic

load_dotenv()  # ← this reads your .env file

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

fast_llm = ChatAnthropic(
    model="claude-haiku-4-5-20251001",
    api_key=ANTHROPIC_API_KEY,
    temperature=0,
    max_tokens=1024,
)

strong_llm = ChatAnthropic(
    model="claude-sonnet-4-6",
    api_key=ANTHROPIC_API_KEY,
    temperature=0.7,
    max_tokens=4096,
)