"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var os_1 = require('os');
var child_process_1 = require('child_process');
var events_1 = require("events");
var stream_1 = require("stream");
var crypto = require("crypto");
var clc = require('cli-color');
var Utils;
(function (Utils) {
    (function (logLevel) {
        logLevel[logLevel["None"] = 0] = "None";
        logLevel[logLevel["Error"] = 1] = "Error";
        logLevel[logLevel["Warn"] = 2] = "Warn";
        logLevel[logLevel["Info"] = 3] = "Info";
        logLevel[logLevel["Debug"] = 4] = "Debug";
    })(Utils.logLevel || (Utils.logLevel = {}));
    var logLevel = Utils.logLevel;
    var DummyProcess = (function (_super) {
        __extends(DummyProcess, _super);
        function DummyProcess() {
            _super.call(this);
            this.stdin = new stream_1.Writable();
            this.stderr = this.stdout = new DummyReadable();
        }
        DummyProcess.prototype.kill = function (signal) { };
        ;
        DummyProcess.prototype.send = function (message, sendHandle) { };
        ;
        DummyProcess.prototype.disconnect = function () { };
        ;
        DummyProcess.prototype.unref = function () { };
        ;
        return DummyProcess;
    }(events_1.EventEmitter));
    var DummyReadable = (function (_super) {
        __extends(DummyReadable, _super);
        function DummyReadable() {
            _super.apply(this, arguments);
        }
        DummyReadable.prototype.read = function () { return null; };
        return DummyReadable;
    }(stream_1.Readable));
    var utils = (function () {
        function utils() {
        }
        utils.setConfig = function (config) {
            this.config = config;
        };
        utils.getSerial = function () {
            var cpuserial = "0000000000000000";
            try {
                var f = utils.execSync('cat /proc/cpuinfo').toString();
                cpuserial = f.match(/Serial[\t]*: ([0-9a-f]{16})/)[1];
            }
            catch (ex) {
                this.log.error("Failed to read serial : %s", ex.message);
                cpuserial = "ERROR000000000";
            }
            return cpuserial;
        };
        utils.testIpAddress = function () {
            var ip, interfaces = os_1.networkInterfaces();
            for (var _i = 0, _a = this.config.NetworkAdapters; _i < _a.length; _i++) {
                var inf = _a[_i];
                ip = this.getAddress(interfaces[inf], "IPv4");
                if (!ip)
                    utils.log.debug("Read IP address from %s failed", inf);
                else {
                    utils.log.info("Read IP address %s from %s", ip, inf);
                    return;
                }
            }
            utils.log.info("Using IP address from config: %s", this.config.IpAddress);
        };
        utils.getIpAddress = function (type) {
            type = type || "IPv4";
            var interfaces = os_1.networkInterfaces();
            for (var _i = 0, _a = this.config.NetworkAdapters; _i < _a.length; _i++) {
                var inf = _a[_i];
                var ip = this.getAddress(interfaces[inf], type);
                if (ip)
                    return ip;
            }
            return this.config.IpAddress;
        };
        utils.isPi = function () {
            try {
                var f = utils.execSync('cat /proc/device-tree/model').toString();
                if (f.includes('Raspberry Pi'))
                    return true;
            }
            catch (ex) {
                try {
                    var model = require('rpi-version')();
                    if (typeof model != "undefined")
                        return true;
                }
                catch (ex) {
                }
            }
            return false;
        };
        utils.notPi = function () {
            return /^win/.test(process.platform) || /^darwin/.test(process.platform);
        };
        utils.isWindows = function () {
            return /^win/.test(process.platform);
        };
        utils.isLinux = function () {
            return /^linux/.test(process.platform);
        };
        utils.isMac = function () {
            return /^darwin/.test(process.platform);
        };
        utils.execSync = function (cmd) {
            utils.log.debug(["execSync('", cmd, "')"].join(''));
            return utils.notPi() ? "" : require('child_process').execSync(cmd);
        };
        utils.spawn = function (cmd, args, options) {
            utils.log.debug("spawn('" + cmd + "', [" + args.join() + "], " + options + ")");
            if (utils.notPi()) {
                return new DummyProcess();
            }
            else {
                return child_process_1.spawn(cmd, args, options);
            }
        };
        utils.cleanup = function (callback) {
            callback = callback || (function () { });
            process.on('cleanup', callback);
            process.on('exit', function () {
                process.emit('cleanup');
            });
            process.on('SIGINT', function () {
                console.log('Ctrl-C...');
                process.exit(2);
            });
            process.on('uncaughtException', function (e) {
                utils.log.error('Uncaught Exception... : %s', e.stack);
                process.exit(99);
            });
        };
        utils.uuid5 = function (str) {
            var out = crypto.createHash("sha1").update(str).digest();
            out[8] = out[8] & 0x3f | 0xa0;
            out[6] = out[6] & 0x0f | 0x50;
            var hex = out.toString("hex", 0, 16);
            return [
                hex.substring(0, 8),
                hex.substring(8, 12),
                hex.substring(12, 16),
                hex.substring(16, 20),
                hex.substring(20, 32)
            ].join("-");
        };
        utils.getAddress = function (ni, type) {
            ni = ni || [];
            var address = "";
            for (var _i = 0, ni_1 = ni; _i < ni_1.length; _i++) {
                var nif = ni_1[_i];
                if (nif.family == type)
                    address = nif.address;
            }
            return address;
        };
        utils.log = {
            level: logLevel.Error,
            error: function (message) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                if (utils.log.level > logLevel.None) {
                    message = clc.red(message);
                    console.log.apply(this, [message].concat(args));
                }
            },
            warn: function (message) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                if (utils.log.level > logLevel.Error) {
                    message = clc.yellow(message);
                    console.log.apply(this, [message].concat(args));
                }
            },
            info: function (message) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                if (utils.log.level > logLevel.Warn)
                    console.log.apply(this, [message].concat(args));
            },
            debug: function (message) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                if (utils.log.level > logLevel.Info) {
                    message = clc.green(message);
                    console.log.apply(this, [message].concat(args));
                }
            }
        };
        return utils;
    }());
    Utils.utils = utils;
})(Utils = exports.Utils || (exports.Utils = {}));

//# sourceMappingURL=utils.js.map
