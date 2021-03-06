/*
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2018 Canadian BioSample Repository (CBSR)
 */
/* global angular */

import { EntityTestSuiteMixin } from 'test/mixins/EntityTestSuiteMixin';
import { ServerReplyMixin } from 'test/mixins/ServerReplyMixin';
import ngModule from '../../index'
import sharedBehaviour from 'test/behaviours/entityNameAndStateSharedBehaviour';

describe('StudyName', function() {

  beforeEach(() => {
    angular.mock.module(ngModule, 'biobank.test');
    angular.mock.inject(function() {
      Object.assign(this, EntityTestSuiteMixin, ServerReplyMixin);

      this.injectDependencies('$httpBackend',
                              '$httpParamSerializer',
                              'EntityNameAndState',
                              'StudyName',
                              'StudyState',
                              'Factory');

      //this.addCustomMatchers();
      this.jsonStudyName = this.Factory.studyNameDto();

      // used by promise tests
      this.expectStudy = (entity) => {
        expect(entity).toEqual(jasmine.any(this.StudyName));
      };

      this.url = (...paths) => {
        const allPaths = [ 'studies/names' ].concat(paths)
        return EntityTestSuiteMixin.url(...allPaths);
      }
    });
  });

  afterEach(function() {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  describe('common behaviour', function() {

    var context = {};

    beforeEach(function() {
      context.constructor = this.StudyName;
      context.createFunc  = this.StudyName.create;
      context.restApiUrl  = this.url();
      context.factoryFunc = this.Factory.studyNameDto.bind(this.Factory);
      context.listFunc    = this.StudyName.list;
    });

    sharedBehaviour(context);

  });

  it('state predicates return valid results', function() {
    Object.values(this.StudyState).forEach((state) => {
      var studyName = this.StudyName.create(this.Factory.studyNameDto({ state: state }));
      expect(studyName.isDisabled()).toBe(state === this.StudyState.DISABLED);
      expect(studyName.isEnabled()).toBe(state === this.StudyState.ENABLED);
      expect(studyName.isRetired()).toBe(state === this.StudyState.RETIRED);
    });
  });

});
