/**
 * AngularJS Component for {@link domain.participants.Specimen Specimen} collection.
 *
 * @namespace collection.components.participantSummary
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2018 Canadian BioSample Repository (CBSR)
 */

/*
 * Controller for this component.
 */
/* @ngInject */
function ParticipantSummaryController(gettextCatalog,
                                      annotationUpdate,
                                      notificationsService,
                                      modalInput) {
  var vm = this;
  vm.$onInit = onInit;

  //--

  function onInit() {
    vm.editUniqueId   = editUniqueId;
    vm.editAnnotation = editAnnotation;
  }

  function postUpdate(message, title, timeout) {
    timeout = timeout || 1500;
    return function (participant) {
      vm.participant = participant;
      notificationsService.success(message, title, timeout);
    };
  }

  function editUniqueId() {
    modalInput.text(gettextCatalog.getString('Update unique ID'),
                    gettextCatalog.getString('Unique ID'),
                    vm.participant.uniqueId,
                    { required: true }).result
      .then(function (uniqueId) {
        vm.participant.updateUniqueId(uniqueId)
          .then(postUpdate(gettextCatalog.getString('Unique ID updated successfully.'),
                           gettextCatalog.getString('Change successful')))
          .catch(error => {
            notificationsService.updateError(error);
          });
      });
  }

  function editAnnotation(annotation) {
    annotationUpdate.update(annotation)
      .then(newAnnotation => vm.participant.addAnnotation(newAnnotation))
      .then(postUpdate(gettextCatalog.getString('Annotation updated successfully.'),
                       gettextCatalog.getString('Change successful')))
      .catch(error => {
        notificationsService.updateError(error);
      });
  }
}


/**
 * An AngularJS component that displays summary information for a {@link domain.participants.Participant
 * Participant}.
 *
 * @memberOf collection.components.participantSummary
 *
 * @param {domain.studies.Study} study - the study the *Participant* should be added to.
 *
 * @param {domain.participants.Participant} participant - The participant to display information for.
 */
const participantSummaryComponent = {
  template: require('./participantSummary.html'),
  controller: ParticipantSummaryController,
  controllerAs: 'vm',
  bindings: {
    study:       '<',
    participant: '<'
  }
};

export default ngModule => ngModule.component('participantSummary', participantSummaryComponent)
