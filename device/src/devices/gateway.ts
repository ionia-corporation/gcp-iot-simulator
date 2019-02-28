// import Vorpal from 'vorpal';
// import mqtt, { MqttClient } from 'mqtt';
// import chalk from 'chalk';

// import { DeviceEnviornment } from '../enviornment';
// import { createJWT } from '../lib/utils';

// import net from 'net';
// import * as mqttCon from 'mqtt-connection';
// import Device from './device';

// // bind handlers
// iotCoreConnection.on('error', onIoTCoreError.bind(this));
// iotCoreConnection.on('connect', onIoTCoreConnect.bind(this));
// iotCoreConnection.on('message', onIoTCoreMessage.bind(this));
// iotCoreConnection.on('close', onIoTCoreClose.bind(this));

// function onIoTCoreConnect(connackPacket) {
//     console.debug({ packet: connackPacket }, 'CONNACK from IoT Core');
//     // subscriptions
//     iotCoreConnection.subscribe('/devices/' + GATEWAY_ID + '/config');
//     iotCoreConnection.subscribe('/devices/' + GATEWAY_ID + '/commands/#');
//     iotCoreConnection.subscribe('/devices/' + GATEWAY_ID + '/errors');
// }

// function onIoTCoreMessage(topic, message, publishPacket) {
//     console.debug({ packet: publishPacket }, 'IoT Core broker sent message to device');
// }

// function onIoTCorePingResponse(pingResponsePacket) {
// }

// // handled in 'connack' event to inform the device about the error
// // use this method to inform the proxy
// function onIoTCoreError(err) {
//     console.warn({ err }, 'IoT Core error');
// }

// function onIoTCoreClose() {
//     // TODO: close connections with edge devices on local broker
//     console.debug('IoT Core connection closed');
// }

// class DeviceConnection {
//   private deviceConnection : any;
//   constructor(connection : any) {
//     this.deviceConnection = connection;
//     // Bind handlers that don't require a mqtt connection right away
//     this.deviceConnection.on('connect', this.onDeviceConnect.bind(this));
//     this.deviceConnection.on('disconnect', this.onDeviceDisconnect.bind(this));
//     this.deviceConnection.on('close', this.onDeviceClose.bind(this));
//     this.deviceConnection.on('error', this.onDeviceError.bind(this));    
//   }

//   onDeviceConnect(connectPacket: any) {
//     const { clientId, username, password, will } = connectPacket;

//     console.info('Device connection initiated');

//     console.debug({ packet: connectPacket }, 'Device sent CONNECT packet');

//     const deviceId = connectPacket.username;
//     this.attachDevice(err => {
//         if (!err) {
//           console.log('Got PUBACK from IoT Core on attach control message');
//           deviceConnection.connack({ returnCode: 0 });
//         } else {
//           console.error(err);
//         }
//       });

//     // Bind handlers that require the mqtt client after the connection is successfully started
//     this.deviceConnection.on('subscribe', this.onDeviceSubscribe.bind(this));
//     this.deviceConnection.on('publish', this.onDevicePublish.bind(this));
//     this.deviceConnection.on('unsubscribe', this.onDeviceUnsubscribe.bind(this));

//     this.deviceConnection.stream.setTimeout(1000 * (connectPacket.keepalive + 5))
//     // stream timeout
//     this.deviceConnection.stream.on('timeout', () => {
//       console.warn('Device stream timed out');

//       this.detachDevice(err => {
//         if (!err) {
//           console.log('Got PUBACK from IoT Core on detach control message');
//         } else {
//           console.error(err);
//         }
//       });
//     });
//   }

//   onDeviceDisconnect() {
//     console.debug('Device connection disconnect');

//     this.detachDevice(err => {
//         if (!err) {
//           console.log('Got PUBACK from IoT Core on detach control message');
//         } else {
//           console.error(err);
//         }
//       });
//   }

//   onDeviceClose() {
//     console.debug('Device connection closed');

//     this.detachDevice(err => {
//         if (!err) {
//           console.log('Got PUBACK from IoT Core on detach control message');
//         } else {
//           console.error(err);
//         }
//       });
//   }

//   onDeviceError() {
//     console.debug('Device connection error');
//   }

// }

// export default class Gateway extends Device {
//   // mqtt-proxy server socket
//   private mqttServer : net.Server;

//   constructor(env: DeviceEnviornment, vorpal: Vorpal) {
//     super(env, vorpal);
//     // Connect to IoT Core right away
//     this.connect();

//     // Subscribe to errors topic on top of other device topics
//     this.subscribe('errors', (message) => this.onError(message));

//     // TODO: Start local MQTT broker
//     this.mqttServer = new net.Server();
//     this.mqttServer.on('connection', function (stream : net.Socket) {
//       try {
//         const deviceConnection = new DeviceConnection(mqttCon(stream));
//       } catch (err) {
//         console.error({ err });
//       }
//     });

//     // listen on port 1883
//     this.mqttServer.listen(1883, (err : any) => {
//       if (err) {
//           console.error({ err }, 'Couldn\'t start MQTT server');
//       } else {
//           console.info('MQTT server started');
//       }
//     });
//   }

//   protected onError(message: Buffer) {
//     const error = message.toString('utf8');
//     this.log(chalk.yellow('Received new error message:'));
//     this.log(error);
//   }

//   onDevicePublish(publishPacket) {
//     console.debug({ packet: publishPacket }, 'Device published');

//     iotCoreConnection.publish(`/devices/${this.deviceId}/${publishPacket.topic}`, publishPacket.payload, (err) => {
//         if(err) {
//             console.error('error publishing: ' + JSON.stringify(err));
//         } else {
//             console.debug('Publish successfully sent to IoT Core');
//         }
//     });
//   }

//   onDeviceSubscribe(subscribePacket) {
//     // transform [{ topic: 'test', qos: 0 }] to { test: 0 }
//     let topics = subscribePacket.subscriptions.reduce((accumulator, topicObject) => {
//       const name = topicObject.topic;
//       const qos = topicObject.qos;
//       accumulator[name] = qos;
//       return accumulator;
//     }, {});

//     console.debug({ packet: subscribePacket }, 'Device requested subscription');

//     iotCoreConnection.subscribe(topics, (err, granted) => {
//       const qos = granted.map((item) => item.qos);

//       this.deviceConnection.suback({
//         granted: qos,
//         messageId: subscribePacket.messageId,
//       });

//       console.debug({
//         messageId: subscribePacket.messageId,
//         granted
//       }, 'SUBACK sent to device');
//     });
//   }

//   onDeviceUnsubscribe(unsubscribePacket) {
//     const topics = unsubscribePacket.unsubscriptions;

//     console.debug({ packet: unsubscribePacket }, 'Device requested unsubscribe');

//     iotCoreConnection.unsubscribe(topics, () => {
//       this.deviceConnection.unsuback({ messageId: unsubscribePacket.messageId });

//       console.debug({ packet: unsubscribePacket }, 'UNSUBACK sent to device');
//     });
//   }

//   attachDevice(callback) {
//     const attachTopic = `/devices/${this.deviceId}/attach`;
//     const attachPayload = '{}';

//     console.log('Attaching ' + attachTopic);
//     // send message on attach topic for gateway
//     iotCoreConnection.publish(attachTopic, attachPayload, {qos:1}, callback);
//   }

//   detachDevice(callback) {
//     const detachTopic = `/devices/${this.deviceId}/detach`;
//     const detachPayload = '{}';

//     console.log('Detaching ' + detachTopic);
//     // send message on attach topic for gateway
//     iotCoreConnection.publish(detachTopic, detachPayload, {qos:1}, callback);
//   }
// }

// module.exports = IoTConnection;