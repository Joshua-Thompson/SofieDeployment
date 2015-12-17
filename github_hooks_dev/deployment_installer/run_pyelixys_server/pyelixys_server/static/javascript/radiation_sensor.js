function RadiationSensor(sensorId, monitor){
    var self = this;
    self.sensorId = sensorId;
    self.monitor = monitor;

    self.radiationLevel = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var radSensors = self.monitor.state.radiationSensors();
            if( radSensors.length > self.sensorId ){
                return radSensors[self.sensorId].value;
            }
        }
        return 0;
    });
}