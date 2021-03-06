/**
 * Jasmine test suite
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2018 Canadian BioSample Repository (CBSR)
 */
/* global angular */

import ngModule from '../../index'

describe('AnnotationValueType', function() {

  beforeEach(() => {
    angular.mock.module(ngModule, 'biobank.test');
    angular.mock.inject(function (AnnotationValueType) {
      this.AnnotationValueType = AnnotationValueType;
    });
  });

  it('should have values', function () {
    expect(Object.keys(this.AnnotationValueType)).not.toBeEmptyArray();
  });

});
