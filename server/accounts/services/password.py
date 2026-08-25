import secrets


def generate_initial_password() -> str:
    """4-digit one-time password for a newly registered or re-registered
    user. Returned in plaintext exactly once (the registration response) for
    the Admin to relay via SMS/email — never logged or stored unhashed. See
    context/library-docs.md → Django REST Framework + SimpleJWT.
    """
    return f"{secrets.randbelow(10000):04d}"
