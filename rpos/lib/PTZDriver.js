"use strict";
var v4l2ctl_1 = require("./v4l2ctl");
var PTZDriver = (function () {
    function PTZDriver(config) {
        var _this = this;
        this.supportsAbsolutePTZ = false;
        this.supportsRelativePTZ = false;
        this.supportsContinuousPTZ = false;
        this.supportsGoToHome = false;
        this.hasFixedHomePosition = true;
        this.process_ptz_command = function (command, data) {
            if (command === 'gotohome') {
                console.log("Goto Home");
                if (_this.pelcod)
                    _this.pelcod.sendGotoPreset(1);
                if (_this.visca) {
                    var data_1 = [];
                    data_1.push(0x81, 0x01, 0x06, 0x04, 0xff);
                    _this.stream.write(new Buffer(data_1));
                }
                if (_this.pan_tilt_hat) {
                    _this.pan_tilt_hat.goto_home();
                }
            }
            else if (command === 'sethome') {
                console.log("SetHome ");
                if (_this.pelcod)
                    _this.pelcod.sendSetPreset(1);
            }
            else if (command === 'gotopreset') {
                console.log("Goto Preset " + data.name + ' / ' + data.value);
                if (_this.tenx)
                    _this.tenx.fire();
                if (_this.pelcod)
                    _this.pelcod.sendGotoPreset(parseInt(data.value));
            }
            else if (command === 'setpreset') {
                console.log("Set Preset " + data.name + ' / ' + data.value);
                if (_this.pelcod)
                    _this.pelcod.sendSetPreset(parseInt(data.value));
            }
            else if (command === 'clearpreset') {
                console.log("Clear Preset " + data.name + ' / ' + data.value);
                if (_this.pelcod)
                    _this.pelcod.sendClearPreset(parseInt(data.value));
            }
            else if (command === 'aux') {
                console.log("Aux " + data.name);
                if (_this.pelcod) {
                    if (data.name === 'AUX1on')
                        _this.pelcod.sendSetAux(1);
                    if (data.name === 'AUX1off')
                        _this.pelcod.sendClearAux(1);
                    if (data.name === 'AUX2on')
                        _this.pelcod.sendSetAux(2);
                    if (data.name === 'AUX2off')
                        _this.pelcod.sendClearAux(2);
                    if (data.name === 'AUX3on')
                        _this.pelcod.sendSetAux(3);
                    if (data.name === 'AUX3off')
                        _this.pelcod.sendClearAux(3);
                    if (data.name === 'AUX4on')
                        _this.pelcod.sendSetAux(4);
                    if (data.name === 'AUX4off')
                        _this.pelcod.sendClearAux(4);
                    if (data.name === 'AUX5on')
                        _this.pelcod.sendSetAux(5);
                    if (data.name === 'AUX5off')
                        _this.pelcod.sendClearAux(5);
                    if (data.name === 'AUX6on')
                        _this.pelcod.sendSetAux(6);
                    if (data.name === 'AUX6off')
                        _this.pelcod.sendClearAux(6);
                    if (data.name === 'AUX7on')
                        _this.pelcod.sendSetAux(7);
                    if (data.name === 'AUX7off')
                        _this.pelcod.sendClearAux(7);
                    if (data.name === 'AUX8on')
                        _this.pelcod.sendSetAux(8);
                    if (data.name === 'AUX8off')
                        _this.pelcod.sendClearAux(8);
                }
            }
            else if (command === 'relayactive') {
                console.log("Relay Active " + data.name);
            }
            else if (command === 'relayinactive') {
                console.log("Relay Inactive " + data.name);
            }
            else if (command === 'ptz') {
                console.log("Continuous PTZ " + data.pan + ' ' + data.tilt + ' ' + data.zoom);
                var p = 0.0;
                var t = 0.0;
                var z = 0.0;
                try {
                    p = parseFloat(data.pan);
                }
                catch (err) { }
                try {
                    t = parseFloat(data.tilt);
                }
                catch (err) { }
                try {
                    z = parseFloat(data.zoom);
                }
                catch (err) { }
                if (_this.tenx) {
                    if (p < -0.1 && t > 0.1)
                        _this.tenx.upleft();
                    else if (p > 0.1 && t > 0.1)
                        _this.tenx.upright();
                    else if (p < -0.1 && t < -0.1)
                        _this.tenx.downleft();
                    else if (p > 0.1 && t < -0.1)
                        _this.tenx.downright();
                    else if (p > 0.1)
                        _this.tenx.right();
                    else if (p < -0.1)
                        _this.tenx.left();
                    else if (t > 0.1)
                        _this.tenx.up();
                    else if (t < -0.1)
                        _this.tenx.down();
                    else
                        _this.tenx.stop();
                }
                if (_this.pelcod) {
                    _this.pelcod.up(false).down(false).left(false).right(false);
                    if (p < 0 && t > 0)
                        _this.pelcod.up(true).left(true);
                    else if (p > 0 && t > 0)
                        _this.pelcod.up(true).right(true);
                    else if (p < 0 && t < 0)
                        _this.pelcod.down(true).left(true);
                    else if (p > 0 && t < 0)
                        _this.pelcod.down(true).right(true);
                    else if (p > 0)
                        _this.pelcod.right(true);
                    else if (p < 0)
                        _this.pelcod.left(true);
                    else if (t > 0)
                        _this.pelcod.up(true);
                    else if (t < 0)
                        _this.pelcod.down(true);
                    var pan_speed = Math.round(Math.abs(p) * 63.0);
                    var tilt_speed = Math.round(Math.abs(t) * 63.0);
                    _this.pelcod.setPanSpeed(pan_speed);
                    _this.pelcod.setTiltSpeed(tilt_speed);
                    _this.pelcod.zoomIn(false).zoomOut(false);
                    if (z > 0)
                        _this.pelcod.zoomIn(true);
                    if (z < 0)
                        _this.pelcod.zoomOut(true);
                    var abs_z = Math.abs(z);
                    var zoom_speed = 0;
                    if (abs_z > 0.75)
                        zoom_speed = 3;
                    else if (abs_z > 0.5)
                        zoom_speed = 2;
                    else if (abs_z > 0.25)
                        zoom_speed = 1;
                    else
                        zoom_speed = 0;
                    try {
                        if (z != 0)
                            _this.pelcod.sendSetZoomSpeed(zoom_speed);
                    }
                    catch (err) { }
                    _this.pelcod.send();
                }
                if (_this.visca) {
                    var visca_pan_speed = (Math.abs(p) * 0x18) / 1.0;
                    var visca_tilt_speed = (Math.abs(t) * 0x18) / 1.0;
                    var visca_zoom_speed = (Math.abs(z) * 0x07) / 1.0;
                    if (visca_pan_speed === 0)
                        visca_pan_speed = 1;
                    if (visca_tilt_speed === 0)
                        visca_tilt_speed = 1;
                    if (_this.config.PTZDriver === 'visca') {
                        var data_2 = [];
                        if (p < 0 && t > 0) {
                            data_2.push(0x81, 0x01, 0x06, 0x01, visca_pan_speed, visca_zoom_speed, 0x01, 0x01, 0xff);
                        }
                        else if (p > 0 && t > 0) {
                            data_2.push(0x81, 0x01, 0x06, 0x01, visca_pan_speed, visca_zoom_speed, 0x02, 0x01, 0xff);
                        }
                        else if (p < 0 && t < 0) {
                            data_2.push(0x81, 0x01, 0x06, 0x01, visca_pan_speed, visca_zoom_speed, 0x01, 0x02, 0xff);
                        }
                        else if (p > 0 && t < 0) {
                            data_2.push(0x81, 0x01, 0x06, 0x01, visca_pan_speed, visca_zoom_speed, 0x02, 0x02, 0xff);
                        }
                        else if (p > 0) {
                            data_2.push(0x81, 0x01, 0x06, 0x01, visca_pan_speed, 0x00, 0x02, 0x03, 0xff);
                        }
                        else if (p < 0) {
                            data_2.push(0x81, 0x01, 0x06, 0x01, visca_pan_speed, 0x00, 0x01, 0x03, 0xff);
                        }
                        else if (t > 0) {
                            data_2.push(0x81, 0x01, 0x06, 0x01, 0x00, visca_tilt_speed, 0x03, 0x01, 0xff);
                        }
                        else if (t < 0) {
                            data_2.push(0x81, 0x01, 0x06, 0x01, 0x00, visca_tilt_speed, 0x03, 0x02, 0xff);
                        }
                        else {
                            data_2.push(0x81, 0x01, 0x06, 0x01, 0x00, 0x00, 0x03, 0x03, 0xff);
                        }
                        if (z < 0) {
                            data_2.push(0x81, 0x01, 0x04, 0x07, (0x30 + visca_zoom_speed), 0xff);
                        }
                        else if (z > 0) {
                            data_2.push(0x81, 0x01, 0x04, 0x07, (0x20 + visca_zoom_speed), 0xff);
                        }
                        else {
                            data_2.push(0x81, 0x01, 0x04, 0x07, 0x00, 0xff);
                        }
                        _this.stream.write(new Buffer(data_2));
                    }
                }
                if (_this.pan_tilt_hat) {
                    var pan_speed_1 = (Math.abs(p) * 15) / 1.0;
                    var tilt_speed_1 = (Math.abs(t) * 15) / 1.0;
                    if (pan_speed_1 > 15)
                        pan_speed_1 = 15;
                    if (tilt_speed_1 > 15)
                        tilt_speed_1 = 15;
                    if (pan_speed_1 < 0)
                        pan_speed_1 = 0;
                    if (tilt_speed_1 < 0)
                        tilt_speed_1 = 0;
                    if (p < 0)
                        _this.pan_tilt_hat.pan_left(pan_speed_1);
                    if (p > 0)
                        _this.pan_tilt_hat.pan_right(pan_speed_1);
                    if (p == 0)
                        _this.pan_tilt_hat.pan_right(0);
                    if (t < 0)
                        _this.pan_tilt_hat.tilt_down(tilt_speed_1);
                    if (t > 0)
                        _this.pan_tilt_hat.tilt_up(tilt_speed_1);
                    if (t == 0)
                        _this.pan_tilt_hat.tilt_down(0);
                }
            }
            else if (command === 'absolute-ptz') {
                console.log("Absolute PTZ " + data.pan + ' ' + data.tilt + ' ' + data.zoom);
                var p = 0.0;
                var t = 0.0;
                var z = 0.0;
                try {
                    p = parseFloat(data.pan);
                }
                catch (err) { }
                try {
                    t = parseFloat(data.tilt);
                }
                catch (err) { }
                try {
                    z = parseFloat(data.zoom);
                }
                catch (err) { }
                if (_this.pan_tilt_hat) {
                    var new_pan_angle = p * 90.0;
                    _this.pan_tilt_hat.pan(Math.round(new_pan_angle));
                    var new_tilt_angle = t * 80.0;
                    _this.pan_tilt_hat.tilt(Math.round(new_tilt_angle));
                }
            }
            else if (command === 'relative-ptz') {
                console.log("Relative PTZ " + data.pan + ' ' + data.tilt + ' ' + data.zoom);
                var p = 0.0;
                var t = 0.0;
                var z = 0.0;
                try {
                    p = parseFloat(data.pan);
                }
                catch (err) { }
                try {
                    t = parseFloat(data.tilt);
                }
                catch (err) { }
                try {
                    z = parseFloat(data.zoom);
                }
                catch (err) { }
                if (_this.pan_tilt_hat) {
                    var pan_degrees = p * 90.0;
                    var new_pan_angle = _this.pan_tilt_hat.pan_position - pan_degrees;
                    _this.pan_tilt_hat.pan(Math.round(new_pan_angle));
                    var tilt_degrees = t * 80.0;
                    var new_tilt_angle = _this.pan_tilt_hat.tilt_position - tilt_degrees;
                    _this.pan_tilt_hat.tilt(Math.round(new_tilt_angle));
                }
            }
            else if (command === 'brightness') {
                console.log("Set Brightness " + data.value);
                v4l2ctl_1.v4l2ctl.SetBrightness(data.value);
            }
            else if (command === 'focus') {
                console.log("Focus " + data.value);
                if (_this.pelcod) {
                    if (data.value < 0)
                        _this.pelcod.focusNear(true);
                    else if (data.value > 0)
                        _this.pelcod.focusFar(true);
                    else {
                        _this.pelcod.focusNear(false);
                        _this.pelcod.focusFar(false);
                    }
                    _this.pelcod.send();
                }
            }
            else if (command === 'focusstop') {
                console.log("Focus Stop");
                if (_this.pelcod) {
                    _this.pelcod.focusNear(false);
                    _this.pelcod.focusFar(false);
                    _this.pelcod.send();
                }
            }
            else {
                if (!data.value) {
                    console.log("Unhandled PTZ/Imaging Command Received: " + command);
                }
                else {
                    console.log("Unhandled PTZ/Imaging Command Received: " + command + ' Value:' + data.value);
                }
            }
        };
        this.config = config;
        var parent = this;
        var PTZOutput = config.PTZOutput;
        if (config.PTZDriver === 'tenx') {
            PTZOutput = 'none';
        }
        if (config.PTZDriver === 'pan-tilt-hat') {
            PTZOutput = 'none';
        }
        if (config.PTZDriver === 'tenx') {
            var TenxDriver = require('./tenx_driver');
            this.tenx = new TenxDriver();
            this.tenx.open();
            this.supportsContinuousPTZ = true;
        }
        if (config.PTZDriver === 'pan-tilt-hat') {
            var PanTiltHAT = require('pan-tilt-hat');
            this.pan_tilt_hat = new PanTiltHAT();
            this.supportsAbsolutePTZ = true;
            this.supportsRelativePTZ = true;
            this.supportsContinuousPTZ = true;
            this.supportsGoToHome = true;
        }
        if (config.PTZDriver === 'pelcod') {
            this.supportsContinuousPTZ = true;
            this.supportsGoToHome = true;
            this.hasFixedHomePosition = false;
        }
        if (config.PTZDriver === 'visca') {
            this.supportsContinuousPTZ = true;
            this.supportsGoToHome = true;
        }
        if (PTZOutput === 'serial') {
            var SerialPort = require('serialport');
            this.serialPort = new SerialPort(config.PTZSerialPort, {
                baudRate: config.PTZSerialPortSettings.baudRate,
                parity: config.PTZSerialPortSettings.parity,
                dataBits: config.PTZSerialPortSettings.dataBits,
                stopBits: config.PTZSerialPortSettings.stopBits,
            });
            this.stream = this.serialPort.on("open", function (err) {
                if (err) {
                    console.log('Error: ' + err);
                    return;
                }
                else {
                    if (parent.config.PTZDriver === 'pelcod') {
                        var PelcoD = require('node-pelcod');
                        parent.pelcod = new PelcoD(parent.stream);
                        parent.pelcod.setAddress(parent.config.PTZCameraAddress);
                    }
                    if (parent.config.PTZDriver === 'visca') {
                        parent.visca = true;
                    }
                }
            });
        }
        if (PTZOutput === 'tcp') {
            var net = require('net');
            this.stream = new net.Socket();
            var host_1 = config.PTZOutputURL.split(':')[0];
            var port_1 = config.PTZOutputURL.split(':')[1];
            this.stream.on('data', function (data) {
                console.log('PTZ Driver received socket data ' + data);
            });
            this.stream.on('close', function () {
                console.log('PTZ Driver - Socket closed');
            });
            this.stream.on('error', function () {
                console.log('PTZ Driver - Socket error');
            });
            console.log('PTZ Driver connecting to ' + host_1 + ':' + port_1);
            this.stream.connect(port_1, host_1, function () {
                console.log('PTZ Driver connected to ' + host_1 + ':' + port_1);
                if (parent.config.PTZDriver === 'pelcod') {
                    var PelcoD = require('node-pelcod');
                    console.log(parent.stream);
                    parent.pelcod = new PelcoD(parent.stream);
                    parent.pelcod.setAddress(parent.config.PTZCameraAddress);
                }
                if (parent.config.PTZDriver === 'visca') {
                    parent.visca = true;
                }
            });
        }
    }
    return PTZDriver;
}());
module.exports = PTZDriver;

//# sourceMappingURL=PTZDriver.js.map
