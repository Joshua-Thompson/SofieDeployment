/*
 * Logs view model.
 */
function Logs() {
	'use strict';
	
	var self = this;


	var getLogs = function() {
    Elixys.sequence(function(fail) {
      return [
        function() {
          Elixys.showNotificationPopup("Loading...");
          return Elixys.doApiCall("/get_logs");
        },
        function(result) {
          if(result.error) {
            return fail(result.error);
          }
          var sequences = result["get_logs"];
          sequences.forEach(function(sequence) {
            sequence.displayDate = trimDate(sequence.date);
            sequence.displayTime = trimTime(sequence.time);
          });
          sequences.reverse();
          self.sequences(sequences);
          Elixys.hideNotificationPopup();
        }
      ];
    }).fail(function(error) {
      if(typeof error === "string") {
        Elixys.showNotificationPopup("Error: " + error, {
          showCloseButton: true
        });
      }
      else {
        Elixys.showNotificationPopup("There was an error retrieving the logs.", {
          showCloseButton: true
        });
      }
    });
	};
  
  function trimDate(date) {
    return date.substring(0,6) + date.substring(8);
  }
  
  function trimTime(time) {
    var hour = parseInt(time.substring(0,2));
    var minute = time.substring(3,5);
    var ampm;
    if( hour >= 12 ) {
      ampm = "pm";
    }
    else {
      ampm = "am";
    }
    if( hour > 12 ) {
      hour = hour - 12;
    }
    else if( hour === 0 ) {
      hour = 12;
    }
    return hour + ":" + minute + ampm;
  }
	
  // inherits Common.
  Common.apply(self, arguments);

  self.name = 'LOGS';
  self.sequences = ko.observableArray();
  self.logsToExport = [];
  self.downloadLogsEnabled = ko.observable(false);
  self.exportStatusInterval = undefined; //will be defined when generate export logs started
  self.exportComplete = ko.observable(true); //initially true
  self.percentExportComplete = ko.observable("");


  //disable download link -- see postRender for html element
  function removeDownloadLink(){
    self.downloadLogsEnabled(false);
    self.downloadLogsEnabled.valueHasMutated();
  }


  // Filters
  self.sequencesFiltered = ko.computed(function() {
    var filterStr = self.filterName();
    var filterDateStart = Date.parse(self.filterDateStart());
    var filterDateEnd = Date.parse(self.filterDateEnd());
    if ((filterStr != null && filterStr.length > 0) ||
        (!isNaN(filterDateStart) || !isNaN(filterDateEnd))) {
      filterStr = filterStr.toLowerCase();
      return ko.utils.arrayFilter(self.sequences(), function(seq) {
        return ((seq.details.name != null && seq.details.name.toLowerCase().indexOf(filterStr) != -1)
                || (seq.details.comment != null && seq.details.comment.toLowerCase().indexOf(filterStr) != -1))
          && (isNaN(filterDateStart) || (!isNaN(Date.parse(seq.date)) && filterDateStart <= Date.parse(seq.date)))
          && (isNaN(filterDateEnd) || (!isNaN(Date.parse(seq.date)) && filterDateEnd >= Date.parse(seq.date)));
      });
    }
    return self.sequences();
  });

  self.visible = ko.computed(function() {
    return self.currentPage() === self.name;
  });

  self.visible.subscribe(function() {
    if (self.visible()) {
      getLogs();
    }
    else{
      clearInterval(self.exportStatusInterval);
    }
  });

   //select to export all logs
   self.exportAllLogsEnabled = ko.observable(false);
   self.updateAllLogsExport = function(){
	    var new_en_state = !self.exportAllLogsEnabled();
	    self.exportAllLogsEnabled(new_en_state);
        var id = 0;
        if(new_en_state===true){
            var export_state = true;
            }
        else{
        var export_state = false;
        }
        for(var seq in self.sequences()){
	        id = self.sequences()[seq].sequenceid;
	        self.exportLogIds()[id] = export_state;

	        }
	     self.exportLogIds.valueHasMutated();
	};

  //poll export status to see when ready
  function pollExportStatus(){
  var result = Elixys.doApiCall("/get_export_logs_status",{get_export_logs_status:{}},
        function(result){
		            var export_status = result["get_export_logs_status"];
                    var error = export_status["error"];
                    var running = export_status["running"];
                    var message = export_status["message"];
                    var data_available = export_status["data_available"];
                    if(error===true){
                        self.exportComplete(true);
                        window.clearInterval(self.exportStatusInterval);
                        Elixys.showNotificationPopup(message, {showCloseButton: true});

                    }
                    else{
                        if(running===false){
                            if(data_available === true){
                            window.clearInterval(self.exportStatusInterval);
                            self.downloadLogsEnabled(true);
                            self.exportComplete(true);
                            }
                            else{
                                //export logs does not have anything for export or is not running
                                window.clearInterval(self.exportStatusInterval);
                                self.downloadLogsEnabled(false);
                                self.exportComplete(true);

                            }

                        }
                        else{
                          //show % complete
                          var percent = export_status["percent_complete"];
                          self.percentExportComplete(percent + "% Complete");
                          self.exportComplete(false);

                        }

                    }

		            });
  }

  //send export logs request
  self.generateExportLogs = function(){
    self.downloadLogsEnabled(false);
    self.logsToExport = []; //clear array
    var id = 0;
	    for(var seq in self.sequences()){
	        id = self.sequences()[seq].sequenceid;
	        if(self.exportLogIds()[id]===true){
	           self.logsToExport.push(id);
	        }
	    }
	 //send request with sequences to export
	 var result = Elixys.doApiCall('/export_logs', {export_logs: self.logsToExport},
          function(result){
          var export_status = result["export_logs"];

          if(export_status.error !== undefined){
            self.downloadLogsEnabled(false);
            Elixys.showNotificationPopup(export_status.error, {showCloseButton: true});

          }
          else{
            clearInterval(self.exportStatusInterval);
            self.exportStatusInterval = window.setInterval(pollExportStatus, 1000);
          }

          });
  }

  //select export individual logs
  self.exportLogIds = ko.observable({});
	self.updateLogsExport = function(id){
	    var id = id.sequenceid;
	    if(self.exportLogIds()[id]!==undefined){
	    self.exportLogIds()[id] = !self.exportLogIds()[id]; //toggle value
	    }
	    else{
	        self.exportLogIds()[id] = true;
	    }
	    self.exportLogIds.valueHasMutated();
	};


    //Warning -  exportLogIP is not used at the moment
	self.exportLogIp = ko.computed(function() {
	    var elixys_ip = self.elixysIP();
	    var export_address = elixys_ip + "/export_logs?";
	    var id = 0;
	    for(var seq in self.sequences()){
	        id = self.sequences()[seq].sequenceid;
	        if(self.exportLogIds()[id]===true){
	            export_address = export_address.concat(id+"="+1+"&"); //ex GET request: ipaddress/export_logs?123=1&304=1&...etc
	        }
	    }
	    export_address = export_address.slice(0,-1);
	    return export_address;

	});

	self.downloadLogIp = ko.computed(function() {
	    var download_export_address = "/download_export_logs";
	    return download_export_address;

	});

  self.exportSequence = function(sequenceid){
    window.location = "/export_sequence?sequenceid=" + sequenceid;
  }

  self.viewSequence = function(sequence) {
    return Elixys.doApiCall("/get_sequence_and_components", {
      get_sequence_and_components: {
        sequenceid: sequence.sequenceid
      }
    }, function(payload) {
      var result = payload["get_sequence_and_components"];
      if( result.error ) {
        console.log(result);
      }
      else {
        self.currentSequence(result["sequence"]);
        self.currentComponents(result["components"]);
        self.currentPage(Elixys.viewModels.editSequence.name);
      }
    }, function() {
      console.log('error');
    });
  };

  self.postRender = function() {
    $("#input-date-start").clearSearch();
    $("#input-date-end").clearSearch();
    $("#sequence-search-button").clearSearch();
    //download link - disappear after click
        self.downloadLink = window.document.getElementById("export-logs-download");
        self.downloadLink.onclick = removeDownloadLink;

    //see if logging was taking place (if user had to logout of GUI and then log back for ex)
    if(self.exportStatusInterval === undefined){
        self.exportStatusInterval = window.setInterval(pollExportStatus, 1000);
    }
  }

}
