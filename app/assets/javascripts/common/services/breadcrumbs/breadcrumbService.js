/*
 * Used for creating breadcrumbs.
 *
 * The reason for returning a function that calls gettextCatalog.getString is so that prompts
 * displayed in the client are updated correctly when the user changes the language.
 */
/* @ngInject */
class BreadcrumbService {

  constructor(gettextCatalog) {
    Object.assign(this, { gettextCatalog })

    const addLabelFunc  = () =>  gettextCatalog.getString('Add'),
          roleLabelFunc = () => gettextCatalog.getString('Roles')

    this.breadcrumbStateToDisplayFunc = new Map([
      [ 'home',                                 () => gettextCatalog.getString('Home') ],
      [ 'home.about',                           () => gettextCatalog.getString('About') ],
      [ 'home.contact',                         () => gettextCatalog.getString('Contact') ],
      [ 'home.admin',                           () => gettextCatalog.getString('Administration') ],
      [ 'home.admin.studies',                   () => gettextCatalog.getString('Studies') ],
      [ 'home.admin.centres',                   () => gettextCatalog.getString('Centres') ],
      [ 'home.admin.access',                    () => gettextCatalog.getString('Users') ],
      [ 'home.admin.access.users',              () => gettextCatalog.getString('Manage users') ],
      [ 'home.admin.access.users.user.roles',   roleLabelFunc ],
      [ 'home.admin.access.roles',              roleLabelFunc ],
      [ 'home.admin.access.memberships',        () => gettextCatalog.getString('Memberships') ],
      [ 'home.collection',                      () => gettextCatalog.getString('Collection') ],
      [ 'home.shipping',                        () => gettextCatalog.getString('Shipping') ],
      [ 'home.shipping.add',                    () => gettextCatalog.getString('Add shipment') ],
      [ 'home.collection.study.participantAdd', () => gettextCatalog.getString('Add participant') ],
      [ 'home.admin.centres.add',               addLabelFunc ],
      [ 'home.admin.studies.add',               addLabelFunc ],
      [ 'home.admin.access.memberships.add',    addLabelFunc ]
    ]);
  }

  forState(stateName) {
    if (!this.breadcrumbStateToDisplayFunc.has(stateName)) {
      throw new Error('display name function is undefined for state: ' + stateName);
    }
    const displayNameFunc = this.breadcrumbStateToDisplayFunc.get(stateName)
    return { route: stateName, displayNameFn: displayNameFunc };
  }

  forStateWithFunc(stateName, displayNameFunc) {
    return { route: stateName, displayNameFn: displayNameFunc };
  }

}

export default ngModule => ngModule.service('breadcrumbService', BreadcrumbService)
