/**
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2015 Canadian BioSample Repository (CBSR)
 */

/* @ngInject */
function AnnotationTypeFactory($log,
                               DomainEntity,
                               DomainError,
                               AnnotationValueType,
                               AnnotationMaxValueCount) {

  /**
   * Information for the format of an annotation.
   * @memberOf domain
   * @extends domain.DomainEntity
   *
   */
  class AnnotationType extends DomainEntity {

    /**
     *
     *
     * @param {object} [obj={}] - An initialization object whose properties are the same as the members from
     * this class. Objects of this type are usually returned by the server's REST API.
     */
    constructor(obj) {
      /**
       * A short identifying name that is unique.
       *
       * @name domain.AnnotationType#name
       * @type {string}
       */

      /**
       * An optional description that can provide additional details on the name.
       *
       * @name domain.AnnotationType#description
       * @type {string}
       */

      /**
       * The type of information stored by the annotation.
       *
       * @name domain.AnnotationType#valueType
       * @type {domain.AnnotationValueType}
       */

      /**
       * When `valueType` is {@link domain.AnnotationValueType.SELECT}, this is the number of items allowed to
       * be selected. If the value is greater than 1 then any number of values can be selected.
       *
       * @name domain.AnnotationType#maxValueCount
       * @type {int}
       */

      /**
       * When true, the user must enter a value for this annotation.
       *
       * @name domain.AnnotationType#required
       * @type {boolean}
       */

      /**
       * When `valueType` is {@link domain.AnnotationValueType.SELECT}, these are the values allowed to be
       * selected.
       *
       * @name domain.AnnotationType#options
       * @type {string[]}
       */

      super(AnnotationType.SCHEMA, obj);
    }

    isValueTypeText() {
      return (this.valueType === AnnotationValueType.TEXT);
    }

    isValueTypeNumber() {
      return (this.valueType === AnnotationValueType.NUMBER);
    }

    isValueTypeDateTime() {
      return (this.valueType === AnnotationValueType.DATE_TIME);
    }

    isValueTypeSelect() {
      return (this.valueType === AnnotationValueType.SELECT);
    }

    isSingleSelect() {
      return (this.valueType === AnnotationValueType.SELECT) &&
        (this.maxValueCount === AnnotationMaxValueCount.SELECT_SINGLE);
    }

    isMultipleSelect() {
      return (this.valueType === AnnotationValueType.SELECT) &&
        (this.maxValueCount === AnnotationMaxValueCount.SELECT_MULTIPLE);
    }

    /**
     * Returns true if the maxValueCount value is valid.
     */
    isMaxValueCountValid() {
      if (this.isValueTypeSelect()) {
        return (this.isSingleSelect() || this.isMultipleSelect());
      }
      return ((this.maxValueCount === null) ||
              (this.maxValueCount === AnnotationMaxValueCount.NONE));
    }

    /**
     * Called when the annotation type's value type has been changed.
     */
    valueTypeChanged() {
      if (!this.isValueTypeSelect()) {
        this.maxValueCount = AnnotationMaxValueCount.NONE;
      }
      this.options = [];
    }

    /**
     * Used to add an option. Should only be called when the value type is 'Select'.
     */
    addOption() {
      if (!this.isValueTypeSelect()) {
        throw new DomainError('value type is not select: ' + this.valueType);
      }
      this.options.push('');
    }

    /**
     * Used to remove an option. Should only be called when the value type is 'Select'.
     */
    removeOption(index) {
      if (this.options.length <= 1) {
        throw new DomainError('options is empty, cannot remove any more options');
      }
      this.options.splice(index, 1);
    }

    /**
     * Returns true if each of the options in the options array are valid options for this annotation type.
     *
     * Options is an array of objects with keys: value and checked.
     */
    validOptions(options) {
      return options.reduce((memo, option) =>  memo && this.options.includes(option), true);
    }

    static isValid(obj) {
      return super.isValid(AnnotationType.SCHEMA, null, obj);
    }

    static create(obj) {
      var validation = AnnotationType.isValid(obj);

      if (!validation.valid) {
        $log.error('invalid object from server: ' + validation.error);
        throw new DomainError('invalid object from server: ' + validation.error);
      }
      return new AnnotationType(obj);
    }
  }

  AnnotationType.SCHEMA = {
    'id': 'AnnotationType',
    'type': 'object',
    'properties': {
      'id':            { 'type': 'string'  },
      'slug':          { 'type': 'string'  },
      'name':          { 'type': 'string'  },
      'description':   { 'type': [ 'string', 'null' ] },
      'valueType':     { 'type': 'string'  },
      'maxValueCount': { 'type': [ 'number', 'null' ] },
      'options':       { 'type': 'array'   },
      'required':      { 'type': 'boolean' }
    },
    'required': [ 'id', 'slug', 'name', 'valueType', 'required' ]
  };

  return AnnotationType;
}

export default ngModule => ngModule.factory('AnnotationType', AnnotationTypeFactory)
