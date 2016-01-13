var Main = function ($, window) {
  //'use strict';
   var self = this;
   var getApiCall = function (request, data, success, error) {
        return $.ajax({
          url: request,
          dataType: 'json',
          type: 'GET',
          data: data,
          success: success
        });
      };

   var postApiCall = function (request, data, success, error) {
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

   var putApiCall = function (request, data, success) {
        return $.ajax({
          url: request,
          dataType: 'json',
          contentType: "application/json; charset=utf-8",
          type: 'PUT',
          data: JSON.stringify(data),
          success: success,
        });
      };

   var deleteApiCall = function (request, data, success, error) {
        return $.ajax({
          url: request,
          dataType: 'json',
          contentType: "application/json; charset=utf-8",
          type: 'DELETE',
          data: data,
          success: success,
          error: error
        });
      };

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
    doApiCall: doApiCall,
    getApiCall: getApiCall,
    postApiCall: postApiCall,
    putApiCall: putApiCall,
    deleteApiCall: deleteApiCall
  };
}(jQuery, window);
