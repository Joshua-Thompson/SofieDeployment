function CalibrateCassettes(reagentRobot, cassettes){
    var self = this;
    self.cassettes = cassettes;
    self.reagentRobot = reagentRobot;
    self.selectedCassetteIndex = ko.observable(0);

    self.selectedCassette = ko.pureComputed(function(){
        if( self.selectedCassetteIndex() >= 0 && self.selectedCassetteIndex() < self.cassettes.length )
            return self.cassettes[parseInt(self.selectedCassetteIndex())];
        return null;
    });

    self.reagentToCal = ko.pureComputed(function(){
        var cassette = self.selectedCassette();
        if( cassette ){
            return cassette.selectedReagent();
        }
    });

    self.isCalibrating = ko.observable(false);

    for(var i=0; i < self.cassettes.length; i++){
        var cassette = self.cassettes[i];
        function moveToReagentOnSelect(cassette){
            cassette.selectedReagent.subscribeChanged(function(newVal, oldVal){
                self.deselectOtherCassettes();
                if( !self.isCalibrating() ){
                    if( !cassette.selectedReagent().isOperation ){
                        self.reagentRobot.moveToReagent(cassette.selectedReagent());
                    }
                    else{
                        self.moveToOperationPosition(cassette.selectedReagent().position, cassette.selectedReagent().cassetteId);
                    }
                }
            });
        }
        moveToReagentOnSelect(cassette);
    }

    self.deselectOtherCassettes = function(){
        for(var j=0; j < self.cassettes.length; j++){
            var cas = self.cassettes[j];
            if( cas != self.selectedCassette() )
                cas.selectedReagentIndex(-1);
        }
    }

    self.doCalibrate = function(){
        self.isCalibrating(true);
    }

    self.isCalibrating.subscribe(function(newVal){
        if( newVal ){
            self.reagentXSubscription = self.reagentRobot.x.subscribe(function(newVal){
                if(self.reagentToCal()){
                    self.reagentToCal().x(newVal);
                }
            });
            self.reagentYSubscription = self.reagentRobot.y.subscribe(function(newVal){
                if(self.reagentToCal()){
                    self.reagentToCal().y(newVal);
                }
            });
        }
        else{
            self.reagentXSubscription.dispose();
            self.reagentYSubscription.dispose();
        }
    });

    self.moveToOperationPosition = function(positionName, reactor){
        self.reagentRobot.moveToOperation(positionName, reactor);
    }

    self.save = function(){
        if( self.isCalibrating() ){
            var cal = {};
            cal.name = "reagent_robot";
            cal.select_type = "save";
            var reagent = self.reagentToCal();

            if( reagent ){
                cal.parameters = {reactor: reagent.cassetteId, position: reagent.position,
                                  x: reagent.x(), y: reagent.y()};
                self.calibrate(cal, function(res){
                    reagent.isCalibrated(true);
                });
            }
        }
    }

    self.stopCalibrate = function(){
        self.isCalibrating(false);
        for(var i=0; i < self.cassettes.length; i++){
            self.cassettes[i].getReagentPositions();
        }
		for(var i=0; i < self.cassettes.length; i++){
            var cassette = self.cassettes[i];
            for(var j=0; j < cassette.reagents.length; j++){
                cassette.reagents[j].isCalibrated(false);
            }
        }
    }

    self.calibrate = function(cal_parameters, calibrateResponseFn) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, calibrateResponseFn);
    }
}