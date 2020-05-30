import {IdentitySerializer, JsonSerializer, RSocketClient, RSocketResumableTransport} from "rsocket-core";
import RSocketWebSocketClient from "rsocket-websocket-client";
import {v4 as uuidv4} from 'uuid';
import {Message} from "./Message";

export class Client {

    constructor(address) {
        this.client = new RSocketClient({
            serializers: {
                data: JsonSerializer,
                metadata: IdentitySerializer
            },
            setup: {
                keepAlive: 10000,
                lifetime: 20000,
                dataMimeType: 'application/json',
                metadataMimeType: 'message/x.rsocket.routing.v0',
            },
            transport: new RSocketResumableTransport(
                () => new RSocketWebSocketClient({url: address}),
                {
                    bufferSize: 100, // max number of sent & pending frames to buffer before failing
                    resumeToken: uuidv4(), // string to uniquely identify the session across connections
                })
        });
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.client.connect().subscribe({
                onComplete: s => {
                    this.socket = s;
                    this.socket.connectionStatus().subscribe(status => {
                        console.log(status);
                    });

                    resolve(this.socket);
                },
                onError: error => {
                    reject(error);
                },
                onSubscribe: cancel => {
                    this.cancel = cancel
                }
            });
        });
    }

    requestResponse(message) {
        return new Promise((resolve, reject) => {
            this.socket.requestResponse({
                data: message,
                metadata: String.fromCharCode('request-response'.length) + 'request-response'
            }).subscribe({
                onComplete: msg => {
                    resolve(new Message().toObject(msg.data))
                },
                onError: error => {
                    reject(error)
                }
            });
        });
    }

    fireAndForget(message) {
        return this.socket.fireAndForget({
            data: message,
            metadata: String.fromCharCode('fire-and-forget'.length) + 'fire-and-forget'
        });
    }

    requestStream(message) {
        return this.socket.requestStream({
            data: message,
            metadata: String.fromCharCode('stream'.length) + 'stream'
        });
    }

    requestChannel(flow) {
        return this.socket.requestChannel(flow.map(msg => {
            return {
                data: msg,
                metadata: String.fromCharCode('channel'.length) + 'channel'
            };
        }));
    }

    disconnect() {
        console.log('rsocketclientsocket', this.socket);
        console.log('rsocketclient', this.client);
        // this.socket.close();
        this.client.close();
        // this.cancel();
    }

}
