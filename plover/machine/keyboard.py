# -*- coding: utf-8 -*-
# Copyright (c) 2010 Joshua Harlan Lifton.
# See LICENSE.txt for details.

"For use with a computer keyboard (preferably NKRO) as a steno machine."

from plover import _
from plover.machine.base import StenotypeBase
from plover.misc import boolean
from plover.oslayer.keyboardcontrol import KeyboardCapture
from plover.machine.keyboard_capture import Capture

class ExternalKeyboardCapture(Capture):
    def __init__(self):
        self.keys_pressed = set()
        try:
            import js
            from pyodide.ffi import create_proxy
            js.createObject(create_proxy(self.pyKeyDown), "pyCallback_key_down")
            js.createObject(create_proxy(self.pyKeyUp)  , "pyCallback_key_up")
            self.start = self.web_start
            self.cancel = self.web_cancel
            self.suppress_keyboard = self.web_suppress
            self.run = self.web_run
        except ImportError:
            import threading
            self._cancelled = False
            self.start = self.web_start
            self.cancel = self.thread_cancel
            self.suppress_keyboard = self.thread_suppress
            self._thread = threading.Thread(name='ExternalKeyboardCapture', target=self.thread_run)
            self.start = self.thread_start
            self.run = self.thread_run

    def _console(self, text):
        try:
            import js
            js.console.log(text)
        except ImportError:
            pass

    def pyKeyDown(self, key):
        self.keys_pressed.add(key)
        self._console(f"pyKeyDown '{key}' [{' '.join(self.keys_pressed)}]")
        self.key_down(key);

    def pyKeyUp(self, key):
        self.keys_pressed.remove(key)
        self._console(f"pyKeyUp '{key}' [{' '.join(self.keys_pressed)}]")
        self.key_up(key);

    def web_start(self):
        pass

    def web_run(self):
        pass

    def web_cancel(self):
        pass

    def web_suppress(self, suppressed_keys=()):
        pass

    def _handler(self, key_events):
        for evt in key_events.strip().split():
            if evt.strip().lower() == 'quit' or evt.strip().lower() == 'exit':
                return False
            if evt.startswith('+'):
                self.key_down(evt[1:])
            elif evt.startswith('-'):
                self.key_up(evt[1:])
            else:
                self.key_down(evt)
                self.key_up(evt)
        return True

    def thread_run(self):
        finished = False
        while not (finished or self._cancelled):
            try:
                key_events = input('--> ');
                finished = not self._handler(key_events)
            except EOFError:
                finished = True

    def thread_start(self):
        pass

    def thread_cancel(self):
        self._cancelled = True

    def thread_suppress(self, suppressed_keys=()):
        pass

# i18n: Machine name.
_._('Keyboard')


class Keyboard(StenotypeBase):
    """Standard stenotype interface for a computer keyboard.

    This class implements the three methods necessary for a standard
    stenotype interface: start_capture, stop_capture, and
    add_callback.

    """

    KEYS_LAYOUT = KeyboardCapture.SUPPORTED_KEYS_LAYOUT
    ACTIONS = ('arpeggiate',)

    def __init__(self, params):
        """Monitor the keyboard's events."""
        super().__init__()
        self._arpeggiate = params['arpeggiate']
        self._is_suppressed = False
        # Currently held keys.
        self._down_keys = set()
        # All keys part of the stroke.
        self._stroke_keys = set()
        self._keyboard_capture = None
        self._last_stroke_key_down_count = 0
        self._stroke_key_down_count = 0
        self._update_bindings()

    def _suppress(self):
        if self._keyboard_capture is None:
            return
        suppressed_keys = self._bindings.keys() if self._is_suppressed else ()
        self._keyboard_capture.suppress_keyboard(suppressed_keys)

    def _update_bindings(self):
        self._arpeggiate_key = None
        self._bindings = dict(self.keymap.get_bindings())
        for key, mapping in list(self._bindings.items()):
            if 'no-op' == mapping:
                self._bindings[key] = None
            elif 'arpeggiate' == mapping:
                if self._arpeggiate:
                    self._bindings[key] = None
                    self._arpeggiate_key = key
                else:
                    # Don't suppress arpeggiate key if it's not used.
                    del self._bindings[key]
        self._suppress()

    def set_keymap(self, keymap):
        super().set_keymap(keymap)
        self._update_bindings()

    def get_keyboard_capture(self):
        return ExternalKeyboardCapture()

    def start_capture(self):
        """Begin listening for output from the stenotype machine."""
        self._initializing()
        try:
            self._keyboard_capture = self.get_keyboard_capture()
            self._keyboard_capture.key_down = self._key_down
            self._keyboard_capture.key_up = self._key_up
            self._suppress()
            self._keyboard_capture.start()
            self.run = self._keyboard_capture.run
        except:
            self._error()
            raise
        self._ready()

    def stop_capture(self):
        """Stop listening for output from the stenotype machine."""
        if self._keyboard_capture is not None:
            self._is_suppressed = False
            self._suppress()
            self._keyboard_capture.cancel()
            self._keyboard_capture = None
        self._stopped()

    def _run(self):
        pass

    def set_suppression(self, enabled):
        self._is_suppressed = enabled
        self._suppress()

    def suppress_last_stroke(self, send_backspaces):
        send_backspaces(self._last_stroke_key_down_count)
        self._last_stroke_key_down_count = 0

    def _key_down(self, key):
        """Called when a key is pressed."""
        assert key is not None
        self._stroke_key_down_count += 1
        self._down_keys.add(key)
        self._stroke_keys.add(key)
        steno_keys = {self._bindings.get(k) for k in self._stroke_keys}
        steno_keys -= {None}
        try:
            import js
            for key in steno_keys:
                js.jsCallback_on(key)
        except ImportError:
            pass

    def _key_up(self, key):
        """Called when a key is released."""
        assert key is not None
        self._down_keys.discard(key)

        steno_keys = self._bindings.get(key)
        # A stroke is complete if all pressed keys have been released,
        # and — when arpeggiate mode is enabled — the arpeggiate key
        # is part of it.
        if (
            self._down_keys or
            not self._stroke_keys or
            (self._arpeggiate and self._arpeggiate_key not in self._stroke_keys)
        ):
            return
        self._last_stroke_key_down_count = self._stroke_key_down_count
        steno_keys = {self._bindings.get(k) for k in self._stroke_keys}
        steno_keys -= {None}
        try:
            import js
            from plover.steno import Stroke
            stroke = Stroke(steno_keys)
            js.jsCallback_stroke(f"{stroke.rtfcre}")
            for key in steno_keys:
                js.jsCallback_off(key)
        except ImportError:
            pass
        if steno_keys:
            self._notify(steno_keys)
        self._stroke_keys.clear()
        self._stroke_key_down_count = 0

    @classmethod
    def get_option_info(cls):
        return {
            'arpeggiate': (False, boolean),
        }
