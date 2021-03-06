/**
 * Jasmine test suite
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2018 Canadian BioSample Repository (CBSR)
 */
/* global angular */

import { EntityTestSuiteMixin } from 'test/mixins/EntityTestSuiteMixin';
import { ServerReplyMixin } from 'test/mixins/ServerReplyMixin';
import ngModule from '../../index'
import sharedBehaviour from 'test/behaviours/entityNameAndStateSharedBehaviour';

describe('CentreName', function() {

  beforeEach(() => {
    angular.mock.module(ngModule, 'biobank.test');
    angular.mock.inject(function() {
      Object.assign(this, EntityTestSuiteMixin, ServerReplyMixin);

      this.injectDependencies('$httpBackend',
                              '$httpParamSerializer',
                              'EntityNameAndState',
                              'CentreName',
                              'CentreState',
                              'Factory');
      this.url = (...paths) => {
        const args = [ 'centres/names' ].concat(paths);
        return EntityTestSuiteMixin.url.apply(null, args);
      };
    });
  });

  afterEach(function() {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  describe('common behaviour', function() {

    var context = {};

    beforeEach(function() {
      context.constructor = this.CentreName;
      context.createFunc  = this.CentreName.create;
      context.restApiUrl  = this.url();
      context.factoryFunc = () => this.Factory.centreNameDto();
      context.listFunc    = this.CentreName.list;
    });

    sharedBehaviour(context);

  });

  it('state predicates return valid results', function() {
    Object.values(this.CentreState).forEach((state) => {
      var entityName = this.CentreName.create(this.Factory.centreNameDto({ state: state }));
      expect(entityName.isDisabled()).toBe(state === this.CentreState.DISABLED);
      expect(entityName.isEnabled()).toBe(state === this.CentreState.ENABLED);
    });
  });

});
