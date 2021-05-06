"use strict";
var utils_1 = require('./utils');
var fs = require('fs');
var parser = require('body-parser');
var v4l2ctl_1 = require('./v4l2ctl');
var utils = utils_1.Utils.utils;
var Camera = (function () {
    function Camera(config, webserver) {
        var _this = this;
        this.options = {
            resolutions: [
                { Width: 640, Height: 480 },
                { Width: 800, Height: 600 },
                { Width: 1024, Height: 768 },
                { Width: 1280, Height: 1024 },
                { Width: 1280, Height: 720 },
                { Width: 1640, Height: 1232 },
                { Width: 1920, Height: 1080 }
            ],
            framerates: [2, 5, 10, 15, 25, 30],
            bitrates: [
                250,
                500,
                1000,
                2500,
                5000,
                7500,
                10000,
                12500,
                15000,
                17500
            ]
        };
        this.settings = {
            forceGop: true,
            resolution: { Width: 1280, Height: 720 },
            framerate: 25,
        };
        this.config = config;
        this.rtspServer = null;
        this.webserver = webserver;
        this.setupWebserver();
        this.setupCamera();
        v4l2ctl_1.v4l2ctl.ReadControls();
        utils.cleanup(function () {
            _this.stopRtsp();
            var stop = new Date().getTime() + 2000;
            while (new Date().getTime() < stop) {
                ;
            }
        });
        if (this.config.RTSPServer == 1)
            fs.chmodSync("./bin/rtspServer", "0755");
    }
    Camera.prototype.setupWebserver = function () {
        var _this = this;
        utils.log.info("Starting camera settings webserver on http://%s:%s/", utils.getIpAddress(), this.config.ServicePort);
        this.webserver.use(parser.urlencoded({ extended: true }));
        this.webserver.engine('ntl', function (filePath, options, callback) {
            _this.getSettingsPage(filePath, callback);
        });
        this.webserver.set('views', './views');
        this.webserver.set('view engine', 'ntl');
        this.webserver.get('/', function (req, res) {
            res.render('camera', {});
        });
        this.webserver.post('/', function (req, res) {
            for (var par in req.body) {
                var g = par.split('.')[0];
                var p = par.split('.')[1];
                if (p && g) {
                    var prop = v4l2ctl_1.v4l2ctl.Controls[g][p];
                    var val = req.body[par];
                    if (val instanceof Array)
                        val = val.pop();
                    prop.value = val;
                    if (prop.isDirty) {
                        utils.log.debug("Property %s changed to %s", par, prop.value);
                    }
                }
            }
            v4l2ctl_1.v4l2ctl.ApplyControls();
            res.render('camera', {});
        });
    };
    Camera.prototype.getSettingsPage = function (filePath, callback) {
        var _this = this;
        v4l2ctl_1.v4l2ctl.ReadControls();
        fs.readFile(filePath, function (err, content) {
            if (err)
                return callback(new Error(err.message));
            var html = "<h1>RPOS - ONVIF NVT Camera</h1>";
            html += "<b>Video Stream:</b> rtsp://username:password@deviceIPaddress:" + _this.config.RTSPPort.toString() + "/" + _this.config.RTSPName.toString();
            html += "<br>";
            var rendered = content.toString().replace('{{row}}', html);
            return callback(null, rendered);
        });
    };
    Camera.prototype.loadDriver = function () {
        try {
            utils.execSync("sudo modprobe bcm2835-v4l2");
        }
        catch (err) { }
    };
    Camera.prototype.unloadDriver = function () {
        try {
            utils.execSync("sudo modprobe -r bcm2835-v4l2");
        }
        catch (err) { }
    };
    Camera.prototype.setupCamera = function () {
        v4l2ctl_1.v4l2ctl.SetPixelFormat(v4l2ctl_1.v4l2ctl.Pixelformat.H264);
        v4l2ctl_1.v4l2ctl.SetResolution(this.settings.resolution);
        v4l2ctl_1.v4l2ctl.SetFrameRate(this.settings.framerate);
        v4l2ctl_1.v4l2ctl.SetPriority(v4l2ctl_1.v4l2ctl.ProcessPriority.record);
        v4l2ctl_1.v4l2ctl.ReadFromFile();
        v4l2ctl_1.v4l2ctl.ApplyControls();
    };
    Camera.prototype.setSettings = function (newsettings) {
        v4l2ctl_1.v4l2ctl.SetResolution(newsettings.resolution);
        v4l2ctl_1.v4l2ctl.SetFrameRate(newsettings.framerate);
        v4l2ctl_1.v4l2ctl.Controls.CodecControls.video_bitrate.value = newsettings.bitrate * 1000;
        v4l2ctl_1.v4l2ctl.Controls.CodecControls.video_bitrate_mode.value = newsettings.quality > 0 ? 0 : 1;
        v4l2ctl_1.v4l2ctl.Controls.CodecControls.h264_i_frame_period.value = this.settings.forceGop ? v4l2ctl_1.v4l2ctl.Controls.CodecControls.h264_i_frame_period.value : newsettings.gop;
        v4l2ctl_1.v4l2ctl.ApplyControls();
    };
    Camera.prototype.startRtsp = function () {
        if (this.rtspServer) {
            utils.log.warn("Cannot start rtspServer, already running");
            return;
        }
        
        utils.log.info("\n============================\n");
        utils.log.info("Camera is online!");
        utils.log.info("You can access stream: rtsp://<usernameInConfig>:<passwordInConfig>@%s:8554/onvif1", utils.getIpAddress());
        utils.log.info("If it is the first time you run this camera, navigate to\n \
        %s:8080/super - Login to super user, create user account there.", utils.getIpAddress())
        utils.log.info("Go to Shinobi NVR %s:8080 and login with user credentials,", utils.getIpAddress())
        utils.log.info("Load shinobiCameraSettings.json into: \n \
        \t - [+ Add Camera]\n \
        \t - [Options]\n \
        \t - [Options]\n\
        \t - [Load JSON]\n \
        \t - [Import]\n")
        utils.log.info("Alternatively to make Pan-Tilt-Zoom software works, please add to your NVR URLs written below:");
        utils.log.info("Navigate to Control Settings of Camera");
        utils.log.info("Into IP address for control: http://%s:8081/", utils.getIpAddress());
        utils.log.info("Choose GET Request Control");
        utils.log.info("Home/Center Position: /center");
        utils.log.info("Left Move: /left");
        utils.log.info("Right Move: /right");
        utils.log.info("Upwards Move: /up");
        utils.log.info("Down Move: /down");
        utils.log.info("Zoom-In Move: /zoom-in");
        utils.log.info("Zoom-Out Move: /zoom-out");
        utils.log.info("\n============================\n");
        
        this.rtspServer = utils.spawn("./python/gst-rtsp-launch.sh", [""]);
        global.pythonOutput = this.rtspServer;

        if (this.rtspServer) {
            this.rtspServer.stdout.on('data', function (data) { return utils.log.debug("rtspServer: %s", data); });
            this.rtspServer.stderr.on('data', function (data) { return utils.log.error("rtspServer: %s", data); });
            this.rtspServer.on('error', function (err) { return utils.log.error("rtspServer error: %s", err); });
            this.rtspServer.on('exit', function (code, signal) {
                if (code)
                    utils.log.error("rtspServer exited with code: %s", code);
                else
                    utils.log.debug("rtspServer exited");
            });
        }
    };
    Camera.prototype.stopRtsp = function () {
        if (this.rtspServer) {
            utils.log.info("Stopping Camera...");
            utils.log.info("Camera is offline!");
            this.rtspServer.kill();
            this.rtspServer = null;
        }
    };
    return Camera;
}());
module.exports = Camera;
