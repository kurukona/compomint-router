// Add Compomint Router functionality
(function () {
  "use strict";

  const root = this; // 'this' likely won't change within this IIFE
  const Compomint = root.compomint = root.compomint || {};
  const Router = Compomint.router = Compomint.router || {};

  // Router state management
  const routes = new Map(); // Map itself is constant, its content changes
  let currentRoute = null; // Reassigned when navigating
  let defaultRoute = null; // Can be set via addRoute
  let routerContainer = null; // Assigned in init
  let initialized = false; // Reassigned in init

  // Router initialization function
  Router.init = function (container, options = {}) { // Default parameter for options
    // options = options || {}; // No longer needed with default parameter
    routerContainer = typeof container === 'string' ? document.getElementById(container) : container;

    if (!routerContainer) {
      console.error('Router container not found');
      return;
    }

    // Add hash change event listener
    window.addEventListener('hashchange', () => Router.navigate());

    initialized = true;

    // Initial navigation based on current hash
    Router.navigate();

    return Router;
  };

  // Add route function
  Router.addRoute = function (path, handler, isDefault) {
    let routeHandler = handler; // Use a different name to avoid shadowing
    if (typeof handler === 'string') {
      // Create handler to process template ID
      const templateId = handler; // templateId is constant within this scope
      routeHandler = function (params, query) {
        const tmpl = Compomint.tmpl(templateId); // tmpl is constant within this scope
        if (!tmpl) {
          console.error('Template not found: ' + templateId);
          return;
        }

        return tmpl({
          params: params,
          query: query
        }, routerContainer);
      };
    }

    routes.set(path, {
      handler: routeHandler, // Use the potentially modified handler
      regex: pathToRegex(path)
    });

    if (isDefault) {
      defaultRoute = path;
    }

    return Router;
  };

  // Router navigation function
  Router.navigate = function (path) {
    if (!initialized) {
      console.error('Router not initialized');
      return;
    }

    const hash = path ? '#' + path : window.location.hash;
    const url = hash.substring(1) || defaultRoute || '';

    if (!url && routes.size > 0 && defaultRoute) {
      window.location.hash = defaultRoute;
      return;
    }

    // Separate query string from URL
    const urlParts = url.split('?');
    const pathName = urlParts[0];
    const queryString = urlParts.length > 1 ? urlParts[1] : '';
    const queryParams = parseQueryString(queryString);

    let matchedRoute = null; // Reassigned if a match is found
    let pathParams = {}; // Potentially modified inside the loop

    // Path matching - Use for...of for iterating Map entries
    for (const [routePath, route] of routes.entries()) {
      // if (matchedRoute) break; // More efficient to break once found

      const match = pathName.match(route.regex);
      if (match) {
        matchedRoute = route;

        // Extract path parameters
        const keys = routePath.match(/:[^\/]+/g) || [];
        pathParams = {}; // Reset pathParams for the current match
        keys.forEach((key, index) => { // Use arrow function for concise syntax
          pathParams[key.substring(1)] = match[index + 1];
        });
        break; // Found the route, no need to check others
      }
    }


    if (matchedRoute) {
      currentRoute = {
        path: pathName,
        params: pathParams,
        query: queryParams
      };

      // Execute route handler
      const result = matchedRoute.handler(pathParams, queryParams, currentRoute);

      // Trigger navigation event for the new route
      const event = new CustomEvent('router:change', {
        detail: currentRoute
      });
      window.dispatchEvent(event);

      return result;
    } else {
      console.warn('No route found for path: ' + pathName);

      // Redirect to default route
      if (defaultRoute) {
        window.location.hash = defaultRoute;
      }
    }
  };

  // Return current route information
  Router.getCurrentRoute = function () {
    return currentRoute;
  };

  // Link creation function
  Router.createLink = function (path, params, query) {
    let url = path; // URL is modified based on params and query

    // Replace path parameters
    if (params) {
      Object.keys(params).forEach(key => { // Use arrow function
        // Use a more robust replacement method if needed, but this is simple
        const paramPlaceholder = ':' + key;
        // Ensure global replacement if a param name could appear multiple times (unlikely in paths)
        url = url.split(paramPlaceholder).join(params[key]);
      });
    }

    // Add query parameters
    if (query) {
      const queryArr = [];
      Object.keys(query).forEach(key => {
        queryArr.push(`${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`); // Template literal
      });

      if (queryArr.length > 0) {
        url += '?' + queryArr.join('&');
      }
    }

    return '#' + url;
  };

  // Utility function to convert path to regex
  function pathToRegex(path) {
    // These patterns are constant for this function call
    const pattern = path
      .replace(/\//g, '\\/') // Escape slashes
      .replace(/:[^\/]+/g, '([^\\/]+)'); // Convert parameters to capture groups

    return new RegExp('^' + pattern + '$');
  }

  // Utility function to parse query string
  function parseQueryString(queryString) {
    const query = {}; // Object is constant, its properties change

    if (!queryString) return query;

    queryString.split('&').forEach(param => {
      const parts = param.split('=');
      // Use const as key/value are not reassigned within this iteration
      const key = decodeURIComponent(parts[0]);
      const value = parts.length > 1 ? decodeURIComponent(parts[1].replace(/\+/g, ' ')) : ''; // Handle '+' for spaces

      query[key] = value;
    });

    return query;
  }

  // Add router template tag
  // Assuming Compomint.tmplTool.addTmpl handles the template string correctly
  Compomint.tools.addTmpl('co-RouterLink', `
    <a href="##=compomint.router.createLink(data.to, data.params, data.query)##"
       class="co-RouterLink ##=data.class ? data.class : ''##"
       ##=data.id ? 'id="' + data.id + '"' : ''##
       data-co-event="##:{
         click: function(event, {targetElement}) {
           if (!data.external) {
             event.preventDefault();
             // Get href safely
             const href = targetElement.getAttribute('href');
             if (href && href.startsWith('#')) {
                compomint.router.navigate(href.substring(1));
             }
           }
         }
       }##">
      ##if (typeof data.content === "string") {##
        ##=data.content##
      ##} else {##
        ##%data.content##
      ##}##
    </a>
  `);

  // Add router view template
  Compomint.tools.addTmpl('co-RouterView', `
    <div class="compomint-router-view"
         ##=data.id ? 'id="' + data.id + '"' : ''##
         ##=data.class ? 'class="' + data.class + '"' : ''##>
      <!-- Content will be rendered here by the router -->
    </div>
  `);

}).call(this);
