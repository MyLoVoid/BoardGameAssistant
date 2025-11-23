---
description: 'Python coding conventions and guidelines (Copilot)'
applyTo: '**/*.py'
---

# Python Coding Conventions (for Copilot)

> **Goal:** Generate correct, maintainable, and well-documented Python code that
> passes type checks, linters, and tests with minimal edits.

## 1) General Principles

- **Correctness first.** Preserve existing behavior unless the user explicitly asks to change it.
- **Clarity > Cleverness.** Prefer simple, readable solutions over micro-optimizations.
- **Small units.** Split complex logic into small, testable functions.
- **Immutability when viable.** Favor pure functions and `frozen` dataclasses for stable models.
- **No magic.** Avoid hidden globals, side effects, and implicit I/O.
- **Standard libs first.** Prefer `pathlib`, `dataclasses`, `enum`, `functools`, `itertools`, `contextlib`.

## 2) Typing & Interfaces

- Add/maintain **PEP 484** type hints everywhere (public APIs mandatory).
- **Python 3.11+ syntax**: Use `str | None` instead of `Optional[str]`, `int | str` instead of `Union[int, str]`.
- Use `typing` & `collections.abc` (`Iterable`, `Mapping`, `Sequence`) over concrete types where possible.
- Prefer `TypedDict`, `Protocol`, `NewType`, `Literal`, `TypeAlias` for precise contracts.
- Use `Self` type (Python 3.11+) for methods returning the same class instance.
- Avoid `Any`; if unavoidable, limit scope and document why.
- Return `T | None` **only** when `None` is a valid, documented state.
- Keep param/return docstrings consistent with type hints.
- Define complex types with `TypeAlias` at module level for reusability.

## 3) Error Handling

- Fail early with precise exceptions; **no** bare `except`.
- Catch only known exceptions; re-raise with context using `raise ... from e`.
- Use `except Exception as e` instead of bare except, but prefer specific exceptions.
- Validate inputs (boundaries, invariants) and document them.
- Prefer domain-specific exceptions (custom subclasses) for library code.
- Log exceptions with full context before re-raising: `logger.exception("Context message")`.
- Use context managers (`with` statement) for proper resource cleanup.
- For async code, ensure proper cleanup in `finally` blocks or async context managers.

## 4) Logging & Observability

- Use `logging` (module-level logger): `logger = logging.getLogger(__name__)`.
- No `print()` for library/production code; use logger instead.
- **Never log secrets**: tokens, passwords, API keys, PII, or sensitive data.
- Sanitize/redact sensitive fields in logs (e.g., mask email: `us***@example.com`).
- Prefer structured logs (key=value hints): `logger.info("User login", extra={"user_id": user_id})`.
- Keep log levels meaningful:
  - `debug`: Detailed diagnostic info for development
  - `info`: General flow of the application
  - `warning`: Unexpected but recoverable events
  - `error`: Error conditions that need attention
  - `critical`: System-level failures
- Include correlation IDs (request_id, session_id) for distributed tracing.
- Use `logger.exception()` in except blocks to capture stack traces automatically.

## 5) Async & Concurrency

- For I/O-bound tasks, prefer `async`/`await` over threads.
- Never block inside async functions (no CPU-heavy loops, no `time.sleep` - use `asyncio.sleep`).
- **Python 3.11+**: Use `asyncio.TaskGroup` for managing multiple concurrent tasks.
- For older Python: use `asyncio.gather()` with `return_exceptions=True` for error handling.
- Use `asyncio.create_task` with care; track tasks and handle cancellation properly.
- Always use timeouts for network/external calls: `asyncio.wait_for(coro, timeout=10)`.
- Close async resources properly using async context managers (`async with`).
- Use `contextlib.asynccontextmanager` for custom async cleanup logic.
- For FastAPI: use `Depends()` for dependency injection of async resources.
- Avoid mixing sync and async code; prefer fully async chains for I/O operations.

## 6) Code Style & Tooling

- Follow **PEP 8**; format with **Black** (line length **88**) and lint with **Ruff**.
- Imports: stdlib → third-party → local; no unused imports.
- F-strings over `%`/`str.format`.
- Use `pathlib.Path` for filesystem; avoid raw `os.path` APIs when possible.
- Keep functions <50–80 lines; break down otherwise.

## 7) Performance & Memory

- Optimize **after** profiling. Use generators/iterators for large streams.
- Avoid quadratic patterns; document complexity in docstrings when non-trivial.
- Cache with `functools.lru_cache` (bounded or invalidation strategy documented).

## 8) Security Hygiene

- **Secrets Management**:
  - Never hardcode secrets in code; read from environment variables or secret managers.
  - Document required env vars in `.env.example` (without actual values).
  - Use `pydantic-settings` for type-safe config loading.
  - Never commit `.env` files to version control (add to `.gitignore`).
- **Input Validation**:
  - Validate and sanitize all external input (API requests, file uploads, user input).
  - Use Pydantic models for automatic validation in FastAPI.
  - Avoid `eval()`, `exec()`, `compile()` unless absolutely necessary and sandboxed.
  - Sanitize file paths to prevent directory traversal attacks.
- **Database Security**:
  - Always use parameterized queries (Supabase client handles this).
  - Never build SQL with string concatenation or f-strings.
- **Authentication & Authorization**:
  - Validate JWT tokens on all protected routes.
  - Use constant-time comparison for secrets: `secrets.compare_digest()`.
  - Implement rate limiting on authentication and expensive endpoints.
  - Follow principle of least privilege for API keys and service accounts.
- **Dependency Security**:
  - Keep dependencies updated; monitor for CVEs.
  - Use `pip-audit` or `safety` to check for known vulnerabilities.
  - Pin dependency versions in `requirements.txt` or `pyproject.toml`.

## 9) FastAPI & Pydantic Best Practices

- **Pydantic Models**:
  - Use Pydantic v2 models for request/response validation.
  - Define models in `api/models/` separate from business logic.
  - Use `Field()` for validation, defaults, and documentation.
  - Use `model_validator` for complex cross-field validation.
  - Enable `ConfigDict(frozen=True)` for immutable models where appropriate.
- **Route Handlers**:
  - Keep route handlers thin; delegate business logic to services.
  - Use dependency injection (`Depends()`) for shared resources (DB, auth, config).
  - Return Pydantic models directly; FastAPI handles serialization.
  - Use proper HTTP status codes and exceptions (`HTTPException`).
- **Dependency Injection**:
  - Create reusable dependencies in `dependencies.py`.
  - Use `Annotated` with `Depends()` for cleaner signatures (Python 3.11+).
  - Implement auth dependencies that validate tokens and extract user info.
- **Error Handling**:
  - Use exception handlers (`@app.exception_handler`) for custom error responses.
  - Return consistent error response format across all endpoints.
  - Log errors before returning to client.
- **API Documentation**:
  - Add descriptions to routes, parameters, and models for auto-generated docs.
  - Use tags to organize endpoints in Swagger UI.
  - Provide example values in Pydantic models using `examples` in `Field()`.

## 10) Code Organization & Architecture

- **Separation of Concerns**:
  - **Routes** (`api/routes/`): Handle HTTP, validation, call services.
  - **Services** (`services/`): Business logic, orchestration, no HTTP awareness.
  - **Integrations** (`integrations/`): External API clients (Supabase, OpenAI, BGG).
  - **Models** (`api/models/`): Request/Response Pydantic models.
  - **Utils** (`utils/`): Pure helper functions, no business logic.
- **Dependency Management**:
  - Use `pyproject.toml` with modern tools (Poetry, PDM) or `requirements.txt` with pip-tools.
  - Separate dev dependencies: `requirements-dev.txt` or `[tool.poetry.group.dev]`.
  - Pin exact versions in lock files, ranges in source files.
- **Module Organization**:
  - One class per file for complex classes; related classes can share a module.
  - Use `__init__.py` to expose public API; keep internals private with `_prefix`.
  - Avoid circular imports; use dependency injection or late imports if needed.

## 11) Testing Guidance

- **Framework & Structure**:
  - Use **pytest** with clear AAA (Arrange-Act-Assert) structure.
  - For async tests: use `pytest-asyncio` with `@pytest.mark.asyncio` decorator.
  - Use `pytest-cov` for coverage reports; aim for >80% coverage on critical paths.
- **Test Types**:
  - **Unit tests**: Test individual functions/methods in isolation; mock external dependencies.
  - **Integration tests**: Test interactions with databases, APIs, and external services.
  - Use `unittest.mock` or `pytest-mock` for mocking; prefer dependency injection for testability.
- **FastAPI Testing**:
  - Use `TestClient` from FastAPI for testing endpoints (sync).
  - Use `httpx.AsyncClient` for async endpoint testing.
  - Override dependencies in tests using `app.dependency_overrides`.
- **Best Practices**:
  - Cover edge cases: empty inputs, None, invalid bounds, large inputs, unicode/special chars.
  - Test error paths and exception handling, not just happy paths.
  - Use fixtures for reusable test setup; keep fixtures minimal and focused.
  - Use `hypothesis` for property-based testing on critical business logic.
  - Name tests descriptively: `test_user_login_fails_with_invalid_credentials`.
- **Database Testing**:
  - Use test database or in-memory DB for integration tests.
  - Clean up test data after each test (use fixtures with cleanup).
  - Consider using database transactions that rollback after tests.

---

## Documentation (`/document`)

When the user writes **`/document`**:

- **Scope**
  - If a **selection** exists → document **only the selection**.
  - Else → document the **entire file**.
- **Language**: Docstrings and comments **must be in English**.
- **Edits**: Produce direct **in-place** code edits; **preserve behavior**.

### What to Generate

1. **Module docstring (top of file)**
   - One-line imperative summary.
   - Responsibilities and context.
   - **Dependencies** (stdlib & third-party), **Environment variables**, **Config keys**.
   - High-level usage example (doctest where appropriate).

2. **Function/method docstrings (Google style)**
   - Sections: `Args`, `Returns`, `Raises`. Add `Examples`, `Notes`, `Complexity` if useful.
   - Match parameter names, types, and defaults exactly.
   - Document side effects (I/O, network, global state, cache).

3. **Class/docstrings**
   - Purpose, behavior, invariants.
   - `__init__` args and important attributes.
   - Dataclasses: list each field, defaults, and constraints.

4. **Inline comments**
   - Only where logic/intent is non-obvious.
   - Explain invariants, assumptions, edge cases.
   - Avoid narrating the obvious.

5. **Public API focus**
   - Public symbols fully documented.
   - Private helpers (`_name`) brief but clear.

### Quality Checks (Copilot must aim to pass)

- `pydocstyle`/`flake8-docstrings` happy; first line ends with a period.
- No mismatches between signature and docstring.
- Valid doctests where shown (use realistic imports/returns).
- Consistent terminology across module.

### Docstring templates
**Module template**
```python
"""Short imperative summary of the module.

Longer description explaining responsibilities, core concepts, and integration.

Dependencies:
    - standardlib: pathlib, logging
    - third-party: requests>=2.32

Environment:
    FOO_API_URL: Base URL for external service.
    FOO_TIMEOUT: Request timeout in seconds (default: 10).

Example:
    >>> from package.module import main
    >>> main("--help")  # doctest: +ELLIPSIS
    'Usage: ...'
"""

**Function/method docstring (Google style)**

def example(a: int, b: int) -> int:
    """Return the sum of two integers.

    Args:
        a (int): First addend.
        b (int): Second addend.

    Returns:
        int: The sum of `a` and `b`.

    Raises:
        ValueError: If inputs do not satisfy preconditions.

    Notes:
        Preconditions: `a` and `b` must be within 32-bit signed range.

    Complexity:
        Time: O(1)
        Space: O(1)

    Examples:
        >>> example(2, 3)
        5
    """
    if not (-2**31 <= a <= 2**31 - 1 and -2**31 <= b <= 2**31 - 1):
        raise ValueError("Inputs out of 32-bit range.")
    return a + b
```

**Class docstring (with **init** args)**
**Class template**

```python
class FooClient:
    """HTTP client for Foo service.

    Args:
        base_url (str): Service base URL.
        timeout (float): Request timeout in seconds.

    Attributes:
        base_url (str): Configured base endpoint.
        timeout (float): Default request timeout.

    Raises:
        ValueError: If `base_url` is empty.
    """

    def __init__(self, base_url: str, timeout: float = 10.0) -> None:
        if not base_url:
            raise ValueError("base_url must not be empty.")
        self.base_url = base_url
        self.timeout = timeout
```

### Additional rules for /document

* **Type hints first:** If missing, add `typing` annotations to public APIs
  before writing docstrings.
* **Edge cases:** Document input validation, boundary conditions, and
  failure modes. Prefer explicit exceptions over silent failures.
* **Examples:** Prefer valid, copy-pasteable examples and doctests where feasible.
* **Safety & side effects:** Document I/O, network calls, thread-safety,
  mutability, and global state usage.
* **Consistency:** Keep terminology consistent across the file/module.
* **No over-commenting:** Do not explain trivial statements.

### Suggested commands (for user prompts)

* `/document` → document the whole file.
* `/document selección` → document only the selected code.
* `/document def funcion_name` → document a specific function.
* `/document class ClassName` → document a specific class.

