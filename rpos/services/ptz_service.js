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
var PTZService = (function (_super) {
    __extends(PTZService, _super);
    function PTZService(config, server, callback, ptz_driver) {
        _super.call(this, config, server);
        this.presetArray = [];
        this.ptz_service = require('./stubs/ptz_service.js').PTZService;
        this.callback = callback;
        this.ptz_driver = ptz_driver;
        this.serviceOptions = {
            path: '/onvif/ptz_service',
            services: this.ptz_service,
            xml: fs.readFileSync('./wsdl/ptz_service.wsdl', 'utf8'),
            wsdlPath: 'wsdl/ptz_service.wsdl',
            onReady: function () { return console.log('ptz_service started'); }
        };
        for (var i = 1; i <= 255; i++) {
            this.presetArray.push({ profileToken: 'profile_token', presetName: '', presetToken: i.toString(), used: false });
        }
        this.extendService();
    }
    PTZService.prototype.leftPad = function (number, targetLength) {
        var output = number + '';
        while (output.length < targetLength) {
            output = '0' + output;
        }
        return output;
    };
    PTZService.prototype.extendService = function () {
        var _this = this;
        var port = this.ptz_service.PTZService.PTZ;
        var node = {
            attributes: {
                token: 'ptz_node_token_0',
                FixedHomePosition: this.ptz_driver.hasFixedHomePosition,
                GeoMove: false
            },
            Name: 'PTZ Node 0',
            SupportedPTZSpaces: {},
            MaximumNumberOfPresets: 255,
            HomeSupported: this.ptz_driver.supportsGoToHome,
            AuxiliaryCommands: ['AUX1on', 'AUX1off', 'AUX2on', 'AUX2off',
                'AUX3on', 'AUX3off', 'AUX4on', 'AUX4off',
                'AUX5on', 'AUX5off', 'AUX6on', 'AUX6off',
                'AUX7on', 'AUX7off', 'AUX8on', 'AUX8off']
        };
        if (this.ptz_driver.supportsAbsolutePTZ) {
            node.SupportedPTZSpaces['AbsolutePanTiltPositionSpace'] = [{
                    URI: 'http://www.onvif.org/ver10/tptz/PanTiltSpaces/PositionGenericSpace',
                    XRange: {
                        Min: -1.0,
                        Max: 1.0
                    },
                    YRange: {
                        Min: -1.0,
                        Max: 1.0
                    }
                }];
        }
        if (this.ptz_driver.supportsRelativePTZ) {
            node.SupportedPTZSpaces['RelativePanTiltTranslationSpace'] = [{
                    URI: 'http://www.onvif.org/ver10/tptz/PanTiltSpaces/TranslationGenericSpace',
                    XRange: {
                        Min: -1.0,
                        Max: 1.0
                    },
                    YRange: {
                        Min: -1.0,
                        Max: 1.0
                    }
                }];
        }
        if (this.ptz_driver.supportsContinuousPTZ) {
            node.SupportedPTZSpaces['ContinuousPanTiltVelocitySpace'] = [{
                    URI: 'http://www.onvif.org/ver10/tptz/PanTiltSpaces/VelocityGenericSpace',
                    XRange: {
                        Min: -1.0,
                        Max: 1.0
                    },
                    YRange: {
                        Min: -1.0,
                        Max: 1.0
                    }
                }];
            node.SupportedPTZSpaces['ContinuousZoomVelocitySpace'] = [{
                    URI: 'http://www.onvif.org/ver10/tptz/ZoomSpaces/VelocityGenericSpace',
                    XRange: {
                        Min: -1.0,
                        Max: 1.0
                    }
                }];
        }
        if (this.ptz_driver.supportsRelativePTZ || this.ptz_driver.supportsAbsolutePTZ) {
            node.SupportedPTZSpaces['PanTiltSpeedSpace'] = [{
                    URI: 'http://www.onvif.org/ver10/tptz/PanTiltSpaces/GenericSpeedSpace',
                    XRange: {
                        Min: 0,
                        Max: 1
                    }
                }];
            node.SupportedPTZSpaces['ZoomSpeedSpace'] = [{
                    URI: 'http://www.onvif.org/ver10/tptz/ZoomSpaces/ZoomGenericSpeedSpace',
                    XRange: {
                        Min: 0,
                        Max: 1
                    }
                }];
        }
        var ptzConfigurationOptions = {
            Spaces: node.SupportedPTZSpaces,
            PTZTimeout: {
                Min: 'PT0S',
                Max: 'PT10S'
            },
        };
        this.ptzConfiguration = {
            attributes: {
                token: "ptz_config_token_0"
            },
            Name: "PTZ Configuration",
            UseCount: 1,
            NodeToken: "ptz_node_token_0",
            DefaultAbsolutePantTiltPositionSpace: 'http://www.onvif.org/ver10/tptz/PanTiltSpaces/PositionGenericSpace',
            DefaultAbsoluteZoomPositionSpace: 'http://www.onvif.org/ver10/tptz/ZoomSpaces/PositionGenericSpace',
            DefaultRelativePanTiltTranslationSpace: 'http://www.onvif.org/ver10/tptz/PanTiltSpaces/TranslationGenericSpace',
            DefaultRelativeZoomTranslationSpace: 'http://www.onvif.org/ver10/tptz/ZoomSpaces/TranslationGenericSpace',
            DefaultContinuousPanTiltVelocitySpace: 'http://www.onvif.org/ver10/tptz/PanTiltSpaces/VelocityGenericSpace',
            DefaultContinuousZoomVelocitySpace: 'http://www.onvif.org/ver10/tptz/ZoomSpaces/VelocityGenericSpace',
            DefaultPTZSpeed: {
                PanTilt: {
                    attributes: {
                        x: 1.0,
                        y: 1.0,
                        space: 'http://www.onvif.org/ver10/tptz/PanTiltSpaces/GenericSpeedSpace'
                    }
                },
                Zoom: {
                    attributes: {
                        x: 1,
                        space: 'http://www.onvif.org/ver10/tptz/ZoomSpaces/ZoomGenericSpeedSpace'
                    }
                }
            },
            DefaultPTZTimeout: 'PT5S'
        };
        port.GetServiceCapabilities = function (args) {
            var GetServiceCapabilitiesResponse = {
                Capabilities: {
                    attributes: {
                        EFlip: false,
                        Reverse: false,
                        GetCompatibleConfigurations: false,
                        MoveStatus: false,
                        StatusPosition: false
                    }
                }
            };
            return GetServiceCapabilitiesResponse;
        };
        port.GetConfigurationOptions = function (args) {
            var GetConfigurationOptionsResponse = { PTZConfigurationOptions: ptzConfigurationOptions };
            return GetConfigurationOptionsResponse;
        };
        port.GetConfiguration = function (args) {
            var GetConfigurationResponse = { PTZConfiguration: _this.ptzConfiguration };
            return GetConfigurationResponse;
        };
        port.GetConfigurations = function (args) {
            var GetConfigurationsResponse = { PTZConfiguration: _this.ptzConfiguration };
            return GetConfigurationsResponse;
        };
        port.GetNode = function (args) {
            var GetNodeResponse = { PTZNode: node };
            return GetNodeResponse;
        };
        port.GetNodes = function (args) {
            var GetNodesResponse = { PTZNode: node };
            return GetNodesResponse;
        };
        port.GetStatus = function (arg) {
            var now = new Date();
            var utc = now.getUTCFullYear() + '-' + _this.leftPad((now.getUTCMonth() + 1), 2) + '-' + _this.leftPad(now.getUTCDate(), 2) + 'T'
                + _this.leftPad(now.getUTCHours(), 2) + ':' + _this.leftPad(now.getUTCMinutes(), 2) + ':' + _this.leftPad(now.getUTCSeconds(), 2) + 'Z';
            var GetStatusResponse = {
                PTZStatus: {
                    UtcTime: utc
                }
            };
            return GetStatusResponse;
        };
        port.SetHomePosition = function (args) {
            if (_this.callback)
                _this.callback('sethome', {});
            var SetHomePositionResponse = {};
            return SetHomePositionResponse;
        };
        port.GotoHomePosition = function (args) {
            if (_this.callback)
                _this.callback('gotohome', {});
            var GotoHomePositionResponse = {};
            return GotoHomePositionResponse;
        };
        var pan = 0;
        var tilt = 0;
        var zoom = 0;
        var timeout = '';
        port.ContinuousMove = function (args) {
            try {
                pan = args.Velocity.PanTilt.attributes.x;
            }
            catch (err) { }
            ;
            try {
                tilt = args.Velocity.PanTilt.attributes.y;
            }
            catch (err) { }
            ;
            try {
                zoom = args.Velocity.Zoom.attributes.x;
            }
            catch (err) { }
            ;
            try {
                timeout = args.Timeout;
            }
            catch (err) { }
            ;
            if (_this.callback)
                _this.callback('ptz', { pan: pan, tilt: tilt, zoom: zoom });
            var ContinuousMoveResponse = {};
            return ContinuousMoveResponse;
        };
        port.AbsoluteMove = function (args) {
            try {
                pan = args.Position.PanTilt.attributes.x;
            }
            catch (err) { }
            ;
            try {
                tilt = args.Position.PanTilt.attributes.y;
            }
            catch (err) { }
            ;
            try {
                zoom = args.Position.Zoom.attributes.x;
            }
            catch (err) { }
            ;
            if (_this.callback)
                _this.callback('absolute-ptz', { pan: pan, tilt: tilt, zoom: zoom });
            var AbsoluteMoveResponse = {};
            return AbsoluteMoveResponse;
        };
        port.RelativeMove = function (args) {
            try {
                pan = args.Translation.PanTilt.attributes.x;
            }
            catch (err) { }
            ;
            try {
                tilt = args.Translation.PanTilt.attributes.y;
            }
            catch (err) { }
            ;
            try {
                zoom = args.Translation.Zoom.attributes.x;
            }
            catch (err) { }
            ;
            if (_this.callback)
                _this.callback('relative-ptz', { pan: pan, tilt: tilt, zoom: zoom });
            var RelativeMoveResponse = {};
            return RelativeMoveResponse;
        };
        port.Stop = function (args) {
            var pan_tilt_stop = false;
            var zoom_stop = false;
            try {
                pan_tilt_stop = args.PanTilt;
            }
            catch (err) { }
            ;
            try {
                zoom_stop = args.Zoom;
            }
            catch (err) { }
            ;
            if (pan_tilt_stop) {
                pan = 0;
                tilt = 0;
            }
            if (zoom_stop) {
                zoom = 0;
            }
            if (_this.callback)
                _this.callback('ptz', { pan: pan, tilt: tilt, zoom: zoom });
            var StopResponse = {};
            return StopResponse;
        };
        port.SendAuxiliaryCommand = function (args) {
            if (_this.callback)
                _this.callback('aux', { name: args.AuxiliaryData });
            var SendAuxiliaryCommandResponse = {
                AuxiliaryResponse: true
            };
            return SendAuxiliaryCommandResponse;
        };
        port.GetPresets = function (args) {
            var GetPresetsResponse = { Preset: [] };
            var matching_profileToken = args.ProfileToken;
            for (var i = 0; i < _this.presetArray.length; i++) {
                if (_this.presetArray[i].profileToken === matching_profileToken
                    && _this.presetArray[i].used == true) {
                    var p = {
                        attributes: {
                            token: _this.presetArray[i].presetToken
                        },
                        Name: _this.presetArray[i].presetName
                    };
                    GetPresetsResponse.Preset.push(p);
                }
            }
            return GetPresetsResponse;
        };
        port.GotoPreset = function (args) {
            var GotoPresetResponse = {};
            var matching_profileToken = args.ProfileToken;
            var matching_presetToken = args.PresetToken;
            for (var i = 0; i < _this.presetArray.length; i++) {
                if (matching_profileToken === _this.presetArray[i].profileToken
                    && matching_presetToken === _this.presetArray[i].presetToken
                    && _this.presetArray[i].used == true) {
                    if (_this.callback)
                        _this.callback('gotopreset', { name: _this.presetArray[i].presetName,
                            value: _this.presetArray[i].presetToken });
                    break;
                }
            }
            return GotoPresetResponse;
        };
        port.RemovePreset = function (args) {
            var RemovePresetResponse = {};
            var matching_profileToken = args.ProfileToken;
            var matching_presetToken = args.PresetToken;
            for (var i = 0; i < _this.presetArray.length; i++) {
                if (matching_profileToken === _this.presetArray[i].profileToken
                    && matching_presetToken === _this.presetArray[i].presetToken) {
                    _this.presetArray[i].used = false;
                    if (_this.callback)
                        _this.callback('clearpreset', { name: _this.presetArray[i].presetName,
                            value: _this.presetArray[i].presetToken });
                    break;
                }
            }
            return RemovePresetResponse;
        };
        port.SetPreset = function (args) {
            var SetPresetResponse;
            var profileToken = args.ProfileToken;
            var presetName = args.PresetName;
            var presetToken = args.PresetToken;
            if (presetToken) {
                for (var i = 0; i < _this.presetArray.length; i++) {
                    if (profileToken === _this.presetArray[i]
                        && presetToken === _this.presetArray[i]) {
                        _this.presetArray[i].presetName = presetName;
                        _this.presetArray[i].used = true;
                        if (_this.callback)
                            _this.callback('setpreset', { name: presetName,
                                value: presetToken });
                        break;
                    }
                    SetPresetResponse = { PresetToken: presetToken };
                    return SetPresetResponse;
                }
            }
            else {
                var special_case_name = false;
                try {
                    var preset_name_value = parseInt(presetName);
                    if (preset_name_value > 0 && preset_name_value < 255) {
                        special_case_name = true;
                    }
                }
                catch (err) {
                }
                if (special_case_name) {
                    if (_this.callback)
                        _this.callback('setpreset', { name: presetName,
                            value: presetName });
                    SetPresetResponse = { PresetToken: presetName };
                    return SetPresetResponse;
                }
                else {
                    var new_presetToken = '';
                    for (var i = 0; i < _this.presetArray.length; i++) {
                        if (profileToken === _this.presetArray[i].profileToken
                            && _this.presetArray[i].used == false) {
                            _this.presetArray[i].presetName = presetName;
                            _this.presetArray[i].used = true;
                            new_presetToken = _this.presetArray[i].presetToken;
                            if (_this.callback)
                                _this.callback('setpreset', { name: presetName,
                                    value: new_presetToken });
                            break;
                        }
                    }
                    SetPresetResponse = { PresetToken: new_presetToken };
                    return SetPresetResponse;
                }
            }
        };
    };
    return PTZService;
}(SoapService));
module.exports = PTZService;

//# sourceMappingURL=ptz_service.js.map
