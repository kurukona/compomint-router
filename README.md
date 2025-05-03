# compomint-router

A simple, lightweight client-side router extension for Compomint templating library.

## Overview

Compomint Router is an extension to the Compomint templating library that provides client-side routing capabilities for single-page applications. It uses hash-based routing to enable navigation without page reloads while integrating seamlessly with Compomint's templating system.

## Features

- **Hash-based routing**: Navigate between views without page reloads
- **Template integration**: Works directly with Compomint templates
- **Dynamic route parameters**: Support for path parameters like `/users/:id`
- **Query string parsing**: Automatic parsing of query parameters
- **Default routes**: Configure fallback routes when no match is found
- **Event-based**: Subscribe to route change events
- **Custom handlers**: Define custom route handlers or use template IDs
- **Router link component**: Special link component for router navigation

## Installation

Add the router extension after including Compomint:

```html
<script src="path/to/compomint-core.js"></script>
<script src="path/to/compomint-router.js"></script>
```

Alternatively, you can add the router code directly to your `compomint-core.js` file.

## Basic Usage

### Initialize the Router

First, initialize the router with a container element where your views will be rendered:

```javascript
// Initialize with container ID
compomint.router.init('app-container');

// Or with DOM element
compomint.router.init(document.getElementById('app-container'));
```

### Define Routes

Add routes to your application:

```javascript
// Add routes with template IDs
compomint.router.addRoute('/', 'home-template', true); // true makes this the default route
compomint.router.addRoute('/about', 'about-template');
compomint.router.addRoute('/users/:id', 'user-detail-template');

// Add route with custom handler function
compomint.router.addRoute('/products', function(params, query, route) {
  // Custom handling logic
  var data = fetchProducts(query.category);
  
  // Render template with data
  return compomint.tmpl('product-template')({
    products: data,
    category: query.category
  }, document.getElementById('app-container'));
});
```

### Navigate Between Routes

```javascript
// Navigate programmatically
compomint.router.navigate('/about');
compomint.router.navigate('/users/123');
compomint.router.navigate('/products?category=books');

// Or use the RouterLink component in your templates
compomint.tmpl('co-RouterLink')({
  to: '/users/:id',
  params: { id: 123 },
  content: 'View User Profile'
}, linkContainer);
```

### Respond to Route Changes

```javascript
window.addEventListener('router:change', function(e) {
  console.log('Route changed:', e.detail);
  // e.detail contains { path, params, query }
});
```

## API Reference

### Router Methods

#### `compomint.router.init(container, options)`

Initializes the router with a container element.

- **container**: DOM element or ID of the container where views will be rendered
- **options**: (Optional) Configuration options
- **Returns**: Router instance for chaining

#### `compomint.router.addRoute(path, handler, isDefault)`

Adds a route to the router.

- **path**: Route path pattern (e.g., `/users/:id`)
- **handler**: Template ID string or handler function
- **isDefault**: (Optional) Boolean indicating if this is the default route
- **Returns**: Router instance for chaining

#### `compomint.router.navigate(path)`

Navigates to a specific route.

- **path**: (Optional) Path to navigate to. If not provided, navigates to current hash.
- **Returns**: Result of the route handler

#### `compomint.router.getCurrentRoute()`

Gets the current route information.

- **Returns**: Object containing the current route details (`path`, `params`, `query`)

#### `compomint.router.createLink(path, params, query)`

Creates a URL for a route with parameters.

- **path**: Route path pattern
- **params**: (Optional) Object mapping parameter names to values
- **query**: (Optional) Object mapping query parameter names to values
- **Returns**: URL string with hash prefix

### Router Components

#### `co-RouterLink`

A component for creating links that work with the router.

```javascript
compomint.tmpl('co-RouterLink')({
  to: '/users/:id',           // Route path
  params: { id: 123 },        // Path parameters
  query: { tab: 'profile' },  // Query parameters
  content: 'User Profile',    // Link text or content
  class: 'nav-link',          // Optional CSS classes
  id: 'profile-link',         // Optional ID
  external: false             // Set to true for external links
});
```

#### `co-RouterView`

A component for defining a router view container.

```javascript
compomint.tmpl('co-RouterView')({
  id: 'main-view',        // Optional ID
  class: 'router-content' // Optional CSS classes
});
```

## Events

### `router:change`

Fired when the route changes. The event detail contains the current route information.

```javascript
window.addEventListener('router:change', function(e) {
  // e.detail = { path, params, query }
  console.log('Current path:', e.detail.path);
  console.log('Path parameters:', e.detail.params);
  console.log('Query parameters:', e.detail.query);
});
```

## Examples

### Basic Template with Router

```html
<!DOCTYPE html>
<html>
<head>
    <title>Compomint Router Example</title>
    <script src="compomint.template.js"></script>
    <script src="compomint.router.js"></script>
</head>
<body>
    <header>
        <nav id="nav-container"></nav>
    </header>
    
    <main id="app-container"></main>
    
    <template id="nav-template">
        <ul class="nav">
            <li id="home-link"></li>
            <li id="about-link"></li>
            <li id="products-link"></li>
        </ul>
    </template>
    
    <template id="home-template">
        <h1>Home Page</h1>
        <p>Welcome to our application!</p>
    </template>
    
    <template id="about-template">
        <h1>About Us</h1>
        <p>This is the about page content.</p>
    </template>
    
    <template id="product-template">
        <h1>Products</h1>
        <p>Category: ##=data.category##</p>
        <ul>
            ##data.products.forEach(function(product) {##
                <li>##=product.name## - $##=product.price##</li>
            ##});##
        </ul>
    </template>
    
    <template id="user-template">
        <h1>User Profile</h1>
        <p>User ID: ##=data.params.id##</p>
        <div id="user-details"></div>
    </template>
    
    <script>
        // Initialize router
        compomint.router.init('app-container');
        
        // Add routes
        compomint.router.addRoute('/', 'home-template', true);
        compomint.router.addRoute('/about', 'about-template');
        compomint.router.addRoute('/products', function(params, query) {
            var products = [
                { name: 'Product 1', price: 10 },
                { name: 'Product 2', price: 20 },
                { name: 'Product 3', price: 30 }
            ];
            
            return compomint.tmpl('product-template')({
                products: products,
                category: query.category || 'All'
            }, document.getElementById('app-container'));
        });
        compomint.router.addRoute('/users/:id', 'user-template');
        
        // Render navigation
        var navScope = compomint.tmpl('nav-template')({}, document.getElementById('nav-container'));
        
        // Add router links to navigation
        compomint.tmpl('co-RouterLink')({
            to: '/',
            content: 'Home'
        }, navScope.homeLink);
        
        compomint.tmpl('co-RouterLink')({
            to: '/about',
            content: 'About'
        }, navScope.aboutLink);
        
        compomint.tmpl('co-RouterLink')({
            to: '/products',
            query: { category: 'featured' },
            content: 'Products'
        }, navScope.productsLink);
        
        // Listen for route changes
        window.addEventListener('router:change', function(e) {
            console.log('Route changed:', e.detail);
        });
    </script>
</body>
</html>
```

## Browser Compatibility

Compomint Router works in all modern browsers, including:
- Chrome
- Firefox
- Safari
- Edge

For IE11 support, you may need additional polyfills for ES6 features.

## License

Same as Compomint - MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
