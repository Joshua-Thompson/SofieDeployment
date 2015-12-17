function Cassette(cassetteId){
    var self = this;

    self.displaySPECartridge = ko.observable(true);
    self.displayReagentNames = ko.observable(true);
    self.selectedReagent = ko.observable();
    self.selectedReagentIndex = ko.observable();

    self.cassetteId = cassetteId;
    self.reagents = [];
    self.reagentPositions = [];

    for(var i = 0; i < 12; i++){
        self.reagents.push(new CassetteReagent("", i, self.cassetteId));
    }
    self.reagents.push(new CassetteReagent("", "evaporate", self.cassetteId));
    self.reagents.push(new CassetteReagent("", "elute", self.cassetteId));
    self.reagents.push(new CassetteReagent("", "add0", self.cassetteId));
    self.reagents.push(new CassetteReagent("", "add1", self.cassetteId));
    self.reagents.push(new CassetteReagent("", "transfer", self.cassetteId));

    self.getReagentPositions = function(){
        for(var i=0; i < self.reagents.length; i++){
            self.reagents[i].getPositionFromConfig();
        }
    }

    self.selectReagent = function(reagentPos){
        var reg = self.reagents[reagentPos];
        self.selectedReagentIndex(reagentPos);
        self.selectedReagent(reg);
    }

    function CassetteReagent(name, reagentId, cassetteId){
        var self = this;
        self.reagentId = reagentId;
        self.name = name;
        self.isCalibrated = ko.observable(false);


        if( !isNaN(self.reagentId ) ){
            self.position = "reagent" + self.reagentId;
            self.isOperation = false;
        }
        else{
            self.position = self.reagentId;
            self.isOperation = true;
        }

        self.cassetteId = cassetteId;
        self.description = ko.observable("");
        self.name = ko.observable(name);

        self.getPositionFromConfig = function(){
            $.get("/hardware_config?keys=ReagentRobot,Positions,Reactor" + self.cassetteId + "," + self.position, function(res){
                res = JSON.parse(res);
                self.x(res[0]);
                self.y(res[1]);
            });
        }
        self.x = ko.observable(0);
        self.y = ko.observable(0);
        self.getPositionFromConfig();
    }
}