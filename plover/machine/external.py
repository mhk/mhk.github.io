# -*- coding: utf-8 -*-
# Copyright (c) 2010 Joshua Harlan Lifton.
# See LICENSE.txt for details.

# NOT USED
# NOT USED
# NOT USED
# NOT USED
# NOT USED

"For use with a computer keyboard (preferably NKRO) as a steno machine."
from plover import _
from plover.machine.keyboard import Keyboard
from plover.machine.keyboard_capture import Capture

# i18n: Machine name.
_._('External')


class ExternalKeyboardCapture(Capture):
    def __init__(self):
        self.web = False
        if self.web:
            import js
            from pyodide.ffi import create_proxy
            js.createObject(create_proxy(self.pyKeyDown), "pyKeyDown")
            js.createObject(create_proxy(self.pyKeyUp)  , "pyKeyUp")
            self.start = self.web_start
            self.cancel = self.web_cancel
            self.suppress_keyboard = self.web_suppress
        else:
            import threading
            self._thread = threading.Thread(name='ExternalKeyboardCapture', target=self._run)
            self._cancelled = False
            self.start = self.thread_start
            self.cancel = self.thread_cancel
            self.suppress_keyboard = self.thread_suppress

    def pyKeyDown(self, key):
        print(f"pyKeyDown: {key}")
        self.key_down(key);

    def pyKeyUp(self, key):
        print(f"pyKeyUp: {key}")
        self.key_up(key);

    def web_start(self):
        pass

    def cancel(self):
        pass

    def suppress(self, suppressed_keys=()):
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

    def _run(self):
        finished = False
        while not (finished or self._cancelled):
            key_events = input('--> ');
            finished = not self._handler(key_events)

    def thread_start(self):
        self._thread.start()

    def thread_cancel(self):
        self._cancelled = True

    def thread_suppress(self, suppressed_keys=()):
        pass

class External(Keyboard):
    """External stenotype interface used for remote connections.
    """
    def get_keyboard_capture(self):
        return ExternalKeyboardCapture()
