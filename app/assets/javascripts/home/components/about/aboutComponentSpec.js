/**
 * Jasmine test suite
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2018 Canadian BioSample Repository (CBSR)
 */
/* global angular */

import { ComponentTestSuiteMixin } from 'test/mixins/ComponentTestSuiteMixin';
import ngModule from '../../index'

describe('Component: about', function() {

  beforeEach(() => {
    angular.mock.module(ngModule, 'biobank.test');
    angular.mock.inject(function () {
      Object.assign(this, ComponentTestSuiteMixin);
      this.injectDependencies();
      this.createController = () =>
        this.createControllerInternal(
          '<about></about>',
          undefined,
          'about');
    });
  });

  it('has valid scope', function() {
    this.createController();
    expect(this.controller).toBeDefined();
    expect(this.controller.breadcrumbs).toBeDefined();
  });
});
