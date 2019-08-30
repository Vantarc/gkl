#!/usr/bin/env python3
# -*- coding: utf-8 -*-
__author__ = 'g3n35i5'

import gunicorn.app.base

from gunicorn.six import iteritems
from app import app


class StandaloneApplication(gunicorn.app.base.BaseApplication):

    def init(self, parser, opts, args):
        pass

    def __init__(self, _app, _options=None):
        self.options = _options or {}
        self.application = _app
        super(StandaloneApplication, self).__init__()

    def load_config(self):
        _config = dict([(key, value) for key, value in iteritems(self.options)
                       if key in self.cfg.settings and value is not None])
        for key, value in iteritems(_config):
            self.cfg.set(key.lower(), value)

    def load(self):
        return self.application


if __name__ == '__main__':
    # Set the gunicorn options.
    options = {
        'bind': '%s:%s' % (app.config['HOST'], app.config['PORT']), 'workers': 1
    }
    StandaloneApplication(app, options).run()
