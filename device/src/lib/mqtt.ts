import mqtt from 'mqtt';
import config from './config';
import { createJWT } from './utils';

export let client: mqtt.Client;

export const connect = () => {
  return new Promise((resolve, reject) => {
    // IoT Core specific connection parameters
    const mqttClientId = `projects/${config.projectId}/locations/${config.region}/registries/${config.registryId}/devices/${config.deviceId}`;

    let connectionArgs = {
      host: 'mqtt.googleapis.com',
      port: 8883,
      clientId: mqttClientId,
      username: 'unused',
      password: createJWT(config.projectId, config.privateKey, config.algorithm),
      protocol: 'mqtts',
      secureProtocol: 'TLSv1_2_method'
    };

    client = mqtt.connect(connectionArgs);

    client.on('connect', resolve);
    client.on('error', reject);
  })
}

export const publish = (topic: string, message: string, wrap: boolean = false) => {
   // Optionally add topic prefix
   topic = wrap ? `/devices/${config.deviceId}/${topic}` : topic;

   return new Promise((resolve, reject) => {
     client.publish(topic, message, (err) => {
       if(err){
         reject(err);
       } else {
         resolve();
       }
     })
   })
}

export const subscribe = (topic: string, callback: (message: Buffer) => void, wrap: boolean = false) => {
  // Optionally add topic prefix
  topic = wrap ? `/devices/${config.deviceId}/${topic}` : topic;

  return new Promise((resolve, reject) => {
    // Request subscription over MQTT
    client.subscribe(topic, (error, granted) => {
      // If there's an error or we are not granted QoS 0
      if (error || granted[0].qos != 0) {
        reject();
      } else {
        // Register a callback function for that topic
        client.on('message', (incomingTopic, message) => {
          if (topic === incomingTopic) {
            callback(message);
          }
        });
        resolve();
      }
    })
  })
}
