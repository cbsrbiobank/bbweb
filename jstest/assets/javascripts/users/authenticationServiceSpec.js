// Jasmine test suite
//
define(['angular', 'angularMocks', 'underscore', 'biobankApp'], function(angular, mocks, _) {
  'use strict';

  describe('Service: authorizationService', function() {

    var $rootScope, $q, biobankXhrReqService, authorization, usersService, resolved;
    var fakeToken = 'fake-token';
    var user = {
      id:           'dummy-id',
      version:      1,
      timeAdded:    '2014-10-20T09:58:43-0600',
      name:         'testuser',
      email:        'testuser@test.com',
      avatarUrl:    'http://www.avatarsdb.com/avatars/duck_walking.gif',
      status:       'Active'
    };

    var failTest = function(error) {
      expect(error).toBeUndefined();
    };

    beforeEach(mocks.module('biobankApp'));

    beforeEach(inject(function (_$rootScope_,
                                _$q_,
                                _biobankXhrReqService_,
                                _usersService_,
                                _authorization_) {
      $rootScope = _$rootScope_;
      $q = _$q_;
      biobankXhrReqService = _biobankXhrReqService_;
      usersService = _usersService_;
      authorization = _authorization_;
      resolved = false;

    }));

    describe('requireAuthenticatedUser', function () {

      it('requests the user from the server', function (done) {
        spyOn(biobankXhrReqService, 'call').and.callFake(function () {
          var deferred = $q.defer();
          deferred.resolve(user);
          return deferred.promise;
        });

        expect(usersService.isAuthenticated()).toBe(false);
        authorization.requireAuthenticatedUser()
          .then(function (data) {
            resolved = true;
            expect(usersService.isAuthenticated()).toBe(true);
            expect(usersService.getCurrentUser()).toBe(user);
          })
          .catch(failTest)
            .finally(done);

        $rootScope.$digest();
        expect(resolved).toBe(true);
      });

      it('user is not authorized', function (done) {
        spyOn(biobankXhrReqService, 'call').and.callFake(function () {
          var deferred = $q.defer();
          deferred.reject();
          return deferred.promise;
        });

        expect(usersService.isAuthenticated()).toBe(false);
        authorization.requireAuthenticatedUser()
          .then(function (data) {
            resolved = true;
            expect(usersService.isAuthenticated()).toBe(false);
            expect(usersService.getCurrentUser()).toBe(null);
          })
          .catch(failTest)
            .finally(done);

        $rootScope.$digest();
        expect(resolved).toBe(true);
      });

    });

    describe('requireAdminUser', function () {

      it('requests the user from the server', function (done) {
        spyOn(biobankXhrReqService, 'call').and.callFake(function () {
          var deferred = $q.defer();
          deferred.resolve(user);
          return deferred.promise;
        });

        expect(usersService.isAuthenticated()).toBe(false);
        authorization.requireAdminUser()
          .then(function (data) {
            resolved = true;
            expect(usersService.isAdmin()).toBe(true);
            expect(usersService.getCurrentUser()).toBe(user);
          })
          .catch(failTest)
            .finally(done);

        $rootScope.$digest();
        expect(resolved).toBe(true);
      });

      it('user is not authorized', function (done) {
        spyOn(biobankXhrReqService, 'call').and.callFake(function () {
          var deferred = $q.defer();
          deferred.reject();
          return deferred.promise;
        });

        expect(usersService.isAuthenticated()).toBe(false);
        authorization.requireAdminUser()
          .then(function (data) {
            resolved = true;
            expect(usersService.isAuthenticated()).toBe(false);
            expect(usersService.getCurrentUser()).toBe(null);
          })
          .catch(failTest)
            .finally(done);

        $rootScope.$digest();
        expect(resolved).toBe(true);
      });

    });

  });

});