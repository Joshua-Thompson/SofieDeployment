/**
 * Common view model that's used as a base for other view models.
 */
function Common() {
  'use strict';

  var self = this;

  self.isLoggedIn = ko.observable(false).syncWith('isLoggedIn');

  self.isSidebarVisible = ko.observable(false).syncWith('isSideBarVisible');

  self.currentPage = ko.observable().syncWith('currentPage');

  self.filterDateStart = ko.observable('').syncWith('filterDateStart');

  self.filterDateEnd = ko.observable('').syncWith('filterDateEnd');

  self.filterName = ko.observable('').syncWith('filterName');

  self.currentSequence = ko.observable({details: {}}).syncWith('currentSequence');

  self.currentComponents = ko.observable({}).syncWith('currentComponents');

  self.updateAvailable = ko.observable({}).syncWith('updateAvailable');

  self.videoUrl = [camera0_ip, camera1_ip, camera2_ip];

  self.elixysIP = ko.observable(elixys_ip).syncWith('elixysIP');

  self.liquidSensorNumber = ko.observable(liquid_sensor_number).syncWith('liquidSensorNumber');

  self.camera0_position = ko.observable(camera0_position).syncWith('camera0_position');

  self.camera1_position = ko.observable(camera1_position).syncWith('camera1_position');

  self.camera2_position = ko.observable(camera2_position).syncWith('camera2_position');

  self.cameras_disabled = ko.observable(false).syncWith('cameras_disabled');
  self.cameras_enabled = ko.observable(false).syncWith('cameras_enabled');

  self.elixysVersion = ko.observable(elixys_version).syncWith('elixysVersion');



}
