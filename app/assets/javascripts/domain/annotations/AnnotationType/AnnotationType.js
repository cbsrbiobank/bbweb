/**
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2015 Canadian BioSample Repository (CBSR)
 */
define(['angular', 'lodash'], function(angular, _) {
  'use strict';

  AnnotationTypeFactory.$inject = [
    '$log',
    'validationService',
    'DomainEntity',
    'DomainError',
    'AnnotationValueType',
    'AnnotationMaxValueCount',
    'annotationValueTypeLabelService'
  ];

  /**
   *
   */
  function AnnotationTypeFactory($log,
                                 validationService,
                                 DomainEntity,
                                 DomainError,
                                 AnnotationValueType,
                                 AnnotationMaxValueCount,
                                 annotationValueTypeLabelService) {

    function AnnotationType(obj) {
      // FIXME: jsdoc for this classes members is needed
      this.id            = '';
      this.name          = '';
      this.description   = null;
      this.valueType     = '';
      this.maxValueCount = null;
      this.options       = [];
      this.required      = false;

      DomainEntity.call(this, AnnotationType.SCHEMA, obj);
    }

    AnnotationType.SCHEMA = {
      'id': 'AnnotationType',
      'type': 'object',
      'properties': {
        'id':            { 'type': 'string'  },
        'name':          { 'type': 'string'  },
        'description':   { 'type': [ 'string', 'null' ] },
        'valueType':     { 'type': 'string'  },
        'maxValueCount': { 'type': [ 'number', 'null' ] },
        'options':       { 'type': 'array'   },
        'required':      { 'type': 'boolean' }
      },
      'required': [ 'id', 'name', 'valueType', 'required' ]
    };

    AnnotationType.isValid = function (obj) {
      return DomainEntity.isValid(AnnotationType.SCHEMA, null, obj);
    };

    AnnotationType.create = function (obj) {
      var validation = AnnotationType.isValid(obj);

      if (!validation.valid) {
        $log.error('invalid object from server: ' + validation.error);
        throw new DomainError('invalid object from server: ' + validation.error);
      }
      return new AnnotationType(obj);
    };

    /**
     * @returns {function} a function that returns a string that can be displayed to the user
     */
    AnnotationType.prototype.getValueTypeLabelFunc = function () {
      return annotationValueTypeLabelService.valueTypeToLabelFunc(this.valueType, this.isSingleSelect());
    };

    AnnotationType.prototype.isValueTypeText = function () {
      return (this.valueType === AnnotationValueType.TEXT);
    };

    AnnotationType.prototype.isValueTypeNumber = function () {
      return (this.valueType === AnnotationValueType.NUMBER);
    };

    AnnotationType.prototype.isValueTypeDateTime = function () {
      return (this.valueType === AnnotationValueType.DATE_TIME);
    };

    AnnotationType.prototype.isValueTypeSelect = function () {
      return (this.valueType === AnnotationValueType.SELECT);
    };

    AnnotationType.prototype.isSingleSelect = function () {
      return (this.valueType === AnnotationValueType.SELECT) &&
        (this.maxValueCount === AnnotationMaxValueCount.SELECT_SINGLE);
    };

    AnnotationType.prototype.isMultipleSelect = function () {
      return (this.valueType === AnnotationValueType.SELECT) &&
        (this.maxValueCount === AnnotationMaxValueCount.SELECT_MULTIPLE);
    };

    /**
     * Returns true if the maxValueCount value is valid.
     */
    AnnotationType.prototype.isMaxValueCountValid = function () {
      if (this.isValueTypeSelect()) {
        return (this.isSingleSelect() || this.isMultipleSelect());
      }
      return ((this.maxValueCount === null) ||
              (this.maxValueCount === AnnotationMaxValueCount.NONE));
    };

    /**
     * Called when the annotation type's value type has been changed.
     */
    AnnotationType.prototype.valueTypeChanged = function () {
      if (!this.isValueTypeSelect()) {
        this.maxValueCount = AnnotationMaxValueCount.NONE;
      }
      this.options = [];
    };

    /**
     * Used to add an option. Should only be called when the value type is 'Select'.
     */
    AnnotationType.prototype.addOption = function () {
      if (!this.isValueTypeSelect()) {
        throw new DomainError('value type is not select: ' + this.valueType);
      }
      this.options.push('');
    };

    /**
     * Used to remove an option. Should only be called when the value type is 'Select'.
     */
    AnnotationType.prototype.removeOption = function (index) {
      if (this.options.length <= 1) {
        throw new DomainError('options is empty, cannot remove any more options');
      }
      this.options.splice(index, 1);
    };

    /**
     * Returns true if each of the options in the options array are valid options for this annotation type.
     *
     * Options is an array of objects with keys: value and checked.
     */
    AnnotationType.prototype.validOptions = function (options) {
      var self = this;

      return _.reduce(options,
                      function (memo, option) {
                        return memo && _.includes(self.options, option);
                      },
                      true);
    };

    return AnnotationType;
  }

  return AnnotationTypeFactory;
});
