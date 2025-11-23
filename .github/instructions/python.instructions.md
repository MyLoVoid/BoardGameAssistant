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
- Use `typing` & `collections.abc` (`Iterable`, `Mapping`, `Sequence`) over concrete types where possible.
- Prefer `TypedDict`, `Protocol`, `NewType`, `Literal` for precise contracts.
- Avoid `Any`; if unavoidable, limit scope and document why.
- Return `Optional[T]` **only** when `None` is a valid, documented state.
- Keep param/return docstrings consistent with type hints.

## 3) Error Handling

- Fail early with precise exceptions; **no** bare `except`.
- Catch only known exceptions; re-raise with context using `raise ... from e`.
- Validate inputs (boundaries, invariants) and document them.
- Prefer domain-specific exceptions (custom subclasses) for library code.

## 4) Logging & Observability

- Use `logging` (module-level logger). No `print()` for library code.
- Log context, not secrets. Never log tokens, passwords, or PII.
- Prefer structured logs (key=value hints in messages).
- Keep log levels meaningful: `debug` (dev detail), `info` (flow), `warning` (recoverable), `error` (fail).

## 5) Async & Concurrency

- For I/O-bound tasks, prefer `async`/`await` over threads.
- Never block inside async functions (no CPU-heavy loops, no `time.sleep`).
- Use `asyncio.create_task` with care; track tasks and cancellation.
- Use `anyio`/`asyncio` timeouts and cancellation handling; close sessions/clients.

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

- Never hardcode secrets; read from env or secret managers and document keys.
- Validate/escape external input; avoid `eval`/`exec`/shell unless sandboxed.
- Prefer parameterized queries; sanitize paths; least-privilege defaults.

## 9) Testing Guidance (what Copilot should generate on request)

- Use **pytest** with clear AAA (Arrange-Act-Assert) structure.
- Prefer pure unit tests; mock I/O and network (`pytest.mark.asyncio` for async).
- Include minimal fixtures and property-based tests (`hypothesis`) for critical logic.
- Cover edge cases (empty, None, invalid bounds, big inputs).

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

