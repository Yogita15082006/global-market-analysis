import re

# Hard-exclude patterns — events matching ANY of these are NEVER stored
IGNORE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(p, re.IGNORECASE)
    for p in [
        # Sports — comprehensive exclusion
        r"\bfootball\b", r"\bsoccer\b", r"\bcricket\b", r"\btennis\b",
        r"\bbasketball\b", r"\bbaseball\b", r"\bhockey\b", r"\brugby\b",
        r"\bwrestling\b", r"\bgolf\b", r"\bboxing\b", r"\bmma\b",
        r"\bnfl\b", r"\bnba\b", r"\bnhl\b", r"\bmlb\b", r"\bipl\b",
        r"\bpremier league\b", r"\bbundesliga\b", r"\bserie a\b",
        r"\bla liga\b", r"\bchampions league\b", r"\bworld cup\b",
        r"\bolympics\b", r"\bolympic\b", r"\bsuper bowl\b",
        r"\bgrand prix\b", r"\bformula one\b", r"\bf1 race\b",
        r"\bmatch result\b", r"\bfinal score\b", r"\bleague table\b",
        r"\btransfer fee\b", r"\btransfer window\b",
        # Explicit sports keywords
        r"\bsports\b", r"\bsportsman\b", r"\bathlete\b",
        r"\bchampionship\b", r"\btournament\b", r"\bleague match\b",
        r"\bplayoffs?\b", r"\bscoreline\b",
        # Entertainment / Celebrity
        r"\bcelebrity\b", r"\bcelebrities\b", r"\bentertainment\b",
        r"\bwedding\b", r"\bmarriage ceremony\b", r"\bgossip\b",
        r"\btabloid\b", r"\blifestyle\b", r"\bfashion week\b",
        r"\bred carpet\b", r"\bbollywood\b", r"\bhollywood star\b",
        r"\bactor\b", r"\bactress\b", r"\bsinger\b", r"\bpop star\b",
        r"\bmusician\b", r"\bconcert tour\b", r"\bmusic video\b",
        r"\btv show\b", r"\breality show\b", r"\bnetflix series\b",
        r"\bfilm premiere\b", r"\bmovie release\b", r"\bbox office\b",
        r"\bviral\b", r"\bsocial media drama\b",
    ]
]

# 90-100 tier — CRITICAL
TIER_1_PATTERNS: list[re.Pattern[str]] = [
    re.compile(p, re.IGNORECASE)
    for p in [
        r"\bwar\b", r"\bmilitary action", r"\bnuclear", r"\bsanction",
        r"\bterroris", r"\benergy disruption", r"\bcritical election",
        r"\bdiplomatic cris", r"\binvasion\b", r"\bmissile",
        r"\bairstrikes?\b", r"\bgenocide\b", r"\bcoalition forces\b",
        r"\bwarships?\b", r"\bmilitary offensive\b", r"\bceasefire\b",
        r"\bbombing\b", r"\bcoup\b", r"\bregime change\b",
    ]
]

# 70-89 tier — HIGH
TIER_2_PATTERNS: list[re.Pattern[str]] = [
    re.compile(p, re.IGNORECASE)
    for p in [
        r"\bmacroeconom", r"\btrade agreement\b", r"\bpolitical instability\b",
        r"\bcommodity shock\b", r"\bcentral bank\b", r"\binflation\b",
        r"\btariff\b", r"\brecession\b", r"\bgeopolit",
        r"\bdiplomatic\b", r"\bsanctions?\b", r"\bembargo\b",
        r"\bconflict\b", r"\bcrisis\b", r"\binstability\b",
        r"\bprotests?\b", r"\bunrest\b", r"\bstrike\b",
        r"\bfed rate\b", r"\binterest rate\b", r"\bimf\b", r"\bworld bank\b",
        r"\boil price\b", r"\bcrude oil\b", r"\bnatural gas price\b",
        r"\bsupply disruption\b", r"\benergy crisis\b",
    ]
]

# 50-69 tier — MEDIUM
TIER_3_PATTERNS: list[re.Pattern[str]] = [
    re.compile(p, re.IGNORECASE)
    for p in [
        r"\bpolicy\b", r"\bgovernment\b", r"\belection\b", r"\bdiplomat",
        r"\benergy\b", r"\boil\b", r"\bgas\b", r"\btech", r"\bsemiconductor",
        r"\bmarket\b", r"\bdefen[sc]e\b", r"\bsupply chain", r"\bclimate\b",
        r"\btrade\b", r"\bexport\b", r"\bimport\b", r"\btariff\b",
        r"\bcurrency\b", r"\bdollar\b", r"\beuro\b", r"\bgold\b",
        r"\bsector\b", r"\beconomy\b", r"\bbudget\b", r"\bgdp\b",
        r"\bministry\b", r"\bparliament\b", r"\bsummit\b", r"\bilateral\b",
        r"\bregulat", r"\bfinancial\b", r"\bbanking\b",
    ]
]


def is_relevant_event(title: str, description: str | None = None) -> tuple[bool, str, int, str]:
    """
    Returns: (is_relevant, reason, relevance_score, intelligence_priority)
    
    Priority mapping:
      90-100 = CRITICAL
      70-89  = HIGH
      50-69  = MEDIUM
      <50    = rejected (not stored, not displayed)
    """
    text = f"{title} {description or ''}".strip()
    if not text:
        return False, "empty_content", 0, "LOW"

    # Hard fail for excluded categories — do NOT store these events
    for pattern in IGNORE_PATTERNS:
        if pattern.search(text):
            return False, f"ignored_keyword:{pattern.pattern}", 0, "LOW"

    score = 30  # Default — will fail the <50 threshold unless a keyword matches
    priority = "LOW"

    if any(pattern.search(text) for pattern in TIER_1_PATTERNS):
        score = 95
        priority = "CRITICAL"
    elif any(pattern.search(text) for pattern in TIER_2_PATTERNS):
        score = 78
        priority = "HIGH"
    elif any(pattern.search(text) for pattern in TIER_3_PATTERNS):
        score = 58
        priority = "MEDIUM"

    score = max(0, min(100, score))

    # Below 50 — reject: do not store, do not display
    if score < 50:
        return False, "low_relevance_score", score, priority

    return True, "passed", score, priority
