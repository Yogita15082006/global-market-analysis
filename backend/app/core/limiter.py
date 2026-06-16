from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def _rate_limit_key(request: Request) -> str:
    """Key rate limits by authenticated user id when available, else by remote IP.

    This prevents a single user from exhausting limits across different IPs
    and avoids punishing other users when one IP is shared (e.g. NAT/proxy).
    """
    user = getattr(request.state, "user", None)
    if isinstance(user, dict) and user.get("id"):
        return f"user:{user['id']}"
    return get_remote_address(request)


# Global limiter instance — imported by route modules
limiter = Limiter(key_func=_rate_limit_key, default_limits=[])
