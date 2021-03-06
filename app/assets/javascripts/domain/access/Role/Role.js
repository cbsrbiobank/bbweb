/*
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2018 Canadian BioSample Repository (CBSR)
 */

import _ from 'lodash'

/* @ngInject */
function RoleFactory($q,
                     $log,
                     biobankApi,
                     DomainEntity,
                     ConcurrencySafeEntity,
                     AccessItem,
                     EntityInfo,
                     DomainError) {

  const SCHEMA = AccessItem.createDerivedSchema({
    id: 'Role',
    properties: {
      'userData': { 'type': 'array', 'items': { '$ref': 'EntityInfo' } }
    },
    required: [ 'userData' ]
  });
  /**
   * A Role represents the set of permissions that a user has.
   *
   * @extends domain.access.AccessItem
   * @memberOf domain.access
   */
  class Role extends AccessItem {

    constructor(obj = {}) {

      /**
       * The users that have this role.
       *
       * @name domain.access.Role#userData
       * @type {Array<EntityInfo>}
       */
      super(Object.assign(
        {
          userData: []
        },
        obj));

      if (obj.userData) {
        this.userData = obj.userData.map(info => new EntityInfo(info))
      }
    }

    /**
     * Adds a role.
     *
     * @return {Promise<domain.access.Role>} A promise containing the role that was created.
     */
    add() {
      const getId = (entityInfo) => entityInfo.id,
            json     = _.pick(this, 'name', 'description')
      json.userIds   = this.userData.map(getId);
      json.parentIds = this.parentData.map(getId);
      json.childIds  = this.childData.map(getId);
      return biobankApi.post(Role.url(), json).then(Role.asyncCreate);
    }

    /**
     * Removes a role.
     *
     * @return {Promise<boolean>} A promise with boolean TRUE if successful.
     */
    remove() {
      var url;
      if (_.isNil(this.id)) {
        throw new DomainError('role has not been persisted');
      }
      url = Role.url(this.id, this.version);
      return biobankApi.del(url);
    }

    /** @protected */
    update(url, additionalJson) {
      return super.update(url, additionalJson).then(Role.asyncCreate);
    }

    /**
     * Sends a request to the server to update the name.
     *
     * @param {String} name - The new name to give this role.
     *
     * @returns {Promise<domain.access.Role>} A promise containing the role with the new name.
     */
    updateName(name) {
      return this.update(Role.url('name', this.id), { name: name });
    }

    /**
     * Sends a request to the server to update the description.
     *
     * @param {String} description - The new description to give this role.
     *
     * @returns {Promise<domain.access.Role>} A promise containing the role with the new name.
     */
    updateDescription(description) {
      return this.update(Role.url('description', this.id),
                         description ? { description: description } : {});
    }

    addUser(id) {
      return this.update(Role.url('user', this.id), { userId: id });
    }

    removeUser(id) {
      if (_.isNil(this.id)) {
        throw new DomainError('role has not been persisted');
      }
      const url = Role.url('user', this.id, this.version, id);
      return biobankApi.del(url).then(Role.asyncCreate);
    }

    addParentRole(id) {
      return this.update(Role.url('parent', this.id), { parentRoleId: id });
    }

    removeParentRole(id) {
      if (_.isNil(this.id)) {
        throw new DomainError('role has not been persisted');
      }
      const url = Role.url('parent', this.id, this.version, id);
      return biobankApi.del(url).then(Role.asyncCreate);
    }

    addChildRole(id) {
      return this.update(Role.url('child', this.id), { childRoleId: id });
    }

    removeChildRole(id) {
      if (_.isNil(this.id)) {
        throw new DomainError('role has not been persisted');
      }
      const url = Role.url('child', this.id, this.version, id);
      return biobankApi.del(url).then(Role.asyncCreate);
    }

    static url(...pathItems) {
      return DomainEntity.url.apply(null, [ 'access/roles' ].concat(pathItems));
    }

    /**
     * @private
     * @return {object} The JSON schema for this class.
     */
    static schema() {
      return SCHEMA;
    }

    /**
     * Creates a Role, but first it validates <code>obj</code> to ensure that it has a valid schema.
     *
     * @param {object} [obj={}] - An initialization object whose properties are the same as the members from
     * this class. Objects of this type are usually returned by the server's REST API.
     *
     * @returns {domain.access.Role} A Role created from the given object.
     *
     * @see {@link domain.access.Role.asyncCreate|asyncCreate()} when you need to create
     * a Role within asynchronous code.
     */
    static create(obj) {
      var validation = Role.isValid(obj);
      if (!validation.valid) {
        $log.error(validation.message);
        throw new DomainError(validation.message);
      }
      return new Role(obj);
    }

    /**
     * Creates a Role from a server reply, but first validates that <tt>obj</tt> has a valid schema.
     * <i>Meant to be called from within promise code.</i>
     *
     * @param {object} [obj={}] - An initialization object whose properties are the same as the members from
     * this class. Objects of this type are usually returned by the server's REST API.
     *
     * @returns {Promise<domain.access.Role>} A Role wrapped in a promise.
     *
     * @see {@link domain.access.Role.create|create()} when not creating a Role within asynchronous code.
     */
    static asyncCreate(obj) {
      var result;

      try {
        result = Role.create(obj);
        return $q.when(result);
      } catch (e) {
        return $q.reject(e);
      }
    }

    /**
     * Retrieves a Role from the server.
     *
     * @param {string} id the ID of the role to retrieve.
     *
     * @returns {Promise<domain.access.Role>} The role within a promise.
     */
    static get(id) {
      return biobankApi.get(Role.url(id)).then(Role.asyncCreate);
    }

    /**
     * Used to list Roles.
     *
     * @param {object} options - The options to use.
     *
     * @param {string} options.filter The filter expression to use on role to refine the list.
     *
     * @param {int} options.page If the total results are longer than limit, then page selects which
     * roles should be returned. If an invalid value is used then the response is an error.
     *
     * @param {int} options.limit The total number of roles to return per page. The maximum page size is
     * 10. If a value larger than 10 is used then the response is an error.
     *
     * @returns {Promise<common.controllers.PagedListController.PagedResult>} A promise with items of type
     * {@link domain.access.Role}.
     */
    static list(options) {
      var validKeys = [ 'filter', 'page', 'limit' ],
          params;

      options = options || {}
      params = _.omitBy(_.pick(options, validKeys), (value) => value === '');

      return biobankApi.get(Role.url(), params).then((reply) => {
        // reply is a paged result
        var deferred = $q.defer();
        try {
          reply.items = reply.items.map((obj) => Role.create(obj));
          deferred.resolve(reply);
        } catch (e) {
          deferred.reject('invalid roles from server');
        }
        return deferred.promise;
      });
    }

  }

  return Role;
}

export default ngModule => ngModule.factory('Role', RoleFactory)
