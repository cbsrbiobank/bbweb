/**
 * Jasmine test suite
 *
 */
/* global angular */

import { ModalTestSuiteMixin } from 'test/mixins/ModalTestSuiteMixin';
import ngModule from '../../index'

describe('shipmentSkipToSentModalService', function() {

  beforeEach(() => {
    angular.mock.module('ngAnimateMock', ngModule, 'biobank.test');
    angular.mock.inject(function() {
      Object.assign(this, ModalTestSuiteMixin);
      this.injectDependencies('$q',
                              'shipmentSkipToSentModalService',
                              'Factory');
      this.addModalMatchers();
      this.addCustomMatchers();

      this.openModal = () => {
        this.modal = this.shipmentSkipToSentModalService.open();
        this.modal.result.then(angular.noop, angular.noop);
        this.$rootScope.$digest();
        this.modalElement = this.modalElementFind();
        this.scope = this.modalElement.scope();
      };
    });
  });

  it('can open modal', function() {
    this.openModal();
    expect(this.$document).toHaveModalsOpen(1);
    this.dismiss();
    expect(this.$document).toHaveModalsOpen(0);
  });

  it('ok button can be pressed', function() {
    this.openModal();
    expect(this.$document).toHaveModalsOpen(1);
    this.scope.vm.okPressed();
    this.flush();
    expect(this.$document).toHaveModalsOpen(0);
  });

  it('cancel button can be pressed', function() {
    this.openModal();
    expect(this.$document).toHaveModalsOpen(1);
    this.scope.vm.cancelPressed();
    this.flush();
    expect(this.$document).toHaveModalsOpen(0);
  });

  it('can edit the time packed', function() {
    var timeNow = new Date();

    this.openModal();
    expect(this.$document).toHaveModalsOpen(1);
    this.scope.vm.timePackedOnEdit(timeNow);
    expect(this.scope.vm.timePacked).toBe(timeNow);
    this.scope.vm.cancelPressed();
    this.flush();
    expect(this.$document).toHaveModalsOpen(0);
  });

  it('can edit the time sent', function() {
    var timeNow = new Date();

    this.openModal();
    expect(this.$document).toHaveModalsOpen(1);
    this.scope.vm.timeSentOnEdit(timeNow);
    expect(this.scope.vm.timeSent).toBe(timeNow);
    this.scope.vm.cancelPressed();
    this.flush();
    expect(this.$document).toHaveModalsOpen(0);
  });

});
