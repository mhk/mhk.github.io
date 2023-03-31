# from plover.gui_none.engine import Engine

from plover.engine import StenoEngine
from plover.config import Config
from plover.gui_none.add_translation import AddTranslation

def show_error(title, message):
    print('%s: %s' % (title, message))

class FakeKeyboardEmulation:
    def __init__(self):
        self.text = ''

    def _update_text(self, s):
        try:
            import js
            js.update_text(self.text)
        except ImportError:
            print(s)

    def send_backspaces(self, count):
        self.text = self.text[:-count]
        self._update_text(f" {count}xBackSpace")

    def send_string(self, s):
        self.text += s
        self._update_text(s)

    def send_key_combination(self, combo):
        print(combo)

class FakeController:

    def send_command(self, command):
        pass

    def start(self, message_cb):
        pass

    def stop(self):
        pass

def main2():
    from plover.registry import registry
    registry.update()
    main(None, None)

def main(config, controller):
    config = Config('./plover.cfg')
    engine = StenoEngine(config, FakeController(), FakeKeyboardEmulation())
    engine._add_translation = AddTranslation(engine)
    # engine = Engine(config, controller, FakeKeyboardEmulation())
    if not engine.load_config():
        return 3
    engine.start()
    try:
        return engine.run()
    except KeyboardInterrupt:
        engine.quit()
        engine.run()
    return engine.join()
