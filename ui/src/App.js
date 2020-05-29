import React, {Component} from 'react';
import './App.css';
import {Client} from './Client';
import {Message} from './Message';
import {Flowable} from "rsocket-flowable";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";

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
            <div className="address-container">
                <TextField
                    id="text-field-address"
                    label="Address"
                    defaultValue="ws://localhost:7000"
                    placeholder="ws://localhost:7000"
                    fullWidth
                />
                <Button variant="contained" color="primary" className="connect-btn" onClick={this.handleConnect}>Connect</Button>
            </div>
            <div className="btn-container">
                {/*<button onClick={this.handleDisconnect}>Disconnect</button>*/}
                <Button variant="contained" color="primary" onClick={this.handleRequestResponse}>Request response</Button>
                <Button variant="contained" color="primary" onClick={this.handleFireAndForget}>Fire and forget</Button>
                <Button variant="contained" color="primary" onClick={this.handleRequestStream}>Request stream</Button>
                <Button variant="contained" color="primary" onClick={this.handleRequestChannel}>Request channel</Button>
                {/*<Button variant="contained" color="primary" onClick={this.handleCancelChannel}>Cancel channel</Button>*/}
            </div>
            <div className="messages-container">
                <TextField
                    disabled
                    id="text-field-sent"
                    label="Sent"
                    multiline
                    rows={4}
                    defaultValue=" "
                    variant="outlined"
                    fullWidth
                />
                <TextField
                    disabled
                    id="text-field-received"
                    label="Received"
                    multiline
                    rows={4}
                    defaultValue=" "
                    variant="outlined"
                    fullWidth
                    className="text-field-received"
                />
            </div>
        </div>);
    }
}

export default App;
