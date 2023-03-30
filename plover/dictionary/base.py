# Copyright (c) 2013 Hesky Fisher
# See LICENSE.txt for details.

# TODO: maybe move this code into the StenoDictionary itself. The current saver
# structure is odd and awkward.
# TODO: write tests for this file

"""Common elements to all dictionary formats."""

from os.path import splitext
import functools

from plover.registry import registry


def _get_dictionary_class(filename):
    extension = splitext(filename)[1].lower()[1:]
    try:
        dict_module = registry.get_plugin('dictionary', extension).obj
    except KeyError:
        raise ValueError(
            'Unsupported extension: %s. Supported extensions: %s' %
            (extension, ', '.join(plugin.name for plugin in
                                  registry.list_plugins('dictionary'))))
    return dict_module

def create_dictionary(resource):
    '''Create a new dictionary.

    The format is inferred from the extension.

    Note: the file is not created! The resulting dictionary save
    method must be called to finalize the creation on disk.
    '''
    d = _get_dictionary_class(resource).create(resource)
    return d

def load_dictionary(resource):
    '''Load a dictionary from a file.

    The format is inferred from the extension.
    '''
    d = _get_dictionary_class(resource).load(resource)
    return d
