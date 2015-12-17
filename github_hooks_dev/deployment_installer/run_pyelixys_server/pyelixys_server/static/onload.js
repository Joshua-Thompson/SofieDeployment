ko.bindingHandlers.truncatedText = {
    update: function (element, valueAccessor, allBindingsAccessor) {

        var originalText = ko.utils.unwrapObservable(valueAccessor());
            // 10 is a default maximum length
        var length = ko.utils.unwrapObservable(allBindingsAccessor().maxTextLength) || 20;
        if( originalText ){
          var truncatedText = originalText.length > length ? originalText.substring(0, length) + "..." : originalText;
        }
        else{
          var truncatedText = "";
        }
        ko.bindingHandlers.text.update(element, function() {
          return truncatedText;
        });
    }
}

ko.subscribable.fn.subscribeChanged = function(callback) {
    var previousValue;
    this.subscribe(function(_previousValue) {
        previousValue = _previousValue;
    }, undefined, 'beforeChange');
    this.subscribe(function(latestValue) {
        callback(latestValue, previousValue );
    });
};

ko.bindingHandlers.numericText = {
    update: function (element, valueAccessor, allBindingsAccessor) {
        var rawValue = parseFloat( ko.utils.unwrapObservable(valueAccessor()) );
        var sigDigits = ko.utils.unwrapObservable(allBindingsAccessor().sigDigits) || null;
        var retVal = rawValue;

        if( sigDigits != null ){
          retVal = rawValue.toFixed(2);
        }
        // updating text binding handler to show truncatedText
        ko.bindingHandlers.text.update(element, function() {
            return retVal;
        });
    }
}

$(document).ready(function () {
  Elixys.init();
});