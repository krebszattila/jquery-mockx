# jquery-mockx

Simple jQuery plugin for mocking ajax requests.

This implementation does not override the jQuery ajax function. It works by registering a special ajax prefilter and ajax transport.

This plugin is mainly useful for unit testing, but there are special cases where this could come in handy.

Note: it is mostly tested with JSON requests.

## Usage

For mocking the ajax request you do not need to modify any of your ajax calls. Instead, you can register handlers, which will be checked on every ajax call. If one of the registered handlers matches the ajax (by URL pattern, HTTP method or a custom match function), the request will be mocked by calling the hanlder function. If no matching handlers found, the request will be a normal ajax call.

## API

### Registering a handler

`$.mockx('register', handlerOptions);`

`handerOptions`:

* `url`: The URL String or RegExp. If not specified, all URLs will be handled.
* `method`: The HTTP method or array of methods. If not specified all methods will be handled.
* `match`: Optional custom match function, called with the jQuery ajax settings as an argument. Return a truthy value to match.
* `wait`: Time to wait in ms before calling the handler function. Default is `0`.
* `handler`: The function which handles the mocked ajax request and returns the response. See details below.
* `async`: If the handler function handles the request asynchronously, then set this to `true`. Default is `false`.

The `register` function returns a handler ID, which can be used to unregister the handler later on.

You can register multiple handlers at once, by passing an array of options objects. In that case, the return value will be an array of the handler IDs in the same order.

The ajax will be handled only if the `url`, the `method` and the custom `match` function matches.

#### Handler function

The handler function is called with the jQuery ajax settings object as the first argument.

In synchronous mode, the response object returned by the handler function will be the response of the mocked ajax.

In asynchronous mode, a callback function is passed to the handler function as the second argument. The handler needs to call this callback function with the response object as an argument in order to resolve the mocked ajax request.

### Unregistering a handler

`$.mockx('unregister', handlerId);`

`handlerId`: The ID returned when the handler registered.

Returns `true`, if a handler found with the specified handler ID, otherwise returns `false`.

You can unregister multiple handlers at once, by passing an array of handler IDs. In that case, the return value will be an array of booleans.

## Examples

Mock all POST http://example.com/test.php requests:

```javascript
$.mockx('register', {
    url: 'http://example.com/test.php',
    method: 'POST',
    handler: function(options) {
        return {
            responseJSON: {status: 'Ajax mocked!'}
        }
    }
});
```

Mock all GET and POST *.php requests if they have a data setting.
Wait 2000 ms before handling the request asynchronously:

```javascript
$.mockx('register', {
    url: /\.php$/,
    method: ['GET', 'POST'],
    match: function(options) {
        return options.data
    },
    wait: 2000,
    async: true,
    handler: function(options, callback) {
        var response = {};
        // do something asynchronously
        callback(response);
    }
});
```

Mock all requests, by registering 2 handlers: the first will be called on GET requests, the second will be called on every other request, because the handlers will be checked in the order they were registered:

```javascript
$.mockx('register', [{
    method: 'GET',
    handler: function(options) {
        // handle the GET requests
    }
}, {
    handler: function(options) {
        // handle the all (other) requests
    }
}]);
```

Unregister a handler:

```javascript
var handlerId = $.mockx('register', {
    // handler options
});

$.mockx('unregister', handlerId);
```

Unregister multiple handlers:

```javascript
var hanlderIds = $.mockx('register', [{
    // handler #1 options
}, {
    // handler #2 options
}]);

$.mockx('unregister', handlerIds);
```
