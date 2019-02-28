import mqtt from 'mqtt';
import fs from 'fs';
import net from 'net';
import mqttConnection from 'mqtt-connection';

import { createJWT } from './utils';


export default class GatewayClientConnection {
  // TCP Stream wrapper between gateway server and end device
  private deviceConnection: mqttConnection;

  // TCP Stream wrapper between gateway and IoT Core
  private iotCoreConnection: mqtt.Client;

  private deviceId: string;

  constructor(deviceConnection: mqttConnection, iotCoreConnection: mqtt.Client) {
    this.deviceConnection = deviceConnection;
    this.iotCoreConnection = iotCoreConnection;

    this.deviceId = '';

    // Bind handlers that don't require a mqtt connection right away
    this.deviceConnection.on('connect', this.onDeviceConnect.bind(this));
    this.deviceConnection.on('disconnect', this.onDeviceDisconnect.bind(this));
    this.deviceConnection.on('close', this.onDeviceClose.bind(this));
    this.deviceConnection.on('error', this.onDeviceError.bind(this));
  }

  setStreamTimeOut(keepalive: number) {
    // timeout idle streams if keepalive is passed by 5 seconds
    this.deviceConnection.stream.setTimeout(1000 * (keepalive + 5))

    // stream timeout
    this.deviceConnection.stream.on('timeout', () => {
      console.warn('Device stream timed out');
      this.onDeviceClose();
    });

  }

  onDevicePingRequest(pingreqPacket: mqtt.IPingreqPacket) {
    // Respond to ping request from gateway client immediately
    this.deviceConnection.pingresp();
  }

  onDevicePublish(publishPacket: mqtt.IPublishPacket) {
    console.debug({ packet: publishPacket }, 'Device published');

    // Prepend device metadata before gateway publishes to IoT Core
    const topic = `/devices/${this.deviceId}/${publishPacket.topic}`;

    this.iotCoreConnection.publish(topic, publishPacket.payload, (err) => {
        if(err) {
            console.error('error publishing: ' + JSON.stringify(err));
        } else {
            console.debug('Publish successfully sent to IoT Core');
        }
    });
  }

  onDeviceSubscribe(subscribePacket: mqtt.ISubscribePacket) {
    // Transform [{ topic: 'test', qos: 0 }] to { test: 0 }
    let topics = subscribePacket.subscriptions.reduce((accumulator, topicObject) => {
      const name = topicObject.topic;
      const qos = topicObject.qos;
      accumulator[name] = qos;
      return accumulator;
    }, {} as mqtt.ISubscriptionMap);

    console.debug({ packet: subscribePacket }, 'Device requested subscription');

    this.iotCoreConnection.subscribe(topics, (err, granted) => {
      const qos = granted.map((item) => item.qos);

      this.deviceConnection.suback({
        granted: qos,
        messageId: subscribePacket.messageId,
      });

      console.debug({
        messageId: subscribePacket.messageId,
        granted
      }, 'SUBACK sent to device');
    });
  }

  onDeviceConnect(connectPacket: mqtt.IConnectPacket) {
    const { clientId, username, password, will } = connectPacket;

    console.info('Device connection initiated');

    console.debug({ packet: connectPacket }, 'Device sent CONNECT packet');

    if(connectPacket.username){
      this.deviceId = connectPacket.username;
    }
    if(connectPacket.keepalive){
      this.setStreamTimeOut(connectPacket.keepalive);
    }

    this.attachDevice(err => {
        if (!err) {
          console.log('Got PUBACK from IoT Core on attach control message');
          this.deviceConnection.connack({ returnCode: 0 });
        } else {
          console.error(err);
        }
      });

    // Bind handlers that require the mqtt client after the connection is successfully started
    this.deviceConnection.on('subscribe', this.onDeviceSubscribe.bind(this));
    this.deviceConnection.on('publish', this.onDevicePublish.bind(this));
    this.deviceConnection.on('pingreq', this.onDevicePingRequest.bind(this));
    this.deviceConnection.on('unsubscribe', this.onDeviceUnsubscribe.bind(this));


  }

  onDeviceUnsubscribe(unsubscribePacket: mqtt.IUnsubscribePacket) {
    const topics = unsubscribePacket.unsubscriptions;

    console.debug({ packet: unsubscribePacket }, 'Device requested unsubscribe');

    this.iotCoreConnection.unsubscribe(topics, () => {
      this.deviceConnection.unsuback({ messageId: unsubscribePacket.messageId });

      console.debug({ packet: unsubscribePacket }, 'UNSUBACK sent to device');
    });
  }

  onDeviceDisconnect() {
    console.debug('Device connection disconnect');

    this.detachDevice(err => {
        if (!err) {
          console.log('Got PUBACK from IoT Core on detach control message');
        } else {
          console.error(err);
        }
      });
  }

  onDeviceClose() {
    console.debug('Device connection closed');

    this.detachDevice(err => {
        if (!err) {
          console.log('Got PUBACK from IoT Core on detach control message');
        } else {
          console.error(err);
        }
      });
  }

  onDeviceError() {
    console.debug('Device connection error');
  }

  attachDevice(callback: mqtt.PacketCallback) {
    const attachTopic = `/devices/${this.deviceId}/attach`;
    const attachPayload = '{}';

    console.log('Attaching ' + attachTopic);
    // send message on attach topic for gateway
    this.iotCoreConnection.publish(attachTopic, attachPayload, {qos:1}, callback);
  }

  detachDevice(callback: mqtt.PacketCallback) {
    const detachTopic = `/devices/${this.deviceId}/detach`;
    const detachPayload = '{}';

    console.log('Detaching ' + detachTopic);
    // send message on attach topic for gateway
    this.iotCoreConnection.publish(detachTopic, detachPayload, {qos:1}, callback);
  }
}
