#`main` is the top level module for your Flask application."""

# Import the Flask Frameworki
from flask import jsonify, request, json, render_template, url_for, redirect
from flask import Flask
app = Flask(__name__)
# Note: We don't need to call run() since our application is embedded within
# the App Engine WSGI application server.

#import mongokit for database manipulation
from database.db_config import MONGODB_HOST, MONGODB_PORT
from database.model import User, Customer
from mongokit import Connection
uri = 'mongodb://heroku_rvqmr5l8:3eufjtlo8i7dn6g13e47sle47r@ds033915.mongolab.com:33915/heroku_rvqmr5l8'
connection = Connection(uri)
connection.register([User, Customer])

#init a new user
db = connection.get_default_database()
users = db['users']
#user = users.User()
#user['name'] = u'admin'
#user['email'] = u'devel@sofiebio.com'
#user.save()

#init new customer
#init a new user
customers = db['customers']
# customer = customers.Customer()
# customer['name'] = u'UCLA'
# customer['email'] = u'user@ucla.com'
# customer['version'] = u'1.4.0'
# customer['update'] = u'none'
# customer['prevDownload'] = u'none'
# customer.save()

@app.route('/')
def index():
    """Return a friendly HTTP greeting."""
    #return '---Sofie Biosciences Software Deployment Platform---'
    return redirect(url_for('static', filename='index.html'))

@app.route('/test')
def test():
    return "---hello world!---"

@app.route('/create_customer', methods=["POST", "GET"])
def create_customer():
    print "creating customer"
    request_data = request.get_json(force=True)
    if 'create_customer' not in request_data:
        return jsonify({"create_customer": {"error": "missing request header"}})
    customer_data = request_data['create_customer']
    customer = customers.Customer()
    for data in customer:
        if data in customer_data:
            customer[data] = customer_data[data]

    customer.save()
    customer_dict = {'name': customer.name, 'version': customer.version,
                     'email': customer.email, 'update': customer.email, 'prevDownload': customer.prevDownload}
    return jsonify({'create_customer': customer_dict})



@app.route('/get_users', methods=["POST","GET"])
def get_users():
    print "getting users from db"
    users_list = []
    user_query = users.find()
    for user in user_query:
        users_list.append({'name':user['name'], 'email': user['email']})
    return jsonify({"users": users_list})


@app.route('/get_customers', methods=["POST","GET"])
def get_customers():
    print "getting customers from db"
    customer_list = []
    customer_query = customers.find()
    for customer in customer_query:
        customer_list.append({'name':customer['name'], 'email': customer['email'],
                              'version': customer['version'], 'prevDownload': customer['prevDownload'],
                              'update': customer['update']})
    return jsonify({"customers": customer_list})

@app.errorhandler(404)
def page_not_found(e):
    """Return a custom 404 error."""
    return 'Sorry, Nothing at this URL.', 404


@app.errorhandler(500)
def application_error(e):
    """Return a custom 500 error."""
    return 'Sorry, unexpected error: {}'.format(e), 500
