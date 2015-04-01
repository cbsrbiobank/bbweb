/**
 * Jasmine test suite
 */
define([
  'angular',
  'angularMocks',
  'underscore',
  './studyAnnotationTypeSharedSpec',
  'biobankApp'
], function(angular, mocks, _, studyAnnotationTypeSharedSpec) {
  'use strict';

  describe('ParticipantAnnotationType', function() {

    var context = {}, ParticipantAnnotationType, fakeEntities;
    var requiredKeys = ['id', 'studyId', 'name', 'valueType', 'options', 'required'];

    beforeEach(mocks.module('biobankApp', 'biobank.test'));

    beforeEach(inject(function(_ParticipantAnnotationType_,
                               fakeDomainEntities) {

      ParticipantAnnotationType = _ParticipantAnnotationType_;
      fakeEntities = fakeDomainEntities;

      context.annotationTypeType            = ParticipantAnnotationType;
      context.createAnnotTypeFn        = createAnnotType;
      context.annotationTypeUriPart         = '/pannottypes';
      context.objRequiredKeys          = requiredKeys;
      context.createServerAnnotTypeFn  = createServerAnnotType;
      context.annotationTypeListFn          = ParticipantAnnotationType.list;
      context.annotationTypeGetFn           = ParticipantAnnotationType.get;
    }));

    function createServerAnnotType(options) {
      var study = fakeEntities.study();
      options = _.extend({ required: true }, options);
      return fakeEntities.studyAnnotationType(study, options);
    }

    function createAnnotType(obj) {
      obj = obj || {};
      return new ParticipantAnnotationType(obj);
    }

    studyAnnotationTypeSharedSpec(context);

  });


});
