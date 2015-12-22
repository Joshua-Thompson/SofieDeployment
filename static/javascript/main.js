var Main = function ($, window) {
  //'use strict';
   var self = this;
   var doApiCall = function (request, data, success, error) {
        return $.ajax({
          url: request,
          dataType: 'json',
          contentType: "application/json; charset=utf-8",
          type: 'POST',
          data: JSON.stringify(data),
          success: success,
          error: error
        });
      };

    function init(){
        var customerSites = new CustomerSites();
        ko.applyBindings(customerSites);
        window.customerSites = customerSites;
    }

  return {
    init: init,
    doApiCall: doApiCall
  };
}(jQuery, window);
