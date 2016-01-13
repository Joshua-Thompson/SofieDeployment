from flask_restful import request, Resource
from database.database_functions import *
import json

#customer
#create, read, update or delete customer from database
class CustomerResource(Resource):
    def get(self, customer_id):
        try:
            customer = get_customer_by_id(customer_id)
            if customer:
                customer_data = json.loads(customer.to_json())
            else:
                customer_data = {"error": "no customer found for specified id"}

            return {"customer": customer_data}

        except Exception as e:
            return {"customer": {"error": "server customer get error occured %s" % e}}


    def delete(self, customer_id):
        try:
            customer = get_customer_by_id(customer_id)
            if customer:
                customer.delete()
                response_data = {"customer_id": customer_id}
            else:
                response_data = {"error": "no customer found for specified id"}

            return {"customer": response_data} #,204

        except Exception as e:
            return {"error": "server customer delete error occured %s" % e} #,404

    def put(self, customer_id):
        try:
            customer_data = request.json
            print "put customer data %s" % customer_data
            customer = get_customer_by_id(customer_id)
            if customer:
                customer.update_from_json(customer_data)
                customer.save()
                customer_data = json.loads(customer.to_json())
            else:
                customer_data = {"error": "no customer found for specified id"}

            return {"customer": customer_data}, 201
        except Exception as e:
            return {"error": "server customer put error occured %s" % e}, 201


# Customers
# shows a list of all customers, and lets you POST to add new customer
class CustomersResource(Resource):
    def get(self):
        try:
            customers = get_customers()
            return {"customers":customers}
        except Exception as e:
            return {"customers": {"error": "server customers get error occured %s" % e}}


    def post(self):
        try:
            customer_data = request.json
            print "customer data %s" % customer_data
            new_customer = add_customer(customer_data)
            new_customer_data = json.loads(new_customer.to_json())
            return {"customers":new_customer_data}, 201
        except Exception as e:
            return {"customers": {"error": "server customers post error occured %s" % e}}, 201