/**
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2016 Canadian BioSample Repository (CBSR)
 */

var component = {
  template: require('./centreLocationAdd.html'),
  controller: CentreLocationAddController,
  controllerAs: 'vm',
  bindings: {
    centre: '<'
  }
};

/*
 * Controller for this component.
 */
/* @ngInject */
function CentreLocationAddController($state,
                                     gettextCatalog,
                                     domainNotificationService,
                                     notificationsService) {
  var vm = this;
  vm.$onInit = onInit;

  //---
  function onInit() {
    vm.submit = submit;
    vm.cancel = cancel;
    vm.returnStateName = 'home.admin.centres.centre.locations';
  }

  function submit(location) {
    vm.centre.addLocation(location)
      .then(submitSuccess)
      .catch(submitError);

    //--

    function submitSuccess() {
      notificationsService.submitSuccess();
      $state.go(vm.returnStateName, {}, { reload: true });
    }

    function submitError(error) {
      return domainNotificationService.updateErrorModal(error, gettextCatalog.getString('location'));
    }
  }

  function cancel() {
    $state.go(vm.returnStateName);
  }

}

export default ngModule => ngModule.component('centreLocationAdd', component)
