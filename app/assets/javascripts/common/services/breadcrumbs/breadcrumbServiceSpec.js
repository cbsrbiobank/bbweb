/**
 * Jasmine test suite
 *
 */
/* global angular */

import { TestSuiteMixin } from 'test/mixins/TestSuiteMixin';
import ngModule from '../../index'

describe('breadcrumbService', function() {

  beforeEach(() => {
    angular.mock.module(ngModule, 'biobank.test')
    angular.mock.inject(function() {
      Object.assign(this, TestSuiteMixin)

      this.injectDependencies('breadcrumbService', 'Factory')
    })
  })

  describe('method forState', function() {

    it('should return valid information for each state', function() {
      const stateNames =  [
        'home',
        'home.about',
        'home.contact',
        'home.admin',
        'home.admin.studies',
        'home.admin.centres',
        'home.admin.access',
        'home.admin.access.users',
        'home.admin.access.roles',
        'home.admin.access.memberships',
        'home.collection',
        'home.shipping',
        'home.shipping.add',
        'home.collection.study.participantAdd',
        'home.admin.centres.add',
        'home.admin.studies.add',
        'home.admin.access.memberships.add'
      ]

      stateNames.forEach(stateName => {
        const breadcrumb = this.breadcrumbService.forState(stateName)
        expect(breadcrumb.route).toBe(stateName)
        expect(breadcrumb.displayNameFn).toBeFunction()
        expect(breadcrumb.displayNameFn()).toBeString()
      })

    })

    it('throws exception for invalid state name', function() {
      expect(() => {
        this.breadcrumbService.forState(this.Factory.stringNext())
      }).toThrowError(/display name function is undefined for state/)
    })

  })

  describe('method forStateWithFunc', function() {

    it('returns a valid breadcrumb object', function() {
      const stateName = this.Factory.stringNext(),
            displayFunc = angular.noop,
            breadcrumb = this.breadcrumbService.forStateWithFunc(stateName, displayFunc)
      expect(breadcrumb.route).toBe(stateName)
      expect(breadcrumb.displayNameFn).toBeFunction()
      expect(breadcrumb.displayNameFn).toBe(displayFunc)
    })

  })

})
