"""`main` is the top level module for your Flask application."""

# Import the Flask Framework
from flask import render_template, url_for, redirect
from flask import Flask
app = Flask(__name__)
# Note: We don't need to call run() since our application is embedded within
# the App Engine WSGI application server.


@app.route('/')
def index():
    """Return a friendly HTTP greeting."""
    #return '---Sofie Biosciences Software Deployment Platform---'
    return redirect(url_for('static', filename='index.html'))

@app.route('/test')
def test():
    return "---hello world---"

@app.errorhandler(404)
def page_not_found(e):
    """Return a custom 404 error."""
    return 'Sorry, Nothing at this URL.', 404


@app.errorhandler(500)
def application_error(e):
    """Return a custom 500 error."""
    return 'Sorry, unexpected error: {}'.format(e), 500