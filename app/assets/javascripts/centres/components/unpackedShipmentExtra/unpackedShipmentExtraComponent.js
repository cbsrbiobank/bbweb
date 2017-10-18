/**
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2016 Canadian BioSample Repository (CBSR)
 */

import _ from 'lodash'

var component = {
  template: require('./unpackedShipmentExtra.html'),
  controller: UnpackedShipmentExtraController,
  controllerAs: 'vm',
  bindings: {
    shipment: '<'
  }
};

/*
 * Controller for this component.
 */
/* @ngInject */
function UnpackedShipmentExtraController($q,
                                         $controller,
                                         $scope,
                                         ShipmentSpecimen,
                                         ShipmentItemState,
                                         modalService,
                                         domainNotificationService,
                                         notificationsService,
                                         gettextCatalog) {
  var vm = this;
  vm.$onInit = onInit;

  //----

  function onInit() {
    $controller('UnpackBaseController', { vm:             vm,
                                          modalService:   modalService,
                                          gettextCatalog: gettextCatalog });
    vm.refreshTable = 0;

    vm.actions =  [
      {
        id:    'tag-as-extra',
        class: 'btn-warning',
        title: gettextCatalog.getString('Remove'),
        icon:  'glyphicon-remove'
      }
    ];

    vm.getExtraSpecimens    = getExtraSpecimens;
    vm.onInventoryIdsSubmit = onInventoryIdsSubmit;
    vm.tableActionSelected  = tableActionSelected;

    $scope.$emit('tabbed-page-update', 'tab-selected');
  }

  function getExtraSpecimens(options) {
    if (!vm.shipment) { return $q.when({ items: [], maxPages: 0 }); }

    options = options || {};
    _.extend(options, { filter: 'state:in:' + ShipmentItemState.EXTRA });

    return ShipmentSpecimen.list(vm.shipment.id, options)
      .then(function (paginatedResult) {
        return { items: paginatedResult.items, maxPages: paginatedResult.maxPages };
      });
  }

  /*
   * User entered inventory IDs entered to be marked as extra in this shipment.
   */
  function onInventoryIdsSubmit() {
    var inventoryIds = vm.inventoryIds.split(',').map((nonTrimmedInventoryId) => nonTrimmedInventoryId.trim());
    return vm.tagSpecimensAsExtra(inventoryIds);
  }

  /*
   * User wishes to remove this shipment specimen from this shipment.
   */
  function tableActionSelected(shipmentSpecimen) {
    domainNotificationService.removeEntity(
      promiseFn,
      gettextCatalog.getString('Remove extra specimen'),
      gettextCatalog.getString(
        'Are you sure you want to remove specimen with inventory ID <strong>{{id}}</strong> ' +
          'as an <i>Extra</i> specimen from this shipment?',
        { id: shipmentSpecimen.specimen.inventoryId }),
      gettextCatalog.getString('Remove failed'),
      gettextCatalog.getString(
        'Specimen with ID {{id}} cannot be removed',
        { id: shipmentSpecimen.specimen.inventoryId }));

    function promiseFn() {
      return shipmentSpecimen.remove()
        .then(function () {
          vm.refreshTable += 1;
          notificationsService.success(gettextCatalog.getString('Specimen returnted to unpacked'));
        });
    }
  }

}

export default ngModule => ngModule.component('unpackedShipmentExtra', component)
