/**
 * Jasmine test suite
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2018 Canadian BioSample Repository (CBSR)
 */
/* global angular */

import { ComponentTestSuiteMixin } from 'test/mixins/ComponentTestSuiteMixin';
import ngModule from '../../index'

describe('Component: login', function() {

  beforeEach(() => {
    angular.mock.module(ngModule, 'biobank.test');
    angular.mock.inject(function() {
      Object.assign(this, ComponentTestSuiteMixin);

      this.injectDependencies('$rootScope',
                              '$compile',
                              '$q',
                              '$state',
                              'userService',
                              'modalService');

      this.createController = () => {
        this.createControllerInternal(
          '<login></login>',
          undefined,
          'login');
      };
    });
  });

  it('has valid state', function() {
    this.createController();
    expect(this.controller.credentials.email).toBeEmptyString();
    expect(this.controller.credentials.password).toBeEmptyString();
    expect(this.controller.login).toBeFunction();
  });

  it('on initializaton, changes to home state if user is already logged in', function() {
    spyOn(this.userService, 'isAuthenticated').and.returnValue(true);
    spyOn(this.$state, 'go').and.returnValue(true);

    this.createController();
    this.scope.$digest();
    expect(this.$state.go).toHaveBeenCalledWith('home');
  });

  it('changes to home state on login attempt', function () {
    spyOn(this.userService, 'login').and.returnValue(this.$q.when(true));
    spyOn(this.$state, 'go').and.returnValue(true);

    this.createController();
    this.controller.login({ email: 'test@test.com', password: 'secret-password' });
    this.scope.$digest();

    expect(this.$state.go).toHaveBeenCalledWith('home');
  });

  describe('for badly formatted login error message', function() {

    var context = {};

    beforeEach(function() {
      context.loginError = {};
    });

    invalidLoginAttemptShared(context);

  });

  describe('for invalid login attempt invalid password or email', function() {

    var context = {};

    beforeEach(function() {
      context.loginError = { data: { message: 'invalid email or password'} };
    });

    invalidLoginAttemptShared(context);

  });

  describe('user not active login attempt', function() {

    var context = {};

    beforeEach(function() {
      context.loginError = { data: { message: 'the user is not active'} };
    });

    invalidLoginAttemptShared(context);

  });

  describe('user is locked login attempt', function() {

    var context = {};

    beforeEach(function() {
      context.loginError = { data: { message: 'the user is locked'} };
    });

    invalidLoginAttemptShared(context);

  });

  describe('other error message with data.message field', function() {

    var context = {};

    beforeEach(function() {
      context.loginError = { data: { message: 'xxxx'} };
    });

    invalidLoginAttemptShared(context);

  });

  function invalidLoginAttemptShared(context) {

    describe('for invalid login attempt', function() {

      beforeEach(function() {
        spyOn(this.$state, 'go').and.returnValue(true);
      });

      it('for invalid email or password and OK', function () {
        this.createController();
        spyOn(this.userService, 'login').and.returnValue(this.$q.reject(context.loginError));
        spyOn(this.modalService, 'modalOk').and.returnValue(this.$q.when('OK'));
        this.controller.login({ email: 'test@test.com', password: 'secret-password' });
        this.scope.$digest();

        expect(this.modalService.modalOk).toHaveBeenCalled();
        expect(this.$state.go).toHaveBeenCalledWith('home.users.login', {}, { reload: true });
      });

      it('for invalid email or password and cancel pressed', function () {
        this.createController();
        spyOn(this.userService, 'login').and.returnValue(this.$q.reject(context.loginError));
        spyOn(this.modalService, 'modalOk').and.returnValue(this.$q.reject('Cancel'));
        this.controller.login({ email: 'test@test.com', password: 'secret-password' });
        this.scope.$digest();
        expect(this.modalService.modalOk).toHaveBeenCalled();
        expect(this.$state.go).toHaveBeenCalledWith('home');
      });

    });
  }

});
