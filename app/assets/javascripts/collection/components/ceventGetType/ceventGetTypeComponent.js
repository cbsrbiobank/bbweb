/**
 * AngularJS Component for {@link domain.participants.CollectionEvent CollectionEvents}.
 *
 * @namespace collection.components.ceventGetType
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2018 Canadian BioSample Repository (CBSR)
 */

/*
 * Controller for this component.
 */
/* @ngInject */
class CeventGetTypeController {
  constructor($state,
              CollectionEventTypeName,
              CollectionEvent,
              breadcrumbService,
              gettextCatalog) {
    'ngInject'
    Object.assign(this, {
      $state,
      CollectionEventTypeName,
      CollectionEvent,
      breadcrumbService,
      gettextCatalog
    })
  }

  $onInit() {
    this.title = this.gettextCatalog.getString('Participant {{id}}: Add collection event',
                                               { id: this.participant.uniqueId })
    this.CollectionEventTypeName.list(this.study.id).then((reply) => {
      this.collectionEventTypeNames = reply
    });

    this.breadcrumbs = [
      this.breadcrumbService.forState('home'),
      this.breadcrumbService.forState('home.collection'),
      this.breadcrumbService.forStateWithFunc('home.collection.study', () => this.study.name),
      this.breadcrumbService.forStateWithFunc(
        'home.collection.study.participant.cevents',
        () => this.gettextCatalog.getString('Participant {{uniqueId}}',
                                           { uniqueId: this.participant.uniqueId })),
      this.breadcrumbService.forStateWithFunc(
        'home.collection.study.participant.cevents.add',
        () => this.gettextCatalog.getString('Select event type'))
    ];
  }

  updateCollectionEventType() {
    this.$state.go('home.collection.study.participant.cevents.add.details',
                   { eventTypeSlug: this.eventTypeSlug })
  }
}

/**
 * An AngularJS component that lets the user select a {@link domain.studies.CollectionEventType
 * CollectionEventType} belonging to a {@link domain.studies.Study Study}.
 *
 * @memberOf collection.components.ceventGetType
 *
 * @param {domain.studies.Study} study - The study to choose the *Collection Event Type* from.
 *
 * @param {domain.participants.Participant} participant - The participant to add the *Collection Event* to.
 */
const ceventGetTypeComponent = {
  template: require('./ceventGetType.html'),
  controller: CeventGetTypeController,
  controllerAs: 'vm',
  bindings: {
    study:       '<',
    participant: '<'
  }
};

export default ngModule => ngModule.component('ceventGetType', ceventGetTypeComponent)
