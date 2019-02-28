import mqtt from 'mqtt';
import fs from 'fs';
import net from 'net';
import mqttConnection from 'mqtt-connection';

import { createJWT } from './utils';

import GatewayClientConnection from '../lib/gateway-client-connection';


const KEY_FILE = './keys/rsa_private.pem';
const ALGORITHM = 'RS256';
const PROJECT_ID = 'ota-iot-231619';
const REGION_ID = 'us-central1';
const REGISTRY_ID = 'OTA-DeviceRegistry';
const GATEWAY_ID = 'paul';

export default class Gateway {
  private clientConnections: {[deviceId: string]: GatewayClientConnection} = {};

  constructor(){
    this.initMQTTServer();
    this.connectToIoTCore();
  }

  connectToIoTCore(){
    // make single connection with IoT Core
    const iotCoreConnection = mqtt.connect({
      host: 'mqtt.googleapis.com',
      port: 8883,
      username: 'unused',
      password: createJWT(PROJECT_ID, KEY_FILE, ALGORITHM),
      clientId: `projects/${PROJECT_ID}/locations/${REGION_ID}/registries/${REGISTRY_ID}/devices/${GATEWAY_ID}`,
      protocol: 'mqtts',
      secureProtocol: 'TLSv1_2_method',
    });

    // bind handlers
    iotCoreConnection.on('error', onIoTCoreError.bind(this));
    iotCoreConnection.on('connect', onIoTCoreConnect.bind(this));
    iotCoreConnection.on('message', onIoTCoreMessage.bind(this));
    iotCoreConnection.on('close', onIoTCoreClose.bind(this));

    function onIoTCoreConnect(connackPacket) {
      console.debug({ packet: connackPacket }, 'CONNACK from IoT Core');
      // subscriptions
      iotCoreConnection.subscribe('/devices/' + GATEWAY_ID + '/config');
      iotCoreConnection.subscribe('/devices/' + GATEWAY_ID + '/commands/#');
      iotCoreConnection.subscribe('/devices/' + GATEWAY_ID + '/errors');
    }

    function onIoTCoreMessage(topic, message, publishPacket) {
      // TODO: Routing to individual device connections

      const topicParts = topic.split('/');
      const [, deviceId, subtopic] = topicParts;
      this.clientConnections[deviceId].publish(message);

      console.debug({ packet: publishPacket }, 'IoT Core broker sent message to device');
    }

    // handled in 'connack' event to inform the device about the error
    // use this method to inform the proxy
    function onIoTCoreError(err) {
      console.warn({ err }, 'IoT Core error');
    }

    function onIoTCoreClose() {
      // TODO: close connections with edge devices on local broker
      console.debug('IoT Core connection closed');
    }


  }

  initMQTTServer(){
    const mqttServer = new net.Server();

    mqttServer.on('connection', function (stream) {
      try {
        const deviceConnection = mqttConnection(stream);
        this.clientConnections['testID'] = new GatewayClientConnection(deviceConnection);
      } catch (err) {
        console.error({ err });
      }
    })

    // listen on port 1883
    mqttServer.listen(1883, (err: Error) => {
      if (err) {
        console.error({ err }, 'Couldn\'t start MQTT server');
      } else {
        console.info('MQTT server started');
      }

    });
  }
}


