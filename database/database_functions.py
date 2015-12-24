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
