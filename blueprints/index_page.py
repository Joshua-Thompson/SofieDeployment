# flask index routing blueprnt

from flask import Blueprint, redirect, url_for, request
from database.database_functions import *

index_page = Blueprint('index_page', __name__, static_folder='static')

@index_page.route('/new_user', methods=["POST"])
def new_user():
    username = request.form['username']
    email = request.form['email']
    password = request.form['password']
    user_data = {"name": username, "password": password, "email": email}
    user = add_user(user_data)
    if user:
        return redirect(url_for('index_page.static', filename='index.html'))
    else:
        return redirect(url_for('index_page.static', filename='./templates/login.html'))

@index_page.route('/')
def login_page():
    return redirect(url_for('index_page.static', filename='./templates/login.html'))

@index_page.route('/login', methods=["POST"])
def login():
    username = request.form['username']
    password = request.form['password']
    user = get_first_user_by_login(username, password)
    print "username %s / password %s" % (username, password)
    print "got user %s" % user
    if user:
        return redirect(url_for('index_page.static', filename='index.html'))
    else:
        return redirect(url_for('index_page.static', filename='./templates/login.html'))

@index_page.route('/home')
def index():
    return redirect(url_for('index_page.static', filename='index.html'))
