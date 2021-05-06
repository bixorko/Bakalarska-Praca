"use strict";
var utils_1 = require('./utils');
var soap = require('soap');
var utils = utils_1.Utils.utils;
var NOT_IMPLEMENTED = {
    Fault: {
        attributes: {
            'xmlns:ter': 'http://www.onvif.org/ver10/error',
        },
        Code: {
            Value: "soap:Sender",
            Subcode: {
                Value: "ter:NotAuthorized",
            },
        },
        Reason: {
            Text: {
                attributes: {
                    'xml:lang': 'en',
                },
                $value: 'Sender not Authorized',
            }
        }
    }
};
var SoapService = (function () {
    function SoapService(config, server) {
        this.webserver = server;
        this.config = config;
        this.serviceInstance = null;
        this.startedCallbacks = [];
        this.isStarted = false;
        this.serviceOptions = {
            path: '',
            services: null,
            xml: null,
            wsdlPath: '',
            onReady: function () { }
        };
    }
    SoapService.prototype.starting = function () { };
    SoapService.prototype.started = function () { };
    SoapService.prototype.start = function () {
        var _this = this;
        this.starting();
        if (this.constructor.name != "PTZService")
            utils.log.info("Binding %s to http://%s:%s%s", this.constructor.name, utils.getIpAddress(), this.config.ServicePort, this.serviceOptions.path);
        var onReady = this.serviceOptions.onReady;
        this.serviceOptions.onReady = function () {
            _this._started();
            onReady();
        };
        this.serviceInstance = soap.listen(this.webserver, this.serviceOptions);
        this.serviceInstance.on('headers', function (headers, methodName) {
            if (methodName === "GetSystemDateAndTime")
                return;
            if (_this.config.Username) {
                var token = headers.Security.UsernameToken;
                var user = token.Username;
                var password = (token.Password.$value || token.Password);
                var nonce = (token.Nonce.$value || token.Nonce);
                var created = token.Created;
                var onvif_username = _this.config.Username;
                var onvif_password = _this.config.Password;
                var crypto = require('crypto');
                var pwHash = crypto.createHash('sha1');
                var rawNonce = new Buffer(nonce || '', 'base64');
                var combined_data = Buffer.concat([rawNonce,
                    Buffer.from(created, 'ascii'), Buffer.from(onvif_password, 'ascii')]);
                pwHash.update(combined_data);
                var generated_password = pwHash.digest('base64');
                var password_ok = (user === onvif_username && password === generated_password);
                if (password_ok == false) {
                    utils.log.info('Invalid username/password with ' + methodName);
                    throw NOT_IMPLEMENTED;
                }
            }
            ;
        });
        this.serviceInstance.on("request", function (request, methodName) {
            utils.log.debug('%s received request %s', _this.constructor.name, methodName);
        });
        this.serviceInstance.log = function (type, data) {
            if (_this.config.logSoapCalls)
                utils.log.debug('%s - Calltype : %s, Data : %s', _this.constructor.name, type, data);
        };
    };
    SoapService.prototype.onStarted = function (callback) {
        if (this.isStarted)
            callback();
        else
            this.startedCallbacks.push(callback);
    };
    SoapService.prototype._started = function () {
        this.isStarted = true;
        for (var _i = 0, _a = this.startedCallbacks; _i < _a.length; _i++) {
            var callback = _a[_i];
            callback();
        }
        this.startedCallbacks = [];
        this.started();
    };
    return SoapService;
}());
module.exports = SoapService;

//# sourceMappingURL=SoapService.js.map
