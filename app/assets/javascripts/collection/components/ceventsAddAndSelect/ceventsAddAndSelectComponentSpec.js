/**
 * Jasmine test suite
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2016 Canadian BioSample Repository (CBSR)
 */
/* global angular */

import _ from 'lodash';
import ngModule from '../../index'

describe('Component: ceventsAddAndSelect', function() {

  beforeEach(() => {
    angular.mock.module(ngModule, 'biobank.test');
    angular.mock.inject(function(ComponentTestSuiteMixin) {
      _.extend(this, ComponentTestSuiteMixin);

      this.injectDependencies('$q',
                              '$rootScope',
                              '$compile',
                              '$state',
                              'Participant',
                              'CollectionEvent',
                              'CollectionEventType',
                              'Factory');

      this.jsonCevent      = this.Factory.collectionEvent();
      this.jsonParticipant = this.Factory.defaultParticipant();
      this.jsonCeventType  = this.Factory.defaultCollectionEventType();

      this.participant          = this.Participant.create(this.jsonParticipant);
      this.collectionEvent      = this.CollectionEvent.create(this.jsonCevent);
      this.collectionEventTypes = [ this.CollectionEventType.create(this.jsonCeventType) ];

      this.createController = (participant, collectionEventTypes, collectionEvent) => {
        var replyItems;

        participant = participant || this.participant;
        collectionEventTypes = collectionEventTypes || this.collectionEventTypes;
        collectionEvent = collectionEvent || this.collectionEvent;

        if (_.isUndefined(collectionEvent)) {
          replyItems = [];
        } else {
          replyItems = [ collectionEvent ];
        }

        this.CollectionEvent.list =
          jasmine.createSpy().and.returnValue(this.$q.when(this.Factory.pagedResult(replyItems)));

        ComponentTestSuiteMixin.createController.call(
          this,
          `<cevents-add-and-select
             participant="vm.participant"
             collection-event-types="vm.collectionEventTypes">
           </cevents-add-and-select>`,
          {
            participant:          participant,
            collectionEventTypes: collectionEventTypes
          },
          'ceventsAddAndSelect');
      };
    });
  });

  it('has valid scope', function() {
    this.createController();
    expect(this.controller.participant).toBe(this.participant);
    expect(this.controller.collectionEventTypes).toBe(this.collectionEventTypes);

    expect(this.controller.pageChanged).toBeFunction();
    expect(this.controller.add).toBeFunction();
    expect(this.controller.eventInformation).toBeFunction();
    expect(this.controller.displayState).toBe(this.controller.displayStates.HAVE_RESULTS);
  });

  describe('creating controller', function () {

    it('throws an exception when collection event does not match any collection event types', function() {
      this.collectionEvent.collectionEventTypeId = this.Factory.stringNext();
      this.createController(this.participant, [ this.Factory.collectionEventType()]);
      expect(this.controller.collectionEventError).toBeTrue();
    });

  });

  it('has valid display state when there are no collection events', function() {
    this.collectionEvent = undefined;
    this.createController(this.participant, this.collectionEventTypes, undefined);
    expect(this.controller.displayState).toBe(this.controller.displayStates.NONE_ADDED);
  });

  it('has valid display state when there are collection events', function() {
    this.createController();
    expect(this.controller.displayState).toBe(this.controller.displayStates.HAVE_RESULTS);
  });

  it('when pageChanged is called the state is changed', function() {
    spyOn(this.$state, 'go').and.returnValue('ok');
    this.createController();
    this.controller.pageChanged();
    this.scope.$digest();
    expect(this.$state.go).toHaveBeenCalledWith('home.collection.study.participant.cevents');
  });

  describe('when add is called, the state is changed', function () {

    it('to correct state when there is only a single collection event type defined', function() {
      expect(this.collectionEventTypes).toBeArrayOfSize(1);

      spyOn(this.$state, 'go').and.returnValue('ok');
      spyOn(this.CollectionEvent, 'list').and.returnValue(this.$q.when(this.pagedResult));

      this.createController();
      this.controller.add();
      this.scope.$digest();
      expect(this.$state.go).toHaveBeenCalledWith('home.collection.study.participant.cevents.add.details',
                                                  { eventTypeId: this.collectionEventTypes[0].id });
    });

    it('to correct state when there is more than one collection event type defined', function() {
      var self = this;

      self.collectionEventTypes = _.range(2).map(() => {
        var jsonCeventType  = self.Factory.defaultCollectionEventType();
        return new self.CollectionEventType(jsonCeventType);
      });

      spyOn(self.$state, 'go').and.returnValue('ok');
      self.createController();
      self.controller.add();
      self.scope.$digest();
      expect(self.$state.go).toHaveBeenCalledWith('home.collection.study.participant.cevents.add');
    });

  });

  it('when eventInformation is called the state is changed', function() {
    spyOn(this.$state, 'go').and.returnValue('ok');

    this.createController();
    this.controller.eventInformation(this.collectionEvent);
    this.scope.$digest();
    expect(this.$state.go).toHaveBeenCalledWith(
      'home.collection.study.participant.cevents.details', {
        eventTypeId: this.collectionEvent.collectionEventTypeId,
        eventId:     this.collectionEvent.id
      });
  });

  describe('for updating visit number filter', function() {

    it('filter is updated when user enters a value', function() {
      var visitNumber = '20';
      this.createController();

      this.CollectionEvent.list =
        jasmine.createSpy().and.returnValue(this.$q.when(this.Factory.pagedResult([])));

      this.controller.visitNumberFilter = visitNumber;
      this.controller.visitFilterUpdated();
      this.scope.$digest();

      expect(this.controller.pagerOptions.filter).toEqual('visitNumber::' + visitNumber);
      expect(this.controller.pagerOptions.page).toEqual(1);
      expect(this.controller.displayState).toBe(this.controller.displayStates.NO_RESULTS);
    });

    it('filter is updated when user clears the value', function() {
      this.createController();
      this.controller.visitNumberFilter = '';
      this.controller.visitFilterUpdated();
      this.scope.$digest();

      expect(this.controller.pagerOptions.filter).toBeEmptyString();
      expect(this.controller.pagerOptions.page).toEqual(1);
    });

  });

});
