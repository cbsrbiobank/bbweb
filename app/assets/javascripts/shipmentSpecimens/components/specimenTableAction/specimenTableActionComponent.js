/**
 *
 */
define(function () {
  'use strict';

  var component = {
    templateUrl : '/assets/javascripts/shipmentSpecimens/components/specimenTableAction/specimenTableAction.html',
    controller: SpecimenTableActionDirective,
    controllerAs: 'vm',
    bindings: {
      action:            '=',
      onActionSelected:  '&'
    }
  };

  //SpecimenTableActionDirective.$inject = [];

  /*
   * Controller for this component.
   */
  function SpecimenTableActionDirective() {

  }

  return component;
});