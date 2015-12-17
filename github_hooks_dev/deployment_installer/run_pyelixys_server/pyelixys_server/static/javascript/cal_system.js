function System() {
  'use strict';
  var self = this;
  // inherits Common.
  Common.apply(self, arguments);
  
  self.selectedSystemTemplate = ko.observable('videocalibrate-template');

  self.name = 'SYSTEM';
  self.visible = ko.computed(function() {
    return self.currentPage() === self.name;
  });
  self.monitor = new ElixysMonitor();
  self.reactors = [];
  self.coolantPump = new CoolantPump(1, self.monitor);
  self.vacuumPump = new VacuumPump(self.monitor);
  self.hplc = new HPLC(self.monitor);
  self.inertGasValve = new InertGasValve(self.monitor, "inert");
  self.activeGasValve = new ActiveGasValve(self.monitor, "active");
  self.ctrlMode = ko.observable("");
  self.cameras = [];
  self.mixers = [];
  self.heaters = [];
  self.pressureRegulators = [];
  self.stopcocks = [];
  self.cassettes = [];

  self.pressureRegulators.push(new PressureRegulator("Inert Pressure", 0, self.monitor));
  self.pressureRegulators.push(new PressureRegulator("Pneumatic Pressure", 1, self.monitor));
  self.radiationSensors = [];
  for(var i = 0; i < 7; i++){
    var radSensor = new RadiationSensor(i, self.monitor);
    self.radiationSensors.push(radSensor);
  }
  var numReactors = 3;
  for( var r = 0; r < numReactors; r++ ){
    var reactor = new Reactor(r, self.monitor, true)
    var cam = reactor.camera;
    var mixer = reactor.mixer;
    self.reactors.push(reactor);
    self.cameras.push(cam);
    self.mixers.push(mixer);
    self.heaters = self.heaters.concat(reactor.heaters);
    self.stopcocks = self.stopcocks.concat(reactor.stopcocks);
  }
  var numCassettes = 3;
  for( var c = 0; c < numCassettes; c++){
    var cassette = new Cassette(c);
    cassette.displaySPECartridge(false);
    self.cassettes.push(cassette);
  }
  self.reagentRobot = new ReagentRobot(self.monitor, self.cassettes);

  self.cameraCalibrations = new CalibrateCameras(self.cameras);
  self.liquidSensorCalibration = new CalibrateLiquidSensor(self.monitor);
  self.mixerCalibrations = new CalibrateMixers(self.mixers);
  self.pressureRegulatorCalibrations = new PressureRegulatorsCalibrations(self.pressureRegulators);
  self.reactorCalibrations = new ReactorCalibrations(self.reactors,self.pressureRegulators[1]);
  self.cassetteCalibrations = new CalibrateCassettes(self.reagentRobot, self.cassettes);
  self.reagentRobotCalibrations = new ReactorCalibrations(self.reagentRobot);

  self.stateMonitorInterval = undefined;

  self.postRender = function() {
    if(self.currentPage() === self.name){
      self.stateMonitorInterval = window.setInterval(pollStateMonitor, 1000);
    }
  }

  function pollStateMonitor() {
    if(self.currentPage()!==self.name){window.clearInterval(self.stateMonitorInterval);}
    return self.monitor.requestState();
  }
  
  self.toggleSidebar = function() {
	Elixys.viewModels.sidebarNavigation.toggleSidebar();  
  }

}
