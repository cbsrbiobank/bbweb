/*
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2018 Canadian BioSample Repository (CBSR)
 */

import _ from 'lodash'

/*
 * Factory for participants.
 */
/* @ngInject */
function ParticipantFactory($q,
                            $log,
                            DomainEntity,
                            ConcurrencySafeEntity,
                            Study,
                            Annotation,
                            annotationFactory,
                            DomainError,
                            biobankApi,
                            HasAnnotations) {

  const REST_API_URL_SUFFIX = 'participants';

  const SCHEMA = ConcurrencySafeEntity.createDerivedSchema({
    id: 'Participant',
    properties: {
      'slug':        { 'type': 'string' },
      'uniqueId':    { 'type': 'string' },
      'studyId':     { 'type': 'string' },
      'annotations': { 'type': 'array', 'items':{ '$ref': 'Annotation' } }
    },
    required: [ 'slug', 'uniqueId', 'annotations' ]
  });

  /**
   * The subject for which a set of specimens were collected from. The subject can be human or
   * non human. A participant belongs to a single [Study]{@link domain.studies.Study}.
   *
   * Use this contructor to create a new Participant to be persited on the server. Use {@link
   * domain.participants.Participant.create|create()} or {@link
   * domain.participants.Particiapnt.asyncCreate|asyncCreate()} to create objects returned by the server.
   *
   * <i>To convert server side annotations to Annotation class call setAnnotationTypes().<i>
   *
   * @memberOf domain.participants
   * @extends domain.ConcurrencySafeEntity
   *
   * @param {object} [obj={}] - An initialization object whose properties are the same as the members from
   * this class. Objects of this type are usually returned by the server's REST API.
   *
   */
  class Participant extends HasAnnotations {

    constructor(obj, study, annotations) {
      /**
       * A participant has a unique identifier that is used to identify the participant in the system. This
       * identifier is not the same as the <code>id</code> value object used by the domain model.
       *
       * @name domain.studies.Participant#uniqueId
       * @type {string}
       */

      /**
       * The study identifier for the {@link domain.studies.Study|Study} this participant belongs to.
       *
       * @name domain.studies.Participant#studyId
       * @type {string}
       */

      /**
       * The values of the {@link domain.annotations.Annotation|Annotations} collected for this participant.
       *
       * @name domain.studies.Participant#annotations
       * @type {Array<domain.annotations.Annotation>}
       */

      super(Object.assign(
        {
          uniqueId:    '',
          studyId:     null,
          annotations: []
        },
        obj));

      Object.assign(this, { study });

      if (annotations !== undefined) {
        this.annotations = annotations;
      }

      if (study) {
        this.setStudy(study);
      }
    }

    setStudy(study) {
      this.study = study;
      this.studyId = study.id;
      this.setAnnotationTypes(study.annotationTypes);
    }

    /**
     * Returns a promise. If annotations are found to be invalid, then the promise is rejected. If the
     * annotations are valid, then a request is made to the server to add the participant.
     */
    add() {
      let invalidAnnotationErrMsg = null;
      const cmd = _.pick(this, 'uniqueId');

      // convert annotations to server side entities
      if (this.annotations) {
        cmd.annotations = this.annotations
          .map(annotation => {
            // make sure required annotations have values
            if (!annotation.isValueValid()) {
              invalidAnnotationErrMsg =
                `required annotation has no value: annotationId: ${annotation.annotationTypeId}`;
            }
            return annotation.getServerAnnotation();
          });
      } else {
        cmd.annotations = [];
      }

      if (invalidAnnotationErrMsg) {
        return $q.reject(invalidAnnotationErrMsg);
      }

      return biobankApi.post(Participant.url(this.studyId), cmd)
        .then(Participant.asyncCreate);
    }

    /*
     * Sets the collection event type after an update.
     */
    update(path, reqJson) {
      return super.update(Participant.url(path, this.id), reqJson)
        .then(Participant.asyncCreate)
        .then(updatedParticipant => {
          if (this.study) {
            updatedParticipant.setStudy(this.study);
          }
          return $q.when(updatedParticipant);
        });
    }

    updateUniqueId(uniqueId) {
      return this.update('uniqueId', { uniqueId: uniqueId });
    }

    addAnnotation(annotation) {
      return this.update('annot', annotation.getServerAnnotation());
    }

    removeAnnotation(annotation) {
      var url = Participant.url('annot', this.id, this.version, annotation.annotationTypeId);
      return HasAnnotations.prototype.removeAnnotation.call(this, annotation, url)
        .then(Participant.asyncCreate);
    }

    /** @private */
    static schema() {
      return SCHEMA;
    }

    /** @private */
    static additionalSchemas() {
      return [ Annotation.schema() ];
    }

    /**
     * Creates a Participant, but first it validates <tt>obj</tt> to ensure that it has a valid schema.
     *
     * @param {object} [obj={}] - An initialization object whose properties are the same as the members from
     * this class. Objects of this type are usually returned by the server's REST API.
     *
     * @returns {domain.studies.Participant} A participant created from the given object.
     *
     * @see {@link domain.studies.Participant.asyncCreate|asyncCreate()} when you need to create a participant
     * within asynchronous code.
     */
    static create(obj) {
      const validation = this.isValid(obj);
      if (!validation.valid) {
        $log.error(validation.message);
        throw new DomainError(validation.message);
      }

      const participant = new Participant(obj);

      if (obj.annotations) {
        // at this point the AnnotationType's that belong to each Annotation are not known
        //
        // just copy the raw annotation objects
        participant.annotations = obj.annotations;
      }

      return participant;
    }

    /**
     * Creates a Participant from a server reply but first validates that <tt>obj</tt> has a valid schema.
     * <i>Meant to be called from within promise code.</i>
     *
     * @param {object} [obj={}] - An initialization object whose properties are the same as the members from
     * this class. Objects of this type are usually returned by the server's REST API.
     *
     * @returns {Promise<domain.studies.Participant>} A participant wrapped in a promise.
     *
     * @see {@link domain.studies.Participant.create|create()} when not creating a Participant within
     * asynchronous code.
     */
    static asyncCreate(obj) {
      var result;

      try {
        result = Participant.create(obj);
        return $q.when(result);
      } catch (e) {
        return $q.reject(e);
      }
    }

    static url(...paths) {
      const args = [ REST_API_URL_SUFFIX ].concat(paths);
      return super.url(...args);
    }

    /**
     * Retrieves a Participant from the server.
     *
     * @param {string} slug the slug of the study to retrieve.
     *
     * @returns {Promise<domain.studies.Participant>} The participant within a promise.
     */
    static get(slug) {
      return biobankApi.get(this.url(slug))
        .then(this.asyncCreate);
    }
  }

  /** return constructor function */
  return Participant;
}

export default ngModule => ngModule.factory('Participant', ParticipantFactory)
