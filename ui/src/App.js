import React, {Component} from 'react';
import './App.css';
import {Client} from './Client';
import {Message} from './Message';
import {Flowable} from "rsocket-flowable";

class App extends Component {
    clientStreamSubscription;
    serverStreamSubscription;

    constructor(props) {
        super(props);
        this.client = new Client('ws://localhost:7000');

        this.handleConnect = this.handleConnect.bind(this);
        this.handleDisconnect = this.handleDisconnect.bind(this);
        this.handleRequestResponse = this.handleRequestResponse.bind(this);
        this.handleRequestStream = this.handleRequestStream.bind(this);
        this.handleFireAndForget = this.handleFireAndForget.bind(this);
        this.handleRequestChannel = this.handleRequestChannel.bind(this);
        this.handleCancelChannel = this.handleCancelChannel.bind(this);
    }

    handleConnect(event) {
        console.log('connect click');
        this.client.connect().then(sub => {
            console.log('connected');
        });
    }

    handleDisconnect(event) {
        console.log('disconnect click');
        // connection.close();
        this.client.disconnect();
    }

    handleRequestResponse(event) {
        let msg = new Message('client', 'request');
        console.log('REQUEST RESPONSE, request', msg);
        this.client.requestResponse(msg).then(response => {
            console.log('REQUEST RESPONSE, response', response);
        });
    }

    handleFireAndForget(event) {
        let msg = new Message('client', 'request');
        console.log('FIRE AND FORGET, message', msg);
        this.client.fireAndForget(msg);
    }

    handleRequestStream(event) {
        let subscription;
        let requestedMsg = 10;
        let processedMsg = 0;
        let msg = new Message('client', 'request');
        console.log('REQUEST STREAM, request', msg);

        this.client.requestStream(msg).subscribe({
            onSubscribe: sub => {
                console.log('REQUEST STREAM: subscribed to stream');
                subscription = sub;
                subscription.request(requestedMsg);
            },
            onError: error => {
                console.log('REQUEST STREAM: error occurred', error);
            },
            onNext: msg => {
                console.log('REQUEST STREAM: new element arrived', msg.data);
                processedMsg++;

                if (processedMsg >= requestedMsg) {
                    console.log('REQUEST STREAM: request new messages');
                    subscription.request(requestedMsg);
                    processedMsg = 0;
                }

            },
            onComplete: msg => {
                console.log('REQUEST STREAM: completed')
            },
        });
    }

    handleRequestChannel(event) {
        let index = 0;
        let requestedMsg = 10;
        let processedMsg = 0;
        let cancelled = false;

        let flow = new Flowable(subscriber => {
            this.clientStreamSubscription = subscriber;
            this.clientStreamSubscription.onSubscribe({
                cancel: () => {
                    cancelled = true;
                },
                request: n => {
                    console.log('flowable request n=', n);

                    let intervalID = setInterval(() => {
                        if (n > 0 && !cancelled) {
                            console.log('flowable onNext index=', index);
                            subscriber.onNext(new Message('client', 'stream', index++));
                            n--;
                        } else {
                            console.log('flowable complete');
                            window.clearInterval(intervalID);
                        }
                    }, 1000);
                }
            });
        });

        this.client.requestChannel(flow).subscribe({
            onSubscribe: sub => {
                console.log('REQUEST CHANNEL: subscribed to stream');
                this.serverStreamSubscription = sub;
                this.serverStreamSubscription.request(requestedMsg);
            },
            onError: error => {
                console.log('REQUEST CHANNEL: error occurred', error);
            },
            onNext: msg => {
                console.log('REQUEST CHANNEL: new element arrived', msg.data);
                processedMsg++;

                if (processedMsg >= requestedMsg) {
                    console.log('REQUEST CHANNEL: request new messages');
                    this.serverStreamSubscription.request(requestedMsg);
                    processedMsg = 0;
                }
            },
            onComplete: msg => {
                console.log('REQUEST CHANNEL: completed')
            },
        });
    }

    handleCancelChannel(event) {
        this.clientStreamSubscription._subscription.cancel();
        this.serverStreamSubscription.cancel();
        console.log('cancel channel');
    }

    render() {
        return (<div className="App">
            <button onClick={this.handleConnect}>Connect</button>
            <button onClick={this.handleDisconnect}>Disconnect</button>
            <button onClick={this.handleRequestResponse}>Request response</button>
            <button onClick={this.handleFireAndForget}>Fire and forget</button>
            <button onClick={this.handleRequestStream}>Request stream</button>
            <button onClick={this.handleRequestChannel}>Request channel</button>
            <button onClick={this.handleCancelChannel}>Cancel channel</button>
        </div>);
    }
}

export default App;
