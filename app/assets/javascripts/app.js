/**
 * The app module as an AngularJS module.
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2018 Canadian BioSample Repository (CBSR)
 */
/* global PRODUCTION, DEVELOPMENT */

import 'bootstrap/dist/css/bootstrap.css';
import 'angular-toastr/dist/angular-toastr.css';
import '../stylesheets/main.less';

// node modules
import angular           from 'angular';
import angularAnimate    from 'angular-animate';
import angularCookies    from 'angular-cookies';
import angularGettext    from 'angular-gettext';
import angularMessages   from 'angular-messages';
import angularSanitize   from 'angular-sanitize';
import angularSmartTable from 'angular-smart-table';
import angularToastr     from 'angular-toastr';
import angularUiRouter   from '@uirouter/angularjs';
import uiBootstrap       from 'angular-ui-bootstrap';
import uiDatetimePicker  from 'bootstrap-ui-datetime-picker';

// app modules - the regular expression picks up top level modules only and excludes the "test" module
const loadModules = require.context('./', true, /^\.[\\\/](?:(?!test)[a-zA-Z])*[\\\/]index\.js$/)
const moduleNames = []

loadModules.keys().forEach((key) => {
  moduleNames.push(loadModules(key).default)
})

const appModule = angular.module('biobankApp',
                                 [
                                   // node modules
                                   angularAnimate,
                                   angularCookies,
                                   angularGettext,
                                   angularMessages,
                                   angularSanitize,
                                   angularSmartTable,
                                   angularToastr,
                                   angularUiRouter,
                                   uiBootstrap,
                                   uiDatetimePicker
                                 ].concat(moduleNames))
      .run(['languageService', function (languageService) {
        languageService.initLanguage({ debug: true });
      }])

      .run(uiRouterTrace) // For tracing state transitions
      .run(uiRouterIsAuthorized) // For authorization checks
      .config(loggingConfig)
      .config(configToastr);

// top level AngularJS elements
const context = require.context('./', false, /^((?!(app|test)).)*\.js$/)

context.keys().forEach(key => {
  context(key).default(appModule)
})

export default appModule.name;

function configToastr(toastrConfig) {
  'ngInject';
  angular.extend(toastrConfig, {
    positionClass: 'toast-bottom-right'
  });

}

function uiRouterTrace($trace) {
  'ngInject';
  if (DEVELOPMENT) {
    $trace.enable('TRANSITION');
  }
}

function uiRouterIsAuthorized($transitions) {
  'ngInject';
  $transitions.onStart({ to: 'home.admin.**' },      checkIsAuthenticated);
  $transitions.onStart({ to: 'home.collection.**' }, checkIsAuthenticated);
  $transitions.onStart({ to: 'home.shipping.**' },   checkIsAuthenticated);

  function checkIsAuthenticated(transition) {
    var userService = transition.injector().get('userService'),
        $log = transition.injector().get('$log');
    return userService.requestCurrentUser()
      .catch((error) => {
        // User isn't authenticated. Redirect to login page
        if (error.status && (error.status === 401)) {
          return transition.router.stateService.target('home.users.login');
        }
        $log.error(error);
        return null;
      });
  }
}

function loggingConfig($logProvider) {
  'ngInject';
  if (!PRODUCTION) {
    $logProvider.debugEnabled(true);
  }
}
