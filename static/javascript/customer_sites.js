//Model for displaying customer data
var CustomerSites = function() {
    var self = this;
    'use strict';
    self.customers = ko.observableArray([]);

    self.getCustomers = function(){
        //testing
        //self.customers.push(new Customer());
        //make request to db for customer data then update Customer objects
        Main.getApiCall('/customers', {}, gotCustomers)

    }

    self.getCustomers();

    function Customer(){
        var self = this;
        self.version = ko.observable("1.3.0");
        self.name = ko.observable("UCLA");
        self.email=ko.observable("user@user.com")
        self.update = ko.observable("N/A");
        self.prevDownload = ko.observable("N/A");
    }

    function gotCustomers(response){
        var customers = response.customers;
        if(customers.error){
            console.log("error getting customers");
            return;
        }

        if(customers){
            console.log("Received customers data");
            for(var i in customers){
                var customer = new Customer();
                customer.name(customers[i].name);
                customer.version(customers[i].version);
                customer.email(customers[i].email);
                customer.update(customers[i].update);
                customer.prevDownload(customers[i].prevDownload);
                self.customers.push(customer);

            }
        }
        else{
            console.log("Customer data not received");
        }
    }

   self.createCustomer = function(name, email){
        var data = {};
        data.create_customer = {};
        data.create_customer.name = name;
        data.create_customer.email = email;
        Main.postApiCall('/customers', data, createdCustomer);
   }

   function createdCustomer(response){
        var customer = response.customers;
        if(customer.error){
            console.log("error creating customer");
            return;
        }

        if(customer){
             var newCustomer = new Customer();
            console.log("created customer");
            newCustomer.name(customer.name);
            newCustomer.email(customer.email);
            self.customers.push(newCustomer);
        }
   }

};


