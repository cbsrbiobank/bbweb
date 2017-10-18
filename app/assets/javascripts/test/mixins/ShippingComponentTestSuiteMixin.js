/**
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2016 Canadian BioSample Repository (CBSR)
 */

/* @ngInject */
export default function ShippingComponentTestSuiteMixinFactory($q,
                                                               ComponentTestSuiteMixin,
                                                               Shipment,
                                                               ShipmentSpecimen,
                                                               Factory) {


  return Object.assign(
    {
      createShipment,
      createShipmentWithSpecimens,
      createGetShipmentSpy,
      createShipmentSpecimensListSpy
    },
    ComponentTestSuiteMixin);

  function createShipment(state) {
    var options = {};
    if (state) {
      options.state = state;
    }
    return new Shipment(Factory.shipment(options));
  }

  function createShipmentWithSpecimens(specimenCount) {
    return new Shipment(Factory.shipment({ specimenCount: specimenCount }));
  }

  function createGetShipmentSpy(shipment) {
    spyOn(Shipment, 'get').and.returnValue($q.when(shipment));
  }

  function createShipmentSpecimensListSpy(shipmentSpecimens) {
    var reply = Factory.pagedResult(shipmentSpecimens);
    spyOn(ShipmentSpecimen, 'list').and.returnValue($q.when(reply));
  }

}