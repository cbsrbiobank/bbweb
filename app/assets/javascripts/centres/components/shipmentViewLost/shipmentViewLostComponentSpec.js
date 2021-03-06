/**
 * Jasmine test suite
 *
 */
/* global angular */

import { ShippingComponentTestSuiteMixin } from 'test/mixins/ShippingComponentTestSuiteMixin';
import ngModule from '../../index'

describe('shipmentViewLostComponent', function() {

  beforeEach(() => {
    angular.mock.module(ngModule, 'biobank.test');
    angular.mock.inject(function() {
      Object.assign(this, ShippingComponentTestSuiteMixin);

      this.injectDependencies('$q',
                              '$rootScope',
                              '$compile',
                              '$state',
                              'modalService',
                              'Shipment',
                              'notificationsService',
                              'Factory');

      this.createController = (shipment) =>
        this.createControllerInternal(
          '<shipment-view-lost shipment="vm.shipment"></shipment-view-lost>',
          { shipment: shipment },
          'shipmentViewLost');
    });
  });

  it('has valid scope', function() {
    var shipment = this.createShipment();
    this.createController(shipment);
    expect(this.controller.shipment).toBe(shipment);
  });

  it('user can return shipment to sent state', function() {
    spyOn(this.modalService, 'modalOkCancel').and.returnValue(this.$q.when('OK'));
    spyOn(this.Shipment.prototype, 'send').and.returnValue(this.$q.when(this.shipment));
    spyOn(this.$state, 'go').and.returnValue(null);

    this.shipment = this.createShipment();
    this.createController(this.shipment);
    this.controller.returnToSentState();
    this.scope.$digest();
    expect(this.$state.go).toHaveBeenCalledWith('home.shipping.shipment',
                                                { shipmentId: this.shipment.id },
                                                { reload: true });
  });

});
