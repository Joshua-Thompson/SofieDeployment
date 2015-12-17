function ElixysMonitor(){
    var self = this;
    Common.apply(self, arguments);

    self.state = {
        hplc: ko.observableArray(),
        liquid_sensor: {
            value: displayRoundingDown(30.0, 1)
        },
        valves: ko.observableArray(),
        mixers: ko.observableArray(),
        heaters: ko.observableArray(),
        thermocouples: ko.observableArray(),
        vacuumPump: ko.observableArray(),
        smcInterface: ko.observableArray(),
        pressureRegulators: ko.observableArray(),
        coolantPump: ko.observableArray(),
        digitalInputs: ko.observableArray(),
        linearActuators: ko.observableArray(),
        radiationSensors: ko.observableArray()
    }

    function displayText(text){
        return withDisplayFn(function(value) {
          if( value !== undefined ) {
            return value;
          }
          else {
            return "status";
          }
        }, text);
    }

    function displayRoundingDown(start, sigFigs) {
        return withDisplayFn(function(value) {
          if( value !== undefined ) {
            return value.toFixed(sigFigs);
          }
          else {
            return -1;
          }
        }, start);
    }

    function withDisplayFn(f, start) {
        var value = ko.observable(start);
        function readVal() {
            return f(value());
        }
        function writeVal(newValue) {
            value(newValue);
        }
        return ko.computed({
          read: readVal,
          write: writeVal
        });
    }

    function displayBool(bool){
        return withDisplayFn(function(value) {
          if( value !== undefined ) {
            return value;
          }
          else {
            return false;
          }
        }, bool);
    }

    self.gotStateMonitor = function(result) {
        var status = result.Status;
        var sensor_number = self.liquidSensorNumber();
        self.state.liquid_sensor.value(status.LiquidSensors[sensor_number].value);
        var mixers = [];
        var heaters = [];
        var thermocouples = [];
        var pressureRegulators = [];
        var smcInterface = [];
        var valves = [];
        var digitalInputs = [];
        var linearActuators = [];
        var radiationSensors = [];
        for(var index in status.Valves){
            valves.push(status.Valves[index]);
        }
        for(var index in status.Mixers){
            mixers.push( status.Mixers[index] );
        }
        for(var index in status.Heaters){
            heaters.push( status.Heaters[index] );
        }
        for(var index in status.Thermocouples){
            thermocouples.push( status.Thermocouples[index] );
        }
        for(var index in status.PressureRegulators ){
            pressureRegulators.push(status.PressureRegulators[index]);
        }
        for(var index in status.SMCInterface ){
            smcInterface.push(status.SMCInterface[index]);
        }
        for(var index in status.DigitalInputs ){
            digitalInputs.push(status.DigitalInputs[index]);
        }
        for(var index in status.LinearActuators ){
            linearActuators.push(status.LinearActuators[index]);
        }
        for(var index in status.RadiationSensors){
            radiationSensors.push(status.RadiationSensors[index]);
        }
        self.state.mixers(mixers);
        self.state.heaters(heaters);
        self.state.thermocouples(thermocouples);
        self.state.vacuumPump(status.VacuumPump[0]);
        self.state.smcInterface(smcInterface);
        self.state.pressureRegulators(pressureRegulators);
        self.state.coolantPump(status.CoolantPump[0]);
        self.state.hplc(status.HplcValve[0]);
        self.state.valves(valves);
        self.state.digitalInputs(digitalInputs);
        self.state.linearActuators(linearActuators);
        self.state.radiationSensors(radiationSensors);
    }

    self.requestState = function(){
        return Elixys.sequence(function(fail) {
          return [
            function() {
              return Elixys.doApiCall("/get_state_monitor", {});
            },
            function(payload) {
              var result = payload["get_state_monitor"];
              if( result.error ) {
                return fail(result.error);
              }
              else {
                return result;
              }
            },
            self.gotStateMonitor
          ];
        });
    }
}

