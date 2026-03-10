"""각 노드에서 progress.emit("...") 으로 호출. 라우트 핸들러가 set_callback으로 설치."""
import contextvars
from typing import Callable

_progress_callback: contextvars.ContextVar[Callable[[str], None] | None] = (
    contextvars.ContextVar("_progress_callback", default=None)
)


def set_callback(cb: Callable[[str], None]) -> contextvars.Token:
    return _progress_callback.set(cb)


def reset_callback(token: contextvars.Token) -> None:
    _progress_callback.reset(token)


def emit(message: str) -> None:
    cb = _progress_callback.get()
    if cb is not None:
        cb(message)
