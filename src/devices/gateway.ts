import mqtt from 'mqtt';
import Vorpal from 'vorpal';
import fs from 'fs';
import net from 'net';
import mqttConnection from 'mqtt-connection';
import chalk from 'chalk';

import { createJWT } from '../lib/utils';
import GatewayClientConnection from '../lib/gateway-client-connection';

import Device from './device';
import { DeviceEnviornment } from '../enviornment';

export default class Gateway extends Device {
  private clientConnections: GatewayClientConnection[] = [];
  private watchBridge = true;

  constructor(env: DeviceEnviornment, vorpal: Vorpal) {
    super(env, vorpal);

    this.initLocalGateway();
  }

  protected vorpalInit(){
    super.vorpalInit();
    // command to disconnect from MQTT maybe put it in mqttcommands
  }

  protected onConnect(connackPacket: mqtt.IConnackPacket) {
    super.onConnect(connackPacket);

    // Subscribe to special gateway topic for errors
    this.subscribe('errors', this.onIoTCoreApplicationError.bind(this));
  }


  onIoTCoreMessage(topic: string, payload: Buffer, publishPacket: mqtt.IPublishPacket): void {
    const topicParts = topic.split('/');
    const [,, deviceId, subtopic] = topicParts;
    const clientConnection = this.findClient(deviceId);
    if (!clientConnection) {
      return;
    }

    // Send to the child device
    clientConnection.publish(publishPacket);
    this.log({ packet: publishPacket }, 'IoT Core broker sent message to device');
  }

  initLocalGateway() {
    this.initMQTTServer();

    // Bind handlers
    this.mqttClient.on('message', this.onIoTCoreMessage.bind(this));
    this.mqttClient.on('close', this.onIoTCoreClose.bind(this));
  }


  onIoTCoreApplicationError(message: Buffer) {
    this.log(chalk.yellow('Error from IoT Core for Gateway:'));
    this.log(message.toString('utf8'));
  }


  onIoTCoreClose() {
    // TODO: close connections with edge devices on local broker
    this.log('IoT Core connection closed');
  }

  findClient(deviceId: string) {
    // Loop through clients and see if we have one matching the device ID
    return this.clientConnections.find((clientConnection) => {
      return clientConnection.deviceId === deviceId;
    })
  }

  bridgeLogger(...items: any[]){
    if(this.watchBridge){
      this.log(...items);
    }
  }

  initMQTTServer() {
    const mqttServer = new net.Server();

    mqttServer.on('connection', (stream) => {
      try {
        const deviceConnectionMQTT = mqttConnection(stream);
        const gatewayClient = new GatewayClientConnection(deviceConnectionMQTT, this.mqttClient, this.log.bind(this));
        this.clientConnections.push(gatewayClient);
      } catch (err) {
        this.log({ err });
      }
    })

    // listen on port 1883
    mqttServer.listen(1883, (err: Error) => {
      if (err) {
        this.log({ err }, 'Couldn\'t start MQTT server');
      } else {
        this.log(chalk.magenta('MQTT server started'));
      }
    });
  }
}
