//Model for displaying customer data
var CustomerSites = function() {
    var self = this;
    'use strict';
    self.newSiteName = ko.observable("");
    self.newSiteEmail = ko.observable("");
    self.newSiteVersion = ko.observable("");
    self.controller = new Controller(self);

    self.controller.getCustomers(); //get customers data from server/database

    self.createNewSite = function(){
        var name = self.newSiteName().trim(); //remove any white space before or after the name
        self.newSiteName(name); //update

        //make sure not blank
        if(self.newSiteName().length){
            self.controller.createCustomer(name,"test@test.com");
        }
    }

    function Customer(controller){
        var self = this;
        self.controller = controller;
        self.version = ko.observable("1.3.0");
        self.name = ko.observable("UCLA");
        self.email=ko.observable("user@user.com")
        self.update = ko.observable("N/A");
        self.prevDownload = ko.observable("N/A");
        self.id = ko.observable("0");

        self.removeFromController = function(){
            self.controller.customers.remove(self);
        }

        self.delete = function(){
            self.controller.deleteCustomer(self);
        }

        self.asDict = function(){
            var customerDict = {};
            customerDict.version = self.version();
            customerDict.name = self.name();
            customerDict.email = self.email();
            customerDict.update = self.update();
            customerDict.prevDownload = self.prevDownload();
            customerDict.id = self.id();

            return customerDict;
        }
    }


    function Controller(sites){
        var self = this;
        self.sites = sites;
        self.customers = ko.observableArray([]);

        self.getCustomers = function(){
            //make request to db for customer data then update Customer objects
            Main.getApiCall('/customers', {}, gotCustomers)

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
                    var customer = new Customer(self);
                    customer.name(customers[i].name);
                    customer.version(customers[i].version);
                    customer.email(customers[i].email);
                    customer.update(customers[i].update);
                    customer.prevDownload(customers[i].prevDownload);
                    customer.id(customers[i]["_id"]["$oid"]);
                    self.customers.push(customer);


                }
            }
            else{
                console.log("Customer data not received");
            }
        }

       self.createCustomer = function(){
            var data = {};
            data.name = self.sites.newSiteName();
            data.email = self.sites.newSiteEmail();
            data.version = self.sites.newSiteVersion();
            var url = '/customers';
            Main.postApiCall(url, data, createdCustomer);
       }

       self.deleteCustomer = function(customer){
        console.log("delete Customer called");
        var data = {};
        var customerID = customer.id();
        var url = "/customer/" + customerID;
        Main.deleteApiCall(url, data, deletedCustomer);

       }

       function deletedCustomer(response){
        var customer = response.customer;
        if(customer && customer.error){
            console.log("error deleting customer");
        }
        else if (customer){
            console.log("deleted customer");
            var customerID = customer.customer_id;
            var customer = searchCustomerById(customerID);
            customer.removeFromController();

        }

       }

       function searchCustomerById(customerID){
            //look through customers till find one with matching id
            console.log("search for customer with id " + customerID);
            for(var i in self.customers()){
                if(self.customers()[i].id() == customerID){
                    return self.customers()[i];
                }
            }
            return undefined;
       }

       self.getCustomer = function(customerID){

       }

       function createdCustomer(response){
            var customer = response.customers;
            if(customer.error){
                console.log("error creating customer");
                return;
            }

            if(customer){
                 var newCustomer = new Customer(self);
                console.log("created customer");
                newCustomer.name(customer.name);
                newCustomer.email(customer.email);
                newCustomer.version(customer.version);
                newCustomer.id(customer["_id"]["$oid"])
                self.customers.push(newCustomer);
            }
       }
    }

};


