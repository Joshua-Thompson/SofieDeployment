from model import User, Customer
from db_config import URI
import json
from mongokit import *
connection = Connection(URI)
connection.register([User, Customer])

#get database and collections
db = connection.get_default_database()
users = db['users']
customers = db['customers']

#get documents

def get_customer_by_id(customer_id):
    customer_query = connection.Customer.find({'_id': ObjectId(customer_id)})
    if customer_query.count():
        customer = customer_query.next()
    else:
        customer = None
    return customer

def get_customers():
    customer_query = connection.Customer.find()
    customers = []
    if customer_query.count():
        for customer in customer_query:
            customers.append(json.loads(customer.to_json()))

    return customers

#add document
def add_customer(customer_data):
    customer = connection.Customer()
    for key in customer:
        if key in customer_data:
            customer[key] = customer_data[key]

    customer.save()
    return customer

#get user by name (first result)
def get_first_user_by_login(username, password):
    user_query = connection.User.find({'name': username, 'password': password})
    if user_query.count():
        return user_query.next()
    else:
        return None


#add new user to db with username / password
def add_user(user_data):
    #make sure user doesn't already exist by checking username

    user = connection.User()
    username = user_data['name']
    user_query = connection.User.find({'name': username})
    if user_query.count():
        return
    
    for key in user:
        user[key] = user_data[key]

    user.save()
    return user