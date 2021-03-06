/**
 * AngularJS Component for {@link domain.centres.Centre Centre} administration.
 *
 * @namespace admin.centres.components.centreSummary
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2018 Canadian BioSample Repository (CBSR)
 */

/*
 * Controller for this component.
 */
/* @ngInject */
function CentreSummaryController($scope,
                                 $state,
                                 gettextCatalog,
                                 modalService,
                                 modalInput,
                                 notificationsService,
                                 centreStateLabelService) {
  var vm = this;
  vm.$onInit = onInit;
  vm.refreshCount = 0;

  //----

  function onInit() {
    vm.descriptionToggleControl = {}; // for truncateToggle directive
    vm.descriptionToggleState   = true;
    vm.descriptionToggleLength  = 100;

    vm.changeState     = changeState;
    vm.editName        = editName;
    vm.editDescription = editDescription;

    vm.stateLabelFunc = () => centreStateLabelService.stateToLabelFunc(vm.centre.state)();

    // updates the selected tab in 'centreView' component which is the parent directive
    $scope.$emit('tabbed-page-update', 'tab-selected');
  }

  function changeState(studyState) {
    var changeStateFn,
        stateChangeMsg;

    if (studyState === 'enable') {
      changeStateFn = vm.centre.enable;
      stateChangeMsg = gettextCatalog.getString('Are you sure you want to enable centre {{name}}?',
                                                { name: vm.centre.name });
    } else if (studyState === 'disable') {
      changeStateFn = vm.centre.disable;
      stateChangeMsg = gettextCatalog.getString('Are you sure you want to disable centre {{name}}?',
                                                { name: vm.centre.name });
    } else {
      throw new Error('invalid state: ' + studyState);
    }

    modalService.modalOkCancel(gettextCatalog.getString('Confirm state change on centre'),
                               stateChangeMsg)
      .then(() => changeStateFn.call(vm.centre)
            .then(centre => {
              vm.centre = centre;
              vm.refreshCount += 1;
              notificationsService.success('The centre\'s state has been updated.', null, 2000);
            }));
  }

  function postUpdate(message, title, timeout) {
    timeout = timeout || 1500;
    return function (centre) {
      vm.centre = centre;
      notificationsService.success(message, title, timeout);
    };
  }

  function editName() {
    modalInput.text(gettextCatalog.getString('Edit name'),
                    gettextCatalog.getString('Name'),
                    vm.centre.name,
                    { required: true, minLength: 2 }).result
      .then(name => vm.centre.updateName(name))
      .then(centre => {
        $scope.$emit('centre-name-changed', centre);
        postUpdate(gettextCatalog.getString('Name changed successfully.'),
                   gettextCatalog.getString('Change successful'))(centre);
      })
      .catch(error => {
        notificationsService.updateError(error);
      });
  }

  function editDescription() {
    modalInput.textArea(gettextCatalog.getString('Edit description'),
                        gettextCatalog.getString('Description'),
                        vm.centre.description).result
      .then(description => vm.centre.updateDescription(description))
      .then(postUpdate(gettextCatalog.getString('Description changed successfully.'),
                       gettextCatalog.getString('Change successful')))
      .catch(error => {
        notificationsService.updateError(error);
      });
  }

}

/**
 * An AngularJS component that displays a summary for a {@link domain.centres.Centre Centre}.
 *
 * @memberOf admin.centres.components.centreSummary
 *
 * @param {domain.centres.Centre} centre - the centre to display information for.
 */
const centreSummaryComponent = {
  template: require('./centreSummary.html'),
  controller: CentreSummaryController,
  controllerAs: 'vm',
  bindings: {
    centre: '<'
  }
};

export default ngModule => ngModule.component('centreSummary', centreSummaryComponent)
