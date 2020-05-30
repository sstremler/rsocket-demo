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
        this.state = {
            address: 'ws://localhost:7000',
            log: ''
        }

        this.handleConnect = this.handleConnect.bind(this);
        this.handleDisconnect = this.handleDisconnect.bind(this);
        this.handleRequestResponse = this.handleRequestResponse.bind(this);
        this.handleRequestStream = this.handleRequestStream.bind(this);
        this.handleFireAndForget = this.handleFireAndForget.bind(this);
        this.handleRequestChannel = this.handleRequestChannel.bind(this);
        this.handleCancelChannel = this.handleCancelChannel.bind(this);
    }

    handleConnect(event) {
        this.client = new Client(this.state.address);
        this.client.connect().then(sub => {
            this.appendLog('Connected to ' + this.state.address);
        });
    }

    handleDisconnect(event) {
        console.log('disconnect click');
        // connection.close();
        this.client.disconnect();
    }

    handleRequestResponse(event) {
        let msg = new Message('client', 'request');
        this.appendLog('REQUEST RESPONSE, request ' + msg.toString());
        this.client.requestResponse(msg).then(response => {
            this.appendLog('REQUEST RESPONSE, response ' + response.toString());
        });
    }

    handleFireAndForget(event) {
        let msg = new Message('client', 'fire');
        this.appendLog('FIRE AND FORGET, fire: ' + msg.toString());
        this.client.fireAndForget(msg);
    }

    handleRequestStream(event) {
        let subscription;
        let requestedMsg = 10;
        let processedMsg = 0;
        let msg = new Message('client', 'request');
        this.appendLog('REQUEST STREAM, request: ' + msg.toString());

        this.client.requestStream(msg).subscribe({
            onSubscribe: sub => {
                this.appendLog('REQUEST STREAM: subscribed to stream');
                subscription = sub;
                this.appendLog('REQUEST STREAM: request '+ requestedMsg +' messages');
                subscription.request(requestedMsg);
            },
            onError: error => {
                this.appendLog('REQUEST STREAM: error occurred: ', JSON.stringify(error));
            },
            onNext: msg => {
                this.appendLog('REQUEST STREAM: new message arrived: ', new Message().toObject(msg.data).toString());
                processedMsg++;

                if (processedMsg >= requestedMsg) {
                    this.appendLog('REQUEST STREAM: request '+ requestedMsg +' messages');
                    subscription.request(requestedMsg);
                    processedMsg = 0;
                }

            },
            onComplete: msg => {
                this.appendLog('REQUEST STREAM: stream completed');
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
                    this.appendLog('REQUEST CHANNEL: OUTBOUND: '+ n +' message(s) was/were requested by the server');

                    let intervalID = setInterval(() => {
                        if (n > 0 && !cancelled) {
                            const msg = new Message('client', 'stream', index++);
                            subscriber.onNext(msg);
                            this.appendLog('REQUEST CHANNEL: OUTBOUND: new message sent: ' + msg.toString());
                            n--;
                        } else {
                            window.clearInterval(intervalID);
                        }
                    }, 1000);
                }
            });
        });

        this.client.requestChannel(flow).subscribe({
            onSubscribe: sub => {
                this.appendLog('REQUEST CHANNEL: INBOUND: subscribed to stream');
                this.serverStreamSubscription = sub;
                this.serverStreamSubscription.request(requestedMsg);
                this.appendLog('REQUEST CHANNEL: INBOUND: '+ requestedMsg +' message(s) was/were requested by the client');
            },
            onError: error => {
                this.appendLog('REQUEST CHANNEL: INBOUND: error occurred:' + JSON.stringify(error));
            },
            onNext: msg => {
                this.appendLog('REQUEST CHANNEL: INBOUND: new message arrived: ' + new Message().toObject(msg.data).toString());
                processedMsg++;

                if (processedMsg >= requestedMsg) {
                    this.serverStreamSubscription.request(requestedMsg);
                    this.appendLog('REQUEST CHANNEL: INBOUND: '+ requestedMsg +' message(s) was/were requested by the client');
                    processedMsg = 0;
                }
            },
            onComplete: msg => {
                console.log('REQUEST CHANNEL: INBOUND: stream completed')
            },
        });
    }

    handleCancelChannel(event) {
        this.clientStreamSubscription._subscription.cancel();
        this.serverStreamSubscription.cancel();
        console.log('cancel channel');
    }

    handleAddressChange(event) {
        this.setState({
            address: event.target.value,
        });
    }

    appendLog(log) {
        this.setState(state => ({
            log: state.log + log + '\n'
        }))
    }

    render() {
        return (<div className="App">
            <div className="address-container">
                <TextField
                    id="text-field-address"
                    label="Address"
                    value={this.state.address}
                    onChange={this.handleAddressChange}
                    placeholder="ws://localhost:7000"
                    fullWidth
                    autoFocus
                    required
                />
                <Button variant="contained" color="primary" className="connect-btn"
                        onClick={this.handleConnect}>Connect</Button>
            </div>
            <div className="btn-container">
                {/*<button onClick={this.handleDisconnect}>Disconnect</button>*/}
                <Button variant="contained" color="primary" onClick={this.handleRequestResponse}>Request
                    response</Button>
                <Button variant="contained" color="primary" onClick={this.handleFireAndForget}>Fire and forget</Button>
                <Button variant="contained" color="primary" onClick={this.handleRequestStream}>Request stream</Button>
                <Button variant="contained" color="primary" onClick={this.handleRequestChannel}>Request channel</Button>
                {/*<Button variant="contained" color="primary" onClick={this.handleCancelChannel}>Cancel channel</Button>*/}
            </div>
            <div className="messages-container">
                <TextField
                    disabled
                    id="text-field-sent"
                    label="Log"
                    multiline
                    rows={15}
                    value={this.state.log}
                    variant="outlined"
                    fullWidth
                />
            </div>
        </div>);
    }
}

export default App;
