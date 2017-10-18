/**
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2016 Canadian BioSample Repository (CBSR)
 */

import _ from 'lodash'

var component = {
  template: require('./centreAdd.html'),
  controller: CentreAddDirective,
  controllerAs: 'vm',
  bindings: {
  }
};

/*
 * Controller for this component.
 */
/* @ngInject */
function CentreAddDirective($state,
                            gettextCatalog,
                            Centre,
                            domainNotificationService,
                            notificationsService,
                            breadcrumbService) {
  var vm = this;
  vm.$onInit = onInit;

  //---

  function onInit() {
    vm.breadcrumbs = [
      breadcrumbService.forState('home'),
      breadcrumbService.forState('home.admin'),
      breadcrumbService.forState('home.admin.centres'),
      breadcrumbService.forState('home.admin.centres.add')
    ];

    vm.centre = new Centre();
    vm.submit = submit;
    vm.cancel = cancel;

    vm.returnState = {
      name: 'home.admin.centres',
      params: { },
      options: { reload: true }
    };

  }

  function gotoReturnState(state) {
    $state.go(state.name, state.params, state.options);
  }

  function submit(centre) {
    centre.add().then(onSubmitSuccess).catch(onSubmitError);
  }

  function onSubmitSuccess() {
    notificationsService.submitSuccess();
    gotoReturnState(vm.returnState);
  }

  function onSubmitError(error) {
    domainNotificationService.updateErrorModal(error, gettextCatalog.getString('centre'));
  }

  function cancel() {
    gotoReturnState(_.extend({}, vm.returnState, { options:{ reload: false } }));
  }
}

export default ngModule => ngModule.component('centreAdd', component)
