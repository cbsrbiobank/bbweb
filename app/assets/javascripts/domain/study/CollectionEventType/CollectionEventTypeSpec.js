/**
 * Jasmine test suite
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2015 Canadian BioSample Repository (CBSR)
 */
/* global angular */

import _ from 'lodash';

describe('CollectionEventType', function() {

  var CollectionEventType;

  beforeEach(() => {
    angular.mock.module('biobankApp', 'biobank.test');
    angular.mock.inject(function(EntityTestSuite, ServerReplyMixin, testDomainEntities) {
      _.extend(this, EntityTestSuite.prototype, ServerReplyMixin.prototype, testDomainEntities.prototype);

      this.injectDependencies('$rootScope',
                              '$httpBackend',
                              'Study',
                              'CollectionEventType',
                              'factory',
                              'testUtils');

      this.jsonCet   = this.factory.collectionEventType();
      this.jsonStudy = this.factory.defaultStudy();

      this.testUtils.addCustomMatchers();
      testDomainEntities.extend();
      CollectionEventType = this.CollectionEventType;

      // used by promise tests
      this.expectCet = (entity) => {
        expect(entity).toEqual(jasmine.any(CollectionEventType));
      };

      // used by promise tests
      this.failTest = (error) => {
        expect(error).toBeUndefined();
      };
      /*
       * Returns 3 collection event types, each one with a different missing field.
       */
      this.getBadCollectionEventTypes = () => {
        var badSpecimenDescription   = _.omit(this.factory.collectionSpecimenDescription(), 'name'),
            badAnnotationType = _.omit(this.factory.annotationType(), 'name'),
            data = [
              {
                cet: _.omit(this.factory.collectionEventType(), 'name'),
                errMsg : 'Missing required property'
              },
              {
                cet: this.factory.collectionEventType({ specimenDescriptions: [ badSpecimenDescription ]}),
                errMsg : 'specimenDescriptions.*Missing required property'
              },
              {
                cet: this.factory.collectionEventType({ annotationTypes: [ badAnnotationType ]}),
                errMsg : 'annotationTypes.*Missing required property'
              }
            ];
        return data;
      };

      this.url = url;

      //---

      function url() {
        const args = [ 'studies/cetypes' ].concat(_.toArray(arguments));
        return EntityTestSuite.prototype.url.apply(null, args);
      }
    });
  });

  afterEach(function() {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  it('constructor with no parameters has default values', function() {
    var ceventType = new this.CollectionEventType();

    expect(ceventType.isNew()).toBe(true);
    expect(ceventType.studyId).toBe(null);
    expect(ceventType.name).toBe('');
    expect(ceventType.recurring).toBe(false);
    expect(ceventType.specimenDescriptions).toBeArrayOfSize(0);
    expect(ceventType.annotationTypes).toBeArrayOfSize(0);
  });

  it('fails when creating from an invalid json object', function() {
    var badJsonCet = _.omit(this.factory.collectionEventType(this.jsonStudy), 'name');
    expect(() => {
      CollectionEventType.create(badJsonCet);
    }).toThrowError(/invalid collection event type from server/);
  });

  it('fails when creating from a bad json specimen spec', function() {
    var jsonSpec = _.omit(this.factory.collectionSpecimenDescription(), 'name'),
        badJsonCet = _.extend(this.factory.collectionEventType(this.jsonStudy),
                              { specimenDescriptions: [ jsonSpec ] });

    expect(() => {
      CollectionEventType.create(badJsonCet);
    }).toThrowError(/specimenDescriptions.*Missing required property/);
  });

  it('fails when creating from bad json annotation type data', function() {
    var jsonAnnotType = _.omit(this.factory.annotationType(), 'name'),
        badJsonCet = _.extend(this.factory.collectionEventType(this.jsonStudy),
                              { annotationTypes: [ jsonAnnotType ] });

    expect(() => { CollectionEventType.create(badJsonCet); })
      .toThrowError(/annotationTypes.*Missing required property/);
  });

  it('has valid values when creating from server response', function() {
    var jsonCet = this.factory.collectionEventType(this.jsonStudy),
        ceventType = CollectionEventType.create(jsonCet);
    ceventType.compareToJsonEntity(jsonCet);
  });

  it('can retrieve a collection event type', function() {
    var url = this.url(this.jsonStudy.id, this.jsonCet.id);

    this.$httpBackend.whenGET(url).respond(this.reply(this.jsonCet));
    CollectionEventType.get(this.jsonStudy.id, this.jsonCet.id)
      .then(this.expectCet).catch(this.failTest);
    this.$httpBackend.flush();
  });

  it('fails when getting a collection event type and it has a bad format', function() {
    var data = this.getBadCollectionEventTypes();

    data.forEach((badCet) => {
      var url = this.url(this.jsonStudy.id, badCet.cet.id);

      this.$httpBackend.whenGET(url).respond(this.reply(badCet.cet));
      CollectionEventType.get(this.jsonStudy.id, badCet.cet.id)
        .then(getFail).catch(shouldFail);
      this.$httpBackend.flush();

      function shouldFail(error) {
        expect(error.message).toMatch(badCet.errMsg);
      }
    });

    function getFail() {
      fail('function should not be called');
    }
  });

  it('can list collection event types', function() {
    var url = this.url(this.jsonStudy.id),
        reply = this.factory.pagedResult([ this.jsonCet ]);

    this.$httpBackend.whenGET(url).respond(this.reply(reply));
    CollectionEventType.list(this.jsonStudy.id)
      .then(expectPagedResult)
      .catch(this.failTest);
    this.$httpBackend.flush();

    function expectPagedResult(pagedResult) {
      expect(pagedResult.items).toBeArrayOfSize(1);
      expect(pagedResult.items[0]).toEqual(jasmine.any(CollectionEventType));
    }
  });

  it('fails when listing collection event types and they have a bad format', function() {
    // assigns result of this.$httpBackend.whenGET() to variable so that the response
    // can be changed inside the loop
    var data = this.getBadCollectionEventTypes(),
        url = this.url(this.jsonStudy.id),
        reqHandler = this.$httpBackend.whenGET(url);

    data.forEach((item) => {
      reqHandler.respond(this.reply(this.factory.pagedResult([ item.cet ])));
      CollectionEventType.list(this.jsonStudy.id).then(getFail).catch(shouldFail);
      this.$httpBackend.flush();

      function getFail() {
        fail('function should not be called');
      }

      function shouldFail(error) {
        expect(error).toMatch(item.errMsg);
      }
    });
  });

  it('isNew should be true for a collection event type with no ID', function() {
    var cet = new CollectionEventType(_.omit(this.jsonCet, 'id'));
    expect(cet.isNew()).toBe(true);
  });

  it('isNew should be false for a collection event type that has an ID', function() {
    var cet = new CollectionEventType(this.jsonCet);
    expect(cet.isNew()).toBe(false);
  });

  it('can add a collection event type', function() {
    var study = this.Study.create(this.jsonStudy),
        ceventType = new CollectionEventType(this.jsonCet, { study: study }),
        url = this.url(this.jsonStudy.id);

    this.$httpBackend.expectPOST(url).respond(this.reply(this.jsonCet));

    ceventType.add().then(this.expectCet).catch(this.failTest);
    this.$httpBackend.flush();
  });

  it('should remove a collection event type', function() {
    var study = this.Study.create(this.jsonStudy),
        ceventType = new CollectionEventType(this.jsonCet, { study: study }),
        url = this.url(this.jsonStudy.id, ceventType.id, ceventType.version);

    this.$httpBackend.expectDELETE(url).respond(this.reply(true));
    ceventType.remove();
    this.$httpBackend.flush();
  });

  it('should update name', function () {
    var cet = new this.CollectionEventType(this.jsonCet);
    this.updateEntity.call(this,
                           cet,
                           'updateName',
                           cet.name,
                           this.url('name', cet.id),
                           { name: cet.name, studyId: cet.studyId },
                           this.jsonCet,
                           this.expectCet,
                           this.failTest);
  });

  it('should update description', function () {
    var cet = new this.CollectionEventType(this.jsonCet);

    this.updateEntity.call(this,
                           cet,
                           'updateDescription',
                           undefined,
                           this.url('description', cet.id),
                           { studyId: cet.studyId },
                           this.jsonCet,
                           this.expectCet,
                           this.failTest);

    this.updateEntity.call(this,
                           cet,
                           'updateDescription',
                           cet.description,
                           this.url('description', cet.id),
                           { description: cet.description, studyId: cet.studyId },
                           this.jsonCet,
                           this.expectCet,
                           this.failTest);
  });

  it('should update recurring', function () {
    var cet = new this.CollectionEventType(this.jsonCet);
    this.updateEntity.call(this,
                           cet,
                           'updateRecurring',
                           cet.recurring,
                           this.url('recurring', cet.id),
                           { recurring: cet.recurring, studyId: cet.studyId },
                           this.jsonCet,
                           this.expectCet,
                           this.failTest);
  });

  describe('for specimen specs', function() {

    beforeEach(function() {
      this.jsonSpec = this.factory.collectionSpecimenDescription();
      this.jsonCet  = this.factory.collectionEventType({ specimenDescriptions: [ this.jsonSpec ] });
      this.cet      = this.CollectionEventType.create(this.jsonCet);
    });

    it('should add a specimen description', function () {
      this.updateEntity.call(this,
                             this.cet,
                             'addSpecimenDescription',
                             _.omit(this.jsonSpec, 'id'),
                             this.url('spcdesc', this.cet.id),
                             _.extend(_.omit(this.jsonSpec, 'id'), { studyId: this.cet.studyId }),
                             this.jsonCet,
                             this.expectCet,
                             this.failTest);
    });

    it('should remove a specimen description', function () {
      var url = this.url('spcdesc', this.cet.studyId, this.cet.id, this.cet.version, this.jsonSpec.id);
      this.$httpBackend.whenDELETE(url).respond(this.reply(this.jsonCet));
      this.cet.removeSpecimenDescription(this.jsonSpec).then(this.expectCet).catch(this.failTest);
      this.$httpBackend.flush();
    });

    it('throws an error when attempting to remove an invalid specimen spec', function () {
      this.cet.specimenDescriptions = [];
      expect(() => {
        this.cet.removeSpecimenDescription(this.jsonSpec).then(this.expectCet).catch(this.failTest);
      }).toThrowError(/specimen description with ID not present/);
    });

  });

  describe('for annotation types', function() {

    beforeEach(function() {
      var study = this.Study.create(this.jsonStudy);

      this.jsonAnnotType = this.factory.annotationType();
      this.jsonCet       = this.factory.collectionEventType({ annotationTypes: [ this.jsonAnnotType ]});
      this.cet           = this.CollectionEventType.create(this.jsonCet, { study: study });
    });

    it('should add an annotation type', function () {
      this.updateEntity.call(this,
                             this.cet,
                             'addAnnotationType',
                             _.omit(this.jsonAnnotType, 'id'),
                             this.url('annottype', this.cet.id),
                             _.extend(_.omit(this.jsonAnnotType, 'id'),
                                      { studyId: this.cet.studyId }),
                             this.jsonCet,
                             this.expectCet,
                             this.failTest);
    });

    describe('removing an annotation type', function() {

      it('should remove an annotation type', function () {
        var url = this.url('annottype', this.cet.studyId, this.cet.id, this.cet.version, this.jsonAnnotType.id),
            cetCheck = (ceventType) => {
              expect(ceventType).toEqual(jasmine.any(this.CollectionEventType));
            };

        this.$httpBackend.whenDELETE(url).respond(this.reply(this.jsonCet));
        this.cet.removeAnnotationType(this.jsonAnnotType)
          .then(cetCheck)
          .catch(this.failTest);
        this.$httpBackend.flush();
      });

      it('fails when removing an invalid annotation type', function() {
        var jsonAnnotType = _.extend({}, this.jsonAnnotType, { id: this.factory.stringNext() });
        this.cet.removeAnnotationType(jsonAnnotType)
          .catch((err) => {
            expect(err.message).toContain('annotation type with ID not present:');
          });
        this.$rootScope.$digest();
      });

    });

  });

  it('inUse has valid URL and returns FALSE', function() {
    var cet     = new this.CollectionEventType(this.factory.collectionEventType());
    this.$httpBackend.whenGET(this.url('inuse', cet.id)).respond(this.reply(false));
    cet.inUse()
      .then((reply) => {
        expect(reply).toBe(false);
      })
      .catch(this.failTest);
    this.$httpBackend.flush();
  });

  it('inUse has valid URL and returns TRUE', function() {
    var cet     = new this.CollectionEventType(this.factory.collectionEventType());
    this.$httpBackend.whenGET(this.url('inuse', cet.id)).respond(this.reply(true));
    cet.inUse()
      .then((reply) => {
        expect(reply).toBe(true);
      })
      .catch(this.failTest);
    this.$httpBackend.flush();
  });

});