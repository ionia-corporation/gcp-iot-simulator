import Vorpal from 'vorpal';
import chalk from 'chalk';

import * as mqtt from '../lib/mqtt';
import config from '../lib/config'

export default (vorpal: Vorpal) => {
  vorpal
    .command('connect', 'Creates MQTT connection to IoT Core')
    .action(() => {
      return mqtt.connect()
        .then(() => {
          vorpal.log(chalk.green('Connected to MQTT'));
        })
        .catch((e) => {
          vorpal.log(chalk.red('Failed to connect to MQTT'));
        })
    });

  vorpal
    .command('subscribe <topic>', 'Subscribes to topic and logs any messages on that topic')
    .option('-w --wrap', 'Automatically add topic prefix')
    .action((args) => {
      const onMessage = (message: Buffer) => {
        vorpal.log(chalk.green('Received message'));
        vorpal.log(message.toString('utf8'));
      };
      return mqtt.subscribe(args.topic, onMessage)
      .then(() => {
        vorpal.log(chalk.green('Subscribed to: ' + args.topic))
      })
      .catch((error) => {
        vorpal.log(chalk.red('Failed to subscribe to topic: ' + args.topic));
      });
    })
};
