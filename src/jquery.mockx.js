(function($) {
    'use strict';

    var handlers = [];

    var registerHandler = function(options) {
        handlers.push($.extend({
            url: null,
            method: null,
            match: null,
            async: false,
            wait: 0,
            handler: $.noop
        }, options));

        return handlers.length - 1;
    };

    var unregisterHandler = function(index) {
        if (handlers.length > index) {
            var handler = handlers[index];
            handlers[index] = null;
            return !!handler;
        } else {
            return false;
        }
    };

    var findHandler = function(options) {
        var foundHandler;
        var method = options.type.toUpperCase();

        $.each(handlers, function(index, handler) {
            if (handler) {
                var urlMatch = !handler.url || (handler.url instanceof RegExp ? handler.url.test(options.url) : handler.url === options.url);
                var methodMatch = !handler.method || (handler.method instanceof Array ? handler.method.indexOf(method) >= 0 : handler.method === method);
                var customMatch = typeof handler.match === 'function' ? handler.match.call(handler, options) : true;
                if (urlMatch && methodMatch && customMatch) {
                    foundHandler = handler;
                    return false;
                }
            }
        });

        return foundHandler;
    };

    $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
        var handler = findHandler(options);
        if (handler) {
            options.mockxHandler = handler;
            return 'mockx';
        }
    });

    $.ajaxTransport('mockx', function(options, originalOptions, jqXHR) {
        var timer;
        var aborted = false;
        var responseDefaults = {
            status: 200,
            statusText: 'OK',
            responseJSON: null,
            responseText: null
        };

        return {
            send: function(requestHeaders, completeCallback) {
                var handler = options.mockxHandler || findHandler(options);
                if (!handler) {
                    completeCallback(404, 'Not Found');
                } else if (handler.async) {
                    timer = setTimeout(function() {
                        handler.handler(options, function(data) {
                            if (!aborted) {
                                var response = $.extend(responseDefaults, data);
                                completeCallback(response.status, response.statusText, {
                                    mockx: response.responseJSON ? JSON.stringify(response.responseJSON) : response.responseText || ''
                                });
                            }
                        });
                    }, handler.wait);
                } else {
                    timer = setTimeout(function() {
                        var response = $.extend(responseDefaults, handler.handler(options));
                        completeCallback(response.status, response.statusText, {
                            mockx: response.responseJSON ? JSON.stringify(response.responseJSON) : response.responseText || ''
                        });
                    }, handler.wait);
                }
            },
            abort: function() {
                aborted = true;
                clearTimeout(timer);
            }
        };
    });

    $.mockx = function(action, options) {
        if (action === 'register') {
            if (options instanceof Array) {
                var indexes = [];
                $.each(options, function() {
                    indexes.push(registerHandler(this));
                });
                return indexes;
            } else {
                return registerHandler(options);
            }
        } else if (action === 'unregister') {
            if (options instanceof Array) {
                var success = [];
                $.each(options, function() {
                    success.push(unregisterHandler(this));
                });
                return success;
            } else {
                return unregisterHandler(options);
            }
        }
    };

})(jQuery);
