/**
 * Jasmine test suite
 *
 */
define(function (require) {
  'use strict';

  var mocks = require('angularMocks'),
      _     = require('lodash');

  describe('ssSpecimensPagedTableComponent', function() {

    beforeEach(mocks.module('biobankApp', 'biobank.test'));

    beforeEach(inject(function(ComponentTestSuiteMixin) {
      _.extend(this, ComponentTestSuiteMixin.prototype);
      this.putHtmlTemplates(
        '/assets/javascripts/shipmentSpecimens/components/ssSpecimensPagedTable/ssSpecimensPagedTable.html');

      this.injectDependencies('$q',
                              '$rootScope',
                              '$compile',
                              '$state',
                              'ShipmentSpecimen',
                              'factory');

      this.createScope = function (defaultSortField,
                                   refresh,
                                   showItemState,
                                   onGetSpecimens,
                                   noSpecimensMessage,
                                   actions,
                                   onActionSelected) {
        ComponentTestSuiteMixin.prototype.createScope.call(
          this,
          '<ss-specimens-paged-table' +
            ' default-sort-field="' + defaultSortField + '"' +
            ' refresh="vm.refresh"' +
            ' show-item-state="vm.showItemState"' +
            ' on-get-specimens="vm.onGetSpecimens"' +
            ' no-specimens-message="' + noSpecimensMessage + '"' +
            ' actions="vm.actions"' +
            ' on-action-selected="vm.onActionSelected"' +
            '></ss-specimens-paged-table>',
          {
            refresh:          refresh,
            showItemState:    showItemState,
            onGetSpecimens:   onGetSpecimens,
            actions:          actions,
            onActionSelected: onActionSelected
          },
          'ssSpecimensPagedTable');
      };

      this.createTableState = function (searchPredicatObject,
                                        sortPredicate,
                                        sortOrderReverse) {
        var result = {
          sort: {
            predicate: sortPredicate,
            reverse: sortOrderReverse || false
          },
          pagination: { start: 0, totalItemCount: 0 }
        };

        if (searchPredicatObject) {
          result.search = { predicateObject: searchPredicatObject };
        }
        return result;
      };

      this.addTableController = function (searchPredicatObject, sortPredicate) {
        this.controller.tableController = {
          tableState: jasmine.createSpy()
            .and.returnValue(this.createTableState(searchPredicatObject, sortPredicate))
        };
      };
    }));

    it('should have valid scope', function() {
      var defaultSortField   = 'inventoryId',
          refreshTable       = 0,
          showItemState      = true,
          onGetSpecimens     = jasmine.createSpy('onGetSpecimens').and.returnValue(null),
          noSpecimensMessage = 'no specimens',
          actions            = [],
          onActionSelected   = jasmine.createSpy('onActionSelected').and.returnValue(null);

      this.createScope(defaultSortField,
                       refreshTable,
                       showItemState,
                       onGetSpecimens,
                       noSpecimensMessage,
                       actions,
                       onActionSelected);

      expect(this.controller.defaultSortField).toBe(defaultSortField);
      expect(this.controller.refresh).toBe(refreshTable);
      expect(this.controller.showItemState).toBe(showItemState);
      expect(this.controller.onGetSpecimens).toBeFunction();
      expect(this.controller.noSpecimensMessage).toBe(noSpecimensMessage);
      expect(this.controller.actions).toBe(actions);
      expect(this.controller.onActionSelected).toBeFunction();

      expect(this.controller.shipmentSpecimens).toBeEmptyArray();
      expect(this.controller.limit).toBe(10);
      expect(this.controller.tableController).toBeNull();
      expect(this.controller.hasActions).toBeFalse();
    });

    it('invoking $onChanges reloads table data', function() {
      var onGetSpecimens,
          refreshTable       = 0,
          actions            = [],
          onActionSelected   = jasmine.createSpy('onActionSelected').and.returnValue(null);

      onGetSpecimens     = jasmine.createSpy('onGetSpecimens')
        .and.returnValue(this.$q.when(this.factory.pagedResult([])));

      this.createScope('inventoryId',
                       refreshTable,
                       true,
                       onGetSpecimens,
                       '',
                       actions,
                       onActionSelected);

      this.addTableController({ inventoryId: 'test' });
      this.controller.$onChanges();
      this.scope.$digest();

      expect(onGetSpecimens).toHaveBeenCalled();
    });

    it('invoking $onChanges reloads table data', function() {
      var refreshTable = 0,
          actions = [{
            id:    'remove',
            class: 'btn-warning',
            title: 'Remove specimen',
            icon:  'glyphicon-remove'
          }],
          onGetSpecimens = jasmine.createSpy('onGetSpecimens').and.returnValue(null),
          onActionSelected = jasmine.createSpy('onActionSelected').and.returnValue(null),
          shipmentSpecimen = new this.ShipmentSpecimen(this.factory.shipmentSpecimen());

      this.createScope('inventoryId',
                       refreshTable,
                       true,
                       onGetSpecimens,
                       '',
                       actions,
                       onActionSelected);

      this.controller.actionSelected(shipmentSpecimen, actions[0]);
      this.scope.$digest();

      expect(onActionSelected).toHaveBeenCalled();
    });

  });

});