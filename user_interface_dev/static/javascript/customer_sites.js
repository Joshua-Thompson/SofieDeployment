//Model for displaying customer data
var CustomerSites = function() {

    self.customers = ko.observableArray([]);

    self.getCustomers = function(){
        //testing
        self.customers.push(new Customer());
    }

    self.getCustomers();

    function Customer(){
        var self = this;
        self.version = ko.observable("1.3.0");
        self.name = ko.observable("UCLA");
        self.update = ko.observable("N/A");
        self.prevDownload = ko.observable("N/A");
    }
};


