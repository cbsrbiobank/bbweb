/**
 * Jasmine test suite
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2016 Canadian BioSample Repository (CBSR)
 */
/* global angular */

import _ from 'lodash';
import sharedSpec from '../../../../../test/annotationTypeViewComponentSharedSpec';

describe('Component: collectionEventAnnotationTypeView', function() {

  beforeEach(() => {
    angular.mock.module('biobankApp', 'biobank.test');
    angular.mock.inject(function(ComponentTestSuiteMixin) {
      _.extend(this, ComponentTestSuiteMixin.prototype);

      this.injectDependencies('$q',
                              '$rootScope',
                              '$compile',
                              'notificationsService',
                              'Study',
                              'CollectionEventType',
                              'AnnotationType',
                              'factory');

      this.createController = (study, collectionEventType, annotationType) => {
        this.CollectionEventType.get =
          jasmine.createSpy().and.returnValue(this.$q.when(collectionEventType));

        ComponentTestSuiteMixin.prototype.createController.call(
          this,
          `<collection-event-annotation-type-view
             study="vm.study"
             collection-event-type="vm.collectionEventType"
             annotation-type="vm.annotationType"
           </collection-event-annotation-type-view>`,
          {
            study:               study,
            collectionEventType: collectionEventType,
            annotationType:      annotationType
          },
          'collectionEventAnnotationTypeView');
      };

      this.createEntities = () => {
        var jsonAnnotType       = this.factory.annotationType(),
            jsonStudy           = this.factory.study(),
            jsonCet             = this.factory.collectionEventType(jsonStudy),
            study               = this.Study.create(jsonStudy),
            collectionEventType = this.CollectionEventType.create(
              _.extend({}, jsonCet, { annotationTypes: [ jsonAnnotType] })),
            annotationType      = new this.AnnotationType(jsonAnnotType);

        return {
          study:               study,
          collectionEventType: collectionEventType,
          annotationType:      annotationType
        };
      };
    });
  });

  it('should have  valid scope', function() {
    var entities = this.createEntities();

    this.createController(entities.study,
                          entities.collectionEventType,
                          entities.annotationType);
    expect(this.controller.study).toBe(entities.study);
    expect(this.controller.collectionEventType).toBe(entities.collectionEventType);
    expect(this.controller.annotationType).toBe(entities.annotationType);
  });

  describe('shared behaviour', function () {
    var context = {};

    beforeEach(function () {
      var entities = this.createEntities();

      context.entity                       = this.CollectionEventType;
      context.updateAnnotationTypeFuncName = 'updateAnnotationType';
      context.parentObject                 = entities.collectionEventType;
      context.annotationType               = entities.annotationType;
      context.createController             = () => {
        this.createController(entities.study,
                              entities.collectionEventType,
                              entities.annotationType);
      };
    });

    sharedSpec(context);

  });

});