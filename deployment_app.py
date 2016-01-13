from flask import Flask, redirect
from flask_restful import url_for, Api

#import resource components
from resources.Customers import CustomerResource, CustomersResource

app = Flask(__name__)
api = Api(app)


@app.route('/')
def index():
    return redirect(url_for('static', filename='index.html'))

##
## Actually setup the Api resource routing here
##
api.add_resource(CustomersResource, '/customers')
api.add_resource(CustomerResource, '/customer/<customer_id>')

if __name__ == '__main__':
    app.run(debug=True)