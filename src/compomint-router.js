/**
 * Compomint Router - Enhanced SPA routing functionality
 * An improved version of the original router with better code organization,
 * consistent modern JavaScript syntax, and expanded capabilities.
 */
(function () {
  "use strict";

  const root = this; // 'this' refers to global object (window in browser)
  const Compomint = root.compomint = root.compomint || {};
  const Router = Compomint.router = Compomint.router || {};

  // Router state management with proper constant declarations
  const routes = new Map(); // Routes storage
  let currentRoute = null; // Current active route info
  let defaultRoute = null; // Default route path
  let routerContainer = null; // Container element
  let initialized = false; // Initialization flag

  /**
   * Initialize the router with a container element
   * @param {Element|string} container - Container element or its ID
   * @param {Object} options - Router options
   * @returns {Object} Router instance for chaining
   */
  Router.init = function (container, options = {}) {
    routerContainer = typeof container === 'string'
      ? document.getElementById(container)
      : container;

    if (!routerContainer) {
      console.error('Router container not found');
      return Router;
    }

    // Add hash change event listener using arrow function
    window.addEventListener('hashchange', () => Router.navigate());

    initialized = true;

    // Initial navigation based on current hash
    Router.navigate();

    return Router; // Enable chaining
  };

  /**
   * Add a route with handler function
   * @param {string} path - Route path pattern
   * @param {Function|string} handler - Route handler function or template ID
   * @param {boolean} isDefault - Whether this is the default route
   * @returns {Object} Router instance for chaining
   */
  Router.addRoute = function (path, handler, isDefault = false) {
    // Create a route handler based on input type
    const routeHandler = typeof handler === 'string'
      ? createTemplateHandler(handler)
      : handler;

    // Store route info
    routes.set(path, {
      handler: routeHandler,
      regex: pathToRegex(path)
    });

    // Set as default if specified
    if (isDefault) {
      defaultRoute = path;
    }

    return Router; // Enable chaining
  };

  /**
   * Create a handler function from a template ID
   * @param {string} templateId - Template ID to render
   * @returns {Function} Handler function
   */
  function createTemplateHandler(templateId) {
    return function (params, query) {
      const tmpl = Compomint.tmpl(templateId);
      if (!tmpl) {
        console.error(`Template not found: ${templateId}`);
        return;
      }

      return tmpl({
        params,
        query
      }, routerContainer);
    };
  }

  /**
   * Navigate to a specific route or current route
   * @param {string} path - Optional path to navigate to
   * @returns {*} Result of route handler
   */
  Router.navigate = function (path) {
    if (!initialized) {
      console.error('Router not initialized');
      return;
    }

    const hash = path ? `#${path}` : window.location.hash;
    const url = hash.substring(1) || defaultRoute || '';

    // Redirect to default route if URL is empty
    if (!url && routes.size > 0 && defaultRoute) {
      window.location.hash = defaultRoute;
      return;
    }

    // Parse URL components
    const [pathName, queryString] = url.split('?');
    const queryParams = parseQueryString(queryString || '');

    // Find matching route
    for (const [routePath, route] of routes.entries()) {
      const match = pathName.match(route.regex);

      if (match) {
        // Extract path parameters
        const paramKeys = (routePath.match(/:[^\/]+/g) || []);
        const pathParams = {};

        paramKeys.forEach((key, index) => {
          pathParams[key.substring(1)] = match[index + 1];
        });

        // Set current route
        currentRoute = {
          path: pathName,
          params: pathParams,
          query: queryParams
        };

        // Execute route handler
        const result = route.handler(pathParams, queryParams, currentRoute);

        // Trigger navigation event
        const event = new CustomEvent('router:change', {
          detail: currentRoute
        });
        window.dispatchEvent(event);

        return result;
      }
    }

    // No route found
    console.warn(`No route found for path: ${pathName}`);

    // Redirect to default route if available
    if (defaultRoute) {
      window.location.hash = defaultRoute;
    }
  };

  /**
   * Get current route information
   * @returns {Object} Current route info
   */
  Router.getCurrentRoute = function () {
    return currentRoute;
  };

  /**
   * Create a link to a route
   * @param {string} path - Route path
   * @param {Object} params - Path parameters
   * @param {Object} query - Query parameters
   * @returns {string} URL hash
   */
  Router.createLink = function (path, params, query) {
    let url = path;

    // Replace path parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        const paramPlaceholder = `:${key}`;
        url = url.split(paramPlaceholder).join(value);
      });
    }

    // Add query parameters
    if (query) {
      const queryArr = Object.entries(query).map(([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      );

      if (queryArr.length > 0) {
        url += `?${queryArr.join('&')}`;
      }
    }

    return `#${url}`;
  };

  /**
   * Convert path pattern to regex
   * @param {string} path - Route path pattern
   * @returns {RegExp} Regular expression
   */
  function pathToRegex(path) {
    const pattern = path
      .replace(/\//g, '\\/') // Escape slashes
      .replace(/:[^\/]+/g, '([^\\/]+)'); // Convert parameters to capture groups

    return new RegExp(`^${pattern}$`);
  }

  /**
   * Parse query string into object
   * @param {string} queryString - Query string
   * @returns {Object} Query parameters
   */
  function parseQueryString(queryString) {
    const query = {};

    if (!queryString) return query;

    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (!key) return;

      const decodedKey = decodeURIComponent(key);
      const decodedValue = value
        ? decodeURIComponent(value.replace(/\+/g, ' '))
        : '';

      query[decodedKey] = decodedValue;
    });

    return query;
  }

  // Add router template tag
  Compomint.addTmpl('co-RouterLink', `
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
  Compomint.addTmpl('co-RouterView', `
    <div class="compomint-router-view"
         ##=data.id ? 'id="' + data.id + '"' : ''##
         ##=data.class ? 'class="' + data.class + '"' : ''##>
      <!-- Content will be rendered here by the router -->
    </div>
  `);

}).call(this);