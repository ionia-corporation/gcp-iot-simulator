import Vorpal from 'vorpal';
import mqtt, { MqttClient } from 'mqtt';
import chalk from 'chalk';

import { DeviceEnviornment } from '../enviornment';
import { createJWT } from '../lib/utils';

import mqttCommands from '../commands/mqtt';
import jsonTopicCommands from '../commands/json-topic';
import firmwareCommands from '../commands/firmware';
import firmware from '../commands/firmware';

export default class Device {
  protected state: { [key: string]: string } = {};
  protected config: { [key: string]: string } = {};
  protected events: { [key: string]: string } = {};

  protected mqttClient: MqttClient;

  protected env: DeviceEnviornment;
  protected vorpal: Vorpal;

  constructor(env: DeviceEnviornment, vorpal: Vorpal) {
    this.env = env;
    this.vorpal = vorpal;
    this.vorpalInit();

    this.mqttClient = this.connect();
  }

  private vorpalInit(){
    this.vorpal.use(mqttCommands(this));
    this.vorpal.use(jsonTopicCommands(this, 'state'));
    this.vorpal.use(jsonTopicCommands(this, 'events'));
    this.vorpal.use(firmwareCommands(this));
  }

  protected log(message: string) {
    this.vorpal.log(message);
  }

  // Broker bits
  protected connect() {
    // IoT Core specific connection parameters
    const mqttClientId = `projects/${this.env.projectId}/locations/${this.env.region}/registries/${this.env.registryId}/devices/${this.env.deviceId}`;
    const jwt = createJWT(this.env.projectId, this.env.privateKey, this.env.algorithm);

    let connectionArgs = {
      host: 'mqtt.googleapis.com',
      port: 8883,
      clientId: mqttClientId,
      username: 'unused',
      password: jwt,
      protocol: 'mqtts',
      secureProtocol: 'TLSv1_2_method'
    };

    this.log('Attempting connect to IoT Core');
    const client = mqtt.connect(connectionArgs);

    client.on('connect', () => {
      this.log(chalk.green('Connected to MQTT'));
      this.subscribe('config', (message) => this.onConfig(message));
    });

    client.on('error', (e) => {
      this.log(chalk.red('Error in MQTT subscription:'));
      this.log(e.message);
    })

    return client;
  }

  protected onConfig(message: Buffer) {
    try {
      // Assume config is JSON
      this.config = JSON.parse(message.toString('utf8'));
      this.log(chalk.yellow('Received new config:'));
      this.log(JSON.stringify(this.config, null, 2));

      if (this.config['firmware-update']) {
        this.log(chalk.cyan(`New config contains a firmware update. Run ${chalk.bold('firmware set-status msg-received')} to acknowledge`));
      }

    } catch (e) {
      this.log(chalk.yellow('Received non-JSON config: '));
      this.log(message.toString('base64'));
    }

  }

  public subscribe(topic: string, callback: (message: Buffer) => void) {
    const fullTopic = this.wrapTopic(topic);
    this.mqttClient.subscribe(fullTopic, (error, granted) => {
      // If there's an error or we are not granted QoS 0
      if (error || granted[0].qos != 0) {
        // todo: error
      } else {
        // Register a callback function for that topic
        this.mqttClient.on('message', (incomingTopic, message) => {
          if (fullTopic === incomingTopic) {
            callback(message);
          }
        });
      }
    })
  }

  publish(topic: string, message: string | Buffer) {
    const fullTopic = this.wrapTopic(topic);
    this.mqttClient.publish(fullTopic, message, () => {
      // on success do this
    })
  }

  public updateState(key: string, value: string) {
    this.state[key] = value;
    this.publish('state', JSON.stringify(this.state));
    this.log(chalk.blueBright('Published new state: '))
    this.log(JSON.stringify(this.state));
  }

  public updateEvents(key: string, value: string) {
    this.events[key] = value;
    this.publish('events', JSON.stringify(this.events));
    this.log(chalk.blueBright('Published new events: '))
    this.log(JSON.stringify(this.events));
  }

  private wrapTopic(topic: string) {
    return `/devices/${this.env.deviceId}/${topic}`;
  }

}