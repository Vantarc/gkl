#!/usr/bin/env python3

from flask import Flask, render_template
from configuration import Configuration

app = Flask(__name__)
app.config.from_object(Configuration)


@app.route('/')
def home():
    return render_template('index.html')


if __name__ == '__main__':
    app.run()
