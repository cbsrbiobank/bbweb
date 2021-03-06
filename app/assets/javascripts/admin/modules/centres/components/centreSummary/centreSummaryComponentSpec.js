/**
 * Jasmine test suite
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2018 Canadian BioSample Repository (CBSR)
 */
/* global angular */

import { ComponentTestSuiteMixin } from 'test/mixins/ComponentTestSuiteMixin';
import entityUpdateSharedBehaviour from 'test/behaviours/entityUpdateSharedBehaviour';
import ngModule from '../../index'

describe('Component: centreSummary', function() {

  beforeEach(() => {
    angular.mock.module(ngModule, 'biobank.test');
    angular.mock.inject(function() {
      Object.assign(this, ComponentTestSuiteMixin);

      this.injectDependencies('$rootScope',
                              '$compile',
                              '$q',
                              'Centre',
                              'CentreState',
                              'notificationsService',
                              'modalService',
                              'Factory');
      this.centre = new this.Centre(this.Factory.centre());
      this.createScope = () => {
        var scope = ComponentTestSuiteMixin.createScope.call(this, { centre: this.centre });
        this.eventRxFunc = jasmine.createSpy().and.returnValue(null);
        scope.$on('tabbed-page-update', this.eventRxFunc);
        return scope;
      };

      this.createController = (centre) =>
        this.createControllerInternal(
          '<centre-summary centre="vm.centre"></centre-summary>',
          { centre },
          'centreSummary');

      spyOn(this.modalService, 'modalOkCancel').and.returnValue(this.$q.when('ok'));
    });
  });

  it('initialization is valid', function() {
    this.createController();
    expect(this.scope.vm.centre).toBe(this.centre);
    expect(this.controller.descriptionToggleLength).toBeDefined();
    expect(this.eventRxFunc).toHaveBeenCalled();
  });

  describe('updates to name', function () {

    var context = {};

    beforeEach(function () {
      const centre = new this.Centre(this.Factory.centre());

      context.entity             = this.Centre;
      context.createController   = () => this.createController(centre);
      context.updateFuncName     = 'updateName';
      context.updateReturnValue  = centre;
      context.controllerFuncName = 'editName';
      context.modalInputFuncName = 'text';
    });

    entityUpdateSharedBehaviour(context);

  });

  describe('updates to description', function () {

    var context = {};

    beforeEach(function () {
      const centre = new this.Centre(this.Factory.centre());

      context.entity             = this.Centre;
      context.createController   = () => this.createController(centre);
      context.updateFuncName     = 'updateDescription';
      context.updateReturnValue  = centre;
      context.controllerFuncName = 'editDescription';
      context.modalInputFuncName = 'textArea';
    });

    entityUpdateSharedBehaviour(context);

  });

  describe('centre state ', function() {

    describe('enabling a centre', function() {
      var context = {};

      beforeEach(function () {
        const centre = new this.Centre(this.Factory.centre());

        context.createController = () => this.createController(centre);
        context.centre           = centre;
        context.state            = 'enable';
        context.entity           = this.Centre;
      });

      sharedCentreStateBehaviour(context);
    });

    describe('disabling a centre', function() {
      var context = {};

      beforeEach(function () {
        const centre = new this.Centre(this.Factory.centre({ state: this.CentreState.ENABLED }));

        context.createController   = () => this.createController(centre);
        context.centre           = centre;
        context.state            = 'disable';
        context.entity           = this.Centre;
      });

      sharedCentreStateBehaviour(context);
    });

    it('changing state to an invalid value causes an exception', function() {
      const invalidState = this.Factory.stringNext();
      this.createController();
      expect(
        () => { this.controller.changeState(invalidState); }
      ).toThrowError(/invalid state/);
    });

  });

  function sharedCentreStateBehaviour(context) {

    describe('(shared) study state', function () {

      it('change state', function () {
        spyOn(context.entity.prototype, context.state).and.returnValue(this.$q.when(context.centre));

        context.createController();
        this.controller.changeState(context.state);
        this.scope.$digest();
        expect(context.entity.prototype[context.state]).toHaveBeenCalled();
        expect(this.controller.centre).toBe(context.centre);
      });

    });
  }

});
