#!/usr/bin/env python3

from flask import Flask, render_template, flash, request, redirect, url_for, jsonify
from configuration import Configuration
from werkzeug.utils import secure_filename
import os
import json
from flask_httpauth import HTTPBasicAuth
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
auth = HTTPBasicAuth()

@auth.error_handler
def auth_error():
    return json_response(403, "Access Denied.")

@auth.verify_password
def verify_password(username, password):
    if username in users:
        return check_password_hash(users.get(username), password)
    return False

UPLOAD_FOLDER = '/tmp/'
ALLOWED_EXTENSIONS = {'pdf'}

app = Flask(__name__)
app.config.from_object(Configuration)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

users = {
    "gatrobe": generate_password_hash(app.config['PRINTING_PASSWORD'])
}


@app.route('/')
def home():
    return render_template('index.html')

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def json_response(code, str):
    response = app.response_class(
        response=json.dumps({ "message": str})+"\n",
        status=code,
        mimetype='application/json'
    )
    return response

@app.route('/print', methods=['POST'])
@auth.login_required
def upload_file():
    # check if the post request has the file part
    if 'file' not in request.files:
        return json_response(400, "No file part.")
    file = request.files['file']
    # if user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        return json_response(400, "No file selected.")
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        dest_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(dest_path)
        extra = ""
        if not app.config['DO_NOT_PRINT']:
            os.system("lp " + dest_path)
        else:
            extra = " (Printing is disabled server side, so the file was just uploaded but not printed)"
        return json_response(200, "Printing..." + extra)
    else:
        return json_response(400, "You can only upload PDFs for printing.")

if __name__ == '__main__':
    app.run()
