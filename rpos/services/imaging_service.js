"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var fs = require("fs");
var SoapService = require('../lib/SoapService');
var utils_1 = require('../lib/utils');
var utils = utils_1.Utils.utils;
var ImagingService = (function (_super) {
    __extends(ImagingService, _super);
    function ImagingService(config, server, callback) {
        _super.call(this, config, server);
        this.brightness = 0;
        this.autoFocusMode = '';
        this.focusNearLimit = 0;
        this.focusFarLimit = 0;
        this.focusDefaultSpeed = 0;
        this.imaging_service = require('./stubs/imaging_service.js').ImagingService;
        this.callback = callback;
        this.serviceOptions = {
            path: '/onvif/imaging_service',
            services: this.imaging_service,
            xml: fs.readFileSync('./wsdl/imaging_service.wsdl', 'utf8'),
            wsdlPath: 'wsdl/imaging_service.wsdl',
            onReady: function () { return console.log('imaging_service started'); }
        };
        this.brightness = 50;
        this.autoFocusMode = "MANUAL";
        this.focusDefaultSpeed = 0.5;
        this.focusNearLimit = 1.0;
        this.focusFarLimit = 0.0;
        this.extendService();
    }
    ImagingService.prototype.extendService = function () {
        var _this = this;
        var port = this.imaging_service.ImagingService.Imaging;
        port.GetServiceCapabilities = function (args) {
            var GetServiceCapabilitiesResponse = {
                Capabilities: {
                    attributes: {
                        ImageStabilization: false,
                        Presets: false
                    }
                }
            };
            return GetServiceCapabilitiesResponse;
        };
        port.GetOptions = function (args) {
            var GetOptionsResponse = {
                ImagingOptions: {
                    Brightness: {
                        Min: 0,
                        Max: 100
                    },
                    Focus: {
                        AutoFocusModes: ['AUTO', 'MANUAL'],
                        DefaultSpeed: {
                            Min: 0.1,
                            Max: 1.0
                        },
                        NearLimit: {
                            Min: 0.1,
                            Max: 3.0
                        },
                        FarLimit: {
                            Min: 0.0,
                            Max: 0.0
                        },
                    }
                }
            };
            return GetOptionsResponse;
        },
            port.GetImagingSettings = function (args) {
                var GetImagingSettingsResponse = {
                    ImagingSettings: {
                        Brightness: _this.brightness,
                        Focus: {
                            AutoFocusMode: _this.autoFocusMode,
                            DefaultSpeed: _this.focusDefaultSpeed,
                            NearLimit: _this.focusNearLimit,
                            FarLimit: _this.focusFarLimit,
                        },
                    }
                };
                return GetImagingSettingsResponse;
            };
        port.SetImagingSettings = function (args) {
            var SetImagingSettingsResponse = {};
            if (args.ImagingSettings) {
                if (args.ImagingSettings.Brightness) {
                    _this.brightness = args.ImagingSettings.Brightness;
                    if (_this.callback)
                        _this.callback('brightness', { value: _this.brightness });
                }
                if (args.ImagingSettings.Focus) {
                    if (args.ImagingSettings.Focus.AutoFocusMode) {
                        _this.autoFocusMode = args.ImagingSettings.Focus.AutoFocusMode;
                        if (_this.callback)
                            _this.callback('focusmode', { value: _this.autoFocusMode });
                    }
                    if (args.ImagingSettings.Focus.DefaultSpeed) {
                        _this.focusDefaultSpeed = args.ImagingSettings.Focus.DefaultSpeed;
                        if (_this.callback)
                            _this.callback('focusdefaultspeed', { value: _this.focusDefaultSpeed });
                    }
                    if (args.ImagingSettings.Focus.NearLimit) {
                        _this.focusNearLimit = args.ImagingSettings.Focus.NearLimit;
                        if (_this.callback)
                            _this.callback('focusnearlimit', { value: _this.focusNearLimit });
                    }
                    if (args.ImagingSettings.Focus.FarLimit) {
                        _this.focusFarLimit = args.ImagingSettings.Focus.FarLimit;
                        if (_this.callback)
                            _this.callback('focusfarlimit', { value: _this.focusFarLimit });
                    }
                }
            }
            return SetImagingSettingsResponse;
        };
        port.Move = function (args) {
            var MoveResponse = {};
            if (args.Focus) {
                if (args.Focus.Continuous) {
                    if (_this.callback)
                        _this.callback('focus', { value: args.Focus.Continuous.Speed });
                }
            }
            return MoveResponse;
        };
        port.GetMoveOptions = function (args) {
            var GetMoveOptionsResponse = {
                MoveOptions: {
                    Continuous: {
                        Speed: {
                            Min: -1.0,
                            Max: 1.0
                        }
                    }
                }
            };
            return GetMoveOptionsResponse;
        };
        port.Stop = function (args) {
            var StopResponse = {};
            if (_this.callback)
                _this.callback('focusstop', {});
            return StopResponse;
        };
        port.GetStatus = function (args) {
            var GetStatusResponse = {
                Status: {
                    FocusStatus20: {
                        Position: 5.0,
                        MoveStatus: 'UNKNOWN',
                    },
                }
            };
            return GetStatusResponse;
        };
    };
    return ImagingService;
}(SoapService));
module.exports = ImagingService;

//# sourceMappingURL=imaging_service.js.map
