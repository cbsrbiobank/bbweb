/**
 * Jasmine test suite
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2016 Canadian BioSample Repository (CBSR)
 */
define(function (require) {
  'use strict';

  var angular                = require('angular'),
      mocks                  = require('angularMocks'),
      _                      = require('underscore'),
      entityUpdateSharedSpec = require('../../../../../test/entityUpdateSharedSpec');

  describe('ceventTypeViewDirective', function() {

    beforeEach(mocks.module('biobankApp', 'biobank.test'));

    beforeEach(inject(function($rootScope, $compile, testUtils, directiveTestSuite) {
      var self = this;

      _.extend(self, directiveTestSuite);

      self.$q                     = self.$injector.get('$q');
      self.$state                 = self.$injector.get('$state');
      self.Study                  = self.$injector.get('Study');
      self.CollectionEventType    = self.$injector.get('CollectionEventType');
      self.CollectionSpecimenSpec = self.$injector.get('CollectionSpecimenSpec');
      self.AnnotationType         = self.$injector.get('AnnotationType');
      self.notificationsService   = self.$injector.get('notificationsService');
      self.domainEntityService    = self.$injector.get('domainEntityService');
      self.jsonEntities           = self.$injector.get('jsonEntities');

      self.jsonStudy              = this.jsonEntities.study();
      self.jsonCet                = self.jsonEntities.collectionEventType(self.jsonStudy);
      self.study                  = new self.Study(self.jsonStudy);
      self.collectionEventType    = new self.CollectionEventType(self.jsonCet);

      spyOn(this.$state, 'go').and.returnValue(true);

      self.createController = createController;

      this.putHtmlTemplates(
        '/assets/javascripts/admin/directives/studies/collection/ceventTypeView/ceventTypeView.html',
        '/assets/javascripts/common/directives/truncateToggle.html',
        '/assets/javascripts/admin/directives/annotationTypeSummary/annotationTypeSummary.html',
        '/assets/javascripts/admin/directives/studies/collection/collectionSpecimenSpecSummary/collectionSpecimenSpecSummary.html',
        '/assets/javascripts/common/directives/updateRemoveButtons.html',
        '/assets/javascripts/admin/directives/statusLine/statusLine.html',
        '/assets/javascripts/common/modalInput/modalInput.html');

      function createController() {
        self.element = angular.element(
          '<cevent-type-view study="vm.study" cevent-type="vm.ceventType"></cevent-type-view>');

        self.scope = $rootScope.$new();
        self.scope.vm = {
          study: self.study,
          ceventType: self.collectionEventType
        };
        $compile(self.element)(self.scope);
        self.scope.$digest();
        self.controller = self.element.controller('ceventTypeView');
      }

    }));

    it('scope should be valid', function() {
      this.createController();
      expect(this.controller.ceventType).toBe(this.collectionEventType);
    });

    it('calling addAnnotationType should change to the correct state', function() {
      this.createController();
      this.controller.addAnnotationType();
      this.scope.$digest();
      expect(this.$state.go)
        .toHaveBeenCalledWith('home.admin.studies.study.collection.ceventType.annotationTypeAdd');
    });

    it('calling addSpecimenSpec should change to the correct state', function() {
      this.createController();
      this.controller.addSpecimenSpec();
      this.scope.$digest();
      expect(this.$state.go)
        .toHaveBeenCalledWith('home.admin.studies.study.collection.ceventType.specimenSpecAdd');
    });

    it('calling editAnnotationType should change to the correct state', function() {
      var annotType = new this.AnnotationType(this.jsonEntities.annotationType());

      this.createController();
      this.controller.editAnnotationType(annotType);
      this.scope.$digest();
      expect(this.$state.go).toHaveBeenCalledWith(
        'home.admin.studies.study.collection.ceventType.annotationTypeView',
        { annotationTypeId: annotType.uniqueId });
    });

    describe('updates to name', function () {

      var context = {};

      beforeEach(inject(function () {
        context.entity             = this.CollectionEventType;
        context.updateFuncName     = 'updateName';
        context.controllerFuncName = 'editName';
        context.modalInputFuncName = 'text';
        context.newValue           = this.jsonEntities.stringNext();
      }));

      entityUpdateSharedSpec(context);

    });

    describe('updates to description', function () {

      var context = {};

      beforeEach(inject(function () {
        context.entity             = this.CollectionEventType;
        context.updateFuncName     = 'updateDescription';
        context.controllerFuncName = 'editDescription';
        context.modalInputFuncName = 'textArea';
        context.newValue           = this.jsonEntities.stringNext();
      }));

      entityUpdateSharedSpec(context);

    });

    describe('updates to recurring', function () {

      var context = {};

      beforeEach(inject(function () {
        context.entity               = this.CollectionEventType;
        context.updateFuncName       = 'updateRecurring';
        context.controllerFuncName   = 'editRecurring';
        context.modalInputFuncName = 'boolean';
        context.newValue             = false;
      }));

      entityUpdateSharedSpec(context);

    });

    it('editing a specimen spec changes to correct state', function() {
      var specimenSpec = new this.CollectionSpecimenSpec(this.jsonEntities.collectionSpecimenSpec());

      this.createController();
      this.controller.editSpecimenSpec(specimenSpec);
      this.scope.$digest();
      expect(this.$state.go).toHaveBeenCalledWith(
        'home.admin.studies.study.collection.ceventType.specimenSpecView',
        { specimenSpecId: specimenSpec.uniqueId });
    });

    describe('removing a specimen spec', function() {

      it('can be removed when in valid state', function() {
        var modalService = this.$injector.get('modalService'),
            jsonSpecimenSpec = this.jsonEntities.collectionSpecimenSpec(),
            jsonCeventType = new this.jsonEntities.collectionEventType({ specimenSpecs: [ jsonSpecimenSpec ]}),
            ceventType = new this.CollectionEventType(jsonCeventType);

        spyOn(modalService, 'showModal').and.returnValue(this.$q.when('OK'));
        spyOn(this.domainEntityService, 'removeEntity').and.callThrough();
        spyOn(this.CollectionEventType.prototype, 'removeSpecimenSpec')
          .and.returnValue(this.$q.when(ceventType));

        this.createController();
        this.controller.modificationsAllowed = true;
        this.controller.removeSpecimenSpec(ceventType.specimenSpecs[0]);
        this.scope.$digest();

        expect(this.domainEntityService.removeEntity).toHaveBeenCalled();
        expect(this.CollectionEventType.prototype.removeSpecimenSpec).toHaveBeenCalled();
      });

      it('throws an error if modifications are not allowed', function() {
        var self = this,
            specimenSpec = new self.CollectionSpecimenSpec(self.jsonEntities.collectionSpecimenSpec());

        spyOn(self.domainEntityService, 'removeEntity').and.returnValue(self.$q.when('OK'));

        self.createController();
        self.controller.modificationsAllowed = false;

        expect(function () {
          self.controller.removeSpecimenSpec(specimenSpec);
        }).toThrowError('modifications not allowed');
      });

    });

    describe('removing an annotation type', function() {

      it('can be removed when in valid state', function() {
        var modalService = this.$injector.get('modalService'),
            jsonAnnotType = this.jsonEntities.annotationType(),
            jsonCeventType = new this.jsonEntities.collectionEventType({ annotationTypes: [ jsonAnnotType ]}),
            ceventType = new this.CollectionEventType(jsonCeventType);

        spyOn(modalService, 'showModal').and.returnValue(this.$q.when('OK'));
        spyOn(this.CollectionEventType.prototype, 'removeAnnotationType')
          .and.returnValue(this.$q.when(ceventType));

        this.createController();
        this.controller.annotationTypeIdsInUse = [];
        this.controller.removeAnnotationType(ceventType.annotationTypes[0]);
        this.scope.$digest();

        expect(modalService.showModal).toHaveBeenCalled();
        expect(this.CollectionEventType.prototype.removeAnnotationType).toHaveBeenCalled();
      });

      it('throws an error if modifications are not allowed', function() {
        var annotationType = new this.AnnotationType(this.jsonEntities.annotationType()),
            studyAnnotationTypeUtils = this.$injector.get('studyAnnotationTypeUtils');

        spyOn(studyAnnotationTypeUtils, 'removeInUseModal').and.returnValue(this.$q.when('OK'));
        spyOn(this.CollectionEventType.prototype, 'removeAnnotationType').and.callThrough();

        this.createController();
        this.controller.annotationTypeIdsInUse = [ annotationType.uniqueId ];
        this.controller.removeAnnotationType(annotationType);

        expect(studyAnnotationTypeUtils.removeInUseModal).toHaveBeenCalled();
        expect(this.CollectionEventType.prototype.removeAnnotationType).not.toHaveBeenCalled();
      });

      it('throws an error if modifications are not allowed', function() {
        var self = this,
            annotationType = new this.AnnotationType(this.jsonEntities.annotationType());

        spyOn(self.domainEntityService, 'removeEntity').and.returnValue(self.$q.when('OK'));

        self.createController();
        self.controller.modificationsAllowed = false;

        expect(function () {
          self.controller.removeAnnotationType(annotationType);
        }).toThrowError('modifications not allowed');
      });

    });

    it('updates state when panel button is clicked', function() {
      var panelState;

      this.createController();
      panelState = this.controller.isPanelCollapsed;
      this.controller.panelButtonClicked();
      this.scope.$digest();

      expect(this.controller.isPanelCollapsed).not.toEqual(panelState);
    });

  });

});