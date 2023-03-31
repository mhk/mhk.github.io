# Copyright (c) 2010-2011 Joshua Harlan Lifton.
# See LICENSE.txt for details.

# TODO: add tests for all machines
# TODO: add tests for new status callbacks

"""Base classes for machine types. Do not use directly."""

import binascii

from plover import _, log
from plover.machine.keymap import Keymap
from plover.misc import boolean


# i18n: Machine state.
STATE_STOPPED = _('stopped')
# i18n: Machine state.
STATE_INITIALIZING = _('initializing')
# i18n: Machine state.
STATE_RUNNING = _('connected')
# i18n: Machine state.
STATE_ERROR = _('disconnected')


class StenotypeBase:
    """The base class for all Stenotype classes."""

    # Layout of physical keys.
    KEYS_LAYOUT = ''
    # And special actions to map to.
    ACTIONS = ()
    # Fallback to use as machine type for finding a compatible keymap
    # if one is not already available for this machine type.
    KEYMAP_MACHINE_TYPE = None

    def __init__(self):
        # Setup default keymap with no translation of keys.
        keys = self.get_keys()
        self.keymap = Keymap(keys, keys)
        self.keymap.set_mappings(zip(keys, keys))
        self.stroke_subscribers = []
        self.state_subscribers = []
        self.state = STATE_STOPPED

    def set_keymap(self, keymap):
        """Setup machine keymap."""
        self.keymap = keymap

    def start_capture(self):
        """Begin listening for output from the stenotype machine."""
        pass

    def stop_capture(self):
        """Stop listening for output from the stenotype machine."""
        pass

    def add_stroke_callback(self, callback):
        """Subscribe to output from the stenotype machine.

        Argument:

        callback -- The function to call whenever there is output from
        the stenotype machine and output is being captured.

        """
        self.stroke_subscribers.append(callback)

    def remove_stroke_callback(self, callback):
        """Unsubscribe from output from the stenotype machine.

        Argument:

        callback -- A function that was previously subscribed.

        """
        self.stroke_subscribers.remove(callback)

    def add_state_callback(self, callback):
        self.state_subscribers.append(callback)

    def remove_state_callback(self, callback):
        self.state_subscribers.remove(callback)

    def _notify(self, steno_keys):
        """Invoke the callback of each subscriber with the given argument."""
        for callback in self.stroke_subscribers:
            callback(steno_keys)

    def set_suppression(self, enabled):
        '''Enable keyboard suppression.

        This is only of use for the keyboard machine,
        to suppress the keyboard when then engine is running.
        '''
        pass

    def suppress_last_stroke(self, send_backspaces):
        '''Suppress the last stroke key events after the fact.

        This is only of use for the keyboard machine,
        and the engine is resumed with a command stroke.

        Argument:

        send_backspaces -- The function to use to send backspaces.
        '''
        pass

    def _set_state(self, state):
        self.state = state
        for callback in self.state_subscribers:
            callback(state)

    def _stopped(self):
        self._set_state(STATE_STOPPED)

    def _initializing(self):
        self._set_state(STATE_INITIALIZING)

    def _ready(self):
        self._set_state(STATE_RUNNING)

    def _error(self):
        self._set_state(STATE_ERROR)

    @classmethod
    def get_actions(cls):
        """List of supported actions to map to."""
        return cls.ACTIONS

    @classmethod
    def get_keys(cls):
        return tuple(cls.KEYS_LAYOUT.split())

    @classmethod
    def get_option_info(cls):
        """Get the default options for this machine."""
        return {}

