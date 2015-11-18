import os
import requests
import json
import time
import rsa
import sys
import random
import struct
from Crypto.Cipher import AES
from flask import Blueprint, render_template, request, Response

GIT_OWNER = "SofieBiosciences"
GIT_REPO = "Elixys"
PYELIXYS_BASE_DIR = "https://api.github.com/repos/%s/%s/" % (GIT_OWNER, GIT_REPO)
GIT_OATH = os.environ["GIT_TOKEN"]
ENCRYPTION_KEY = '1234567890123456'

github = Blueprint('github', __name__, url_prefix="/github",static_folder='static')

@github.route("/branches", methods=["GET"])
def branches():
    url = PYELIXYS_BASE_DIR + "git/refs/heads"
    versions = requests.get(url,headers=git_headers())
    releases = versions.json()
    if "Accept" in request.headers and request.headers['Accept'] == 'json':
        return json.dumps(releases)
    return render_template("branches.html", releases=versions.text)

@github.route("/branches/download", methods=["GET"])
def download_branch():
    ref = request.args.get('ref', '')
    url = PYELIXYS_BASE_DIR + "zipball/%s" % ref
    content = requests.get(url,headers=git_headers(),stream=True)
    return Response(response=generate(content),content_type="application/zip")

@github.route("/versions", methods=["GET"])
def git_versions():
    url = PYELIXYS_BASE_DIR + "releases"
    versions = requests.get(url,headers=git_headers())
    releases = versions.json()
    if "Accept" in request.headers and request.headers['Accept'] == 'json':
        return json.dumps(releases)
    else:
        return render_template("versions.html", releases=versions.text)

@github.route("/versions/download", methods=["GET"])
def download():
    url = request.args.get('url', '')
    content = requests.get(url,headers=git_headers(),stream=True)
    return Response(response=generate(content),content_type="application/zip")

def generate(stream):
    iv = ''.join(chr(random.randint(0, 0xFF)) for i in range(16))
    encryptor = AES.new(ENCRYPTION_KEY, AES.MODE_CBC, iv)
    yield iv
    for stream in stream.raw.stream():
        if len(stream) % 16 != 0:
            stream += ' ' * (16 - len(stream) % 16)

        yield encryptor.encrypt(stream)

def git_headers():
    token = GIT_OATH
    return {
        "Authorization": "token %s " % token
    }
