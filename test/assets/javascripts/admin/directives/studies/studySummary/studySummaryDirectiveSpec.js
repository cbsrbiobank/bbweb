/**
 * Jasmine test suite
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2015 Canadian BioSample Repository (CBSR)
 */
define(function (require) {
  'use strict';

  var angular                = require('angular'),
      mocks                  = require('angularMocks'),
      _                      = require('underscore'),
      entityUpdateSharedSpec = require('../../../../test/entityUpdateSharedSpec');

  describe('Controller: StudySummaryTabCtrl', function() {

    beforeEach(mocks.module('biobankApp', 'biobank.test'));

    beforeEach(inject(function($rootScope, $compile, directiveTestSuite, testUtils) {
      var self = this;

      _.extend(self, directiveTestSuite);

      self.$q                   = self.$injector.get('$q');
      self.$state               = self.$injector.get('$state');
      self.Study                = self.$injector.get('Study');
      self.modalService         = self.$injector.get('modalService');
      self.notificationsService = self.$injector.get('notificationsService');
      self.jsonEntities         = self.$injector.get('jsonEntities');

      spyOn(self.modalService, 'showModal').and.returnValue(self.$q.when(true));

      self.study = new self.Study(self.jsonEntities.study());
      self.createController = createController;

      this.putHtmlTemplates(
        '/assets/javascripts/admin/directives/studies/studySummary/studySummary.html',
        '/assets/javascripts/common/directives/truncateToggle.html',
        '/assets/javascripts/admin/directives/statusLine/statusLine.html',
        '/assets/javascripts/common/modalInput/modalInput.html');

      function createController() {
        self.element = angular.element('<study-summary study="vm.study"></study-summary>');
        self.scope = $rootScope.$new();
        self.scope.vm = { study: self.study };

        $compile(self.element)(self.scope);
        self.scope.$digest();
        self.controller = self.element.controller('studySummary');
      }
    }));

    it('should contain valid settings to display the study summary', function() {
      this.createController();
      expect(this.controller.study).toBe(this.study);
      expect(this.controller.descriptionToggleLength).toBeDefined();
    });

    describe('updates to name', function () {

      var context = {};

      beforeEach(inject(function () {
        context.entity               = this.Study;
        context.updateFuncName       = 'updateName';
        context.controllerFuncName   = 'editName';
        context.modalInputFuncName = 'text';
      }));

      entityUpdateSharedSpec(context);

    });

    describe('updates to description', function () {

      var context = {};

      beforeEach(inject(function () {
        context.entity               = this.Study;
        context.updateFuncName       = 'updateDescription';
        context.controllerFuncName   = 'editDescription';
        context.modalInputFuncName = 'textArea';
      }));

      entityUpdateSharedSpec(context);

    });

    describe('enabling a study', function() {
      var context = {};

      beforeEach(inject(function () {
        context.status = 'enable';
      }));

      sharedStudyStatusBehaviour(context);
    });

    describe('disabling a study', function() {
      var context = {};

      beforeEach(inject(function () {
        context.status = 'disable';
      }));

      sharedStudyStatusBehaviour(context);
    });

    describe('retiring a study', function() {
      var context = {};

      beforeEach(inject(function () {
        context.status = 'retire';
      }));

      sharedStudyStatusBehaviour(context);
    });

    describe('unretiring a study', function() {
      var context = {};

      beforeEach(inject(function () {
        context.status = 'unretire';
      }));

      sharedStudyStatusBehaviour(context);
    });


    function sharedStudyStatusBehaviour(context) {

      describe('(shared) study status', function () {

        it('change status', function () {
          spyOn(this.Study, 'get').and.returnValue(this.$q.when(this.study));
          spyOn(this.Study.prototype, context.status).and.returnValue(this.$q.when(this.study));

          this.createController();
          this.controller.changeStatus(context.status);
          this.scope.$digest();
          expect(this.Study.prototype[context.status]).toHaveBeenCalled();
        });

      });
    }

    it('should throw error for when trying to change to an invalid status', function () {
      var self = this,
          badStatus = 'xxx';

      this.createController();
      expect(function () {
        self.controller.changeStatus(badStatus);
      }).toThrow(new Error('invalid status: ' + badStatus));
    });
  });

});