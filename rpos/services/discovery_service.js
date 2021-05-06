"use strict";
var dgram = require('dgram');
var uuid = require('node-uuid');
var xml2js = require('xml2js');
var utils_1 = require('../lib/utils');
var utils = utils_1.Utils.utils;
var DiscoveryService = (function () {
    function DiscoveryService(config) {
        this.config = config;
    }
    DiscoveryService.prototype.start = function () {
        var _this = this;
        if (process.platform != 'linux') {
            utils.log.info("discovery_service not started (requires linux)");
            return;
        }
        var discover_socket = dgram.createSocket('udp4');
        var reply_socket = dgram.createSocket('udp4');
        discover_socket.on('error', function (err) {
            throw err;
        });
        discover_socket.on('message', function (received_msg, rinfo) {
            utils.log.debug("Discovery received");
            var filtered_msg = received_msg.toString().replace(/xmlns(.*?)=(".*?")/g, '');
            var parseString = xml2js.parseString;
            var strip = xml2js['processors'].stripPrefix;
            parseString(filtered_msg, { tagNameProcessors: [strip] }, function (err, result) {
                var probe_uuid = result['Envelope']['Header'][0]['MessageID'][0];
                var probe_type = "";
                try {
                    probe_type = result['Envelope']['Body'][0]['Probe'][0]['Types'][0];
                }
                catch (err) {
                    probe_type = "";
                }
                if (probe_type === "" || probe_type.indexOf("NetworkVideoTransmitter") > -1) {
                    var reply = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n          <SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://www.w3.org/2003/05/soap-envelope\" xmlns:wsa=\"http://schemas.xmlsoap.org/ws/2004/08/addressing\" xmlns:d=\"http://schemas.xmlsoap.org/ws/2005/04/discovery\" xmlns:dn=\"http://www.onvif.org/ver10/network/wsdl\">\n            <SOAP-ENV:Header>\n              <wsa:MessageID>uuid:" + uuid.v1() + "</wsa:MessageID>\n              <wsa:RelatesTo>" + probe_uuid + "</wsa:RelatesTo>\n              <wsa:To SOAP-ENV:mustUnderstand=\"true\">http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</wsa:To>\n              <wsa:Action SOAP-ENV:mustUnderstand=\"true\">http://schemas.xmlsoap.org/ws/2005/04/discovery/ProbeMatches</wsa:Action>\n              <d:AppSequence SOAP-ENV:mustUnderstand=\"true\" MessageNumber=\"68\" InstanceId=\"1460972484\"/>\n            </SOAP-ENV:Header>\n            <SOAP-ENV:Body>\n              <d:ProbeMatches>\n                <d:ProbeMatch>\n                  <wsa:EndpointReference>\n                    <wsa:Address>urn:uuid:" + utils.uuid5(utils.getIpAddress() + _this.config.ServicePort + _this.config.RTSPPort) + "</wsa:Address>\n                  </wsa:EndpointReference>\n                  <d:Types>dn:NetworkVideoTransmitter</d:Types>\n                  <d:Scopes>onvif://www.onvif.org/type/video_encoder onvif://www.onvif.org/type/ptz onvif://www.onvif.org/hardware/RaspberryPI onvif://www.onvif.org/name/PI onvif://www.onvif.org/location/</d:Scopes>\n                  <d:XAddrs>http://" + utils.getIpAddress() + ":" + _this.config.ServicePort + "/onvif/device_service</d:XAddrs>\n                  <d:MetadataVersion>1</d:MetadataVersion>\n              </d:ProbeMatch>\n              </d:ProbeMatches>\n            </SOAP-ENV:Body>\n          </SOAP-ENV:Envelope>";
                    var reply_bytes = new Buffer(reply);
                    return reply_socket.send(reply_bytes, 0, reply_bytes.length, rinfo.port, rinfo.address);
                }
            });
        });
        discover_socket.bind(3702, '239.255.255.250', function () {
            discover_socket.addMembership('239.255.255.250', utils.getIpAddress());
        });
        utils.log.info("discovery_service started");
    };
    ;
    return DiscoveryService;
}());
module.exports = DiscoveryService;

//# sourceMappingURL=discovery_service.js.map
