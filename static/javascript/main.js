var Main = function () {
  //'use strict';
   var self = this;
    function init(){
        var customerSites = new CustomerSites();
        ko.applyBindings(customerSites);
    }

  return {
    init: init
  };
}();
