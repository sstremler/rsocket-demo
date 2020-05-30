import React, {Component} from 'react';
import './App.css';
import {Client} from './Client';
import {Message} from './Message';
import {Flowable} from "rsocket-flowable";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";

class App extends Component {
    requestChannelClientSubscription;
    requestChannelServerSubscription;
    requestStreamSubscription;

    constructor(props) {
        super(props);
        this.state = {
            connected: false,
            streamInProgress: false,
            channelInProgress: false,
            address: 'ws://localhost:7000',
            log: ''
        }

        this.handleConnect = this.handleConnect.bind(this);
        this.handleRequestResponse = this.handleRequestResponse.bind(this);
        this.handleRequestStream = this.handleRequestStream.bind(this);
        this.handleFireAndForget = this.handleFireAndForget.bind(this);
        this.handleRequestChannel = this.handleRequestChannel.bind(this);
    }

    handleConnect(event) {
        if (!this.state.connected) {
            this.client = new Client(this.state.address);
            this.client.connect().then(sub => {
                this.setState({connected: true});
                this.appendLog('Connected to ' + this.state.address);
            });
        } else {
            this.client.disconnect();
            this.setState({connected: false});
            this.appendLog('Disconnected from ' + this.state.address);
        }
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
        if(!this.state.streamInProgress) {
            let requestedMsg = 10;
            let processedMsg = 0;
            let msg = new Message('client', 'request');
            this.appendLog('REQUEST STREAM, request: ' + msg.toString());

            this.client.requestStream(msg).subscribe({
                onSubscribe: sub => {
                    this.appendLog('REQUEST STREAM: subscribed to stream');
                    this.requestStreamSubscription = sub;
                    this.appendLog('REQUEST STREAM: request ' + requestedMsg + ' messages');
                    this.requestStreamSubscription.request(requestedMsg);
                    this.setState({streamInProgress: true});
                },
                onError: error => {
                    this.appendLog('REQUEST STREAM: error occurred: ' + JSON.stringify(error));
                },
                onNext: msg => {
                    this.appendLog('REQUEST STREAM: new message arrived: ' + new Message().toObject(msg.data).toString());
                    processedMsg++;

                    if (processedMsg >= requestedMsg) {
                        this.appendLog('REQUEST STREAM: request ' + requestedMsg + ' messages');
                        this.requestStreamSubscription.request(requestedMsg);
                        processedMsg = 0;
                    }

                },
                onComplete: msg => {
                    this.appendLog('REQUEST STREAM: stream completed');
                },
            });
        } else {
            this.requestStreamSubscription.cancel();
            this.setState({streamInProgress: false});
            this.appendLog('REQUEST STREAM: stream cancelled');
        }
    }

    handleRequestChannel(event) {
        if(!this.state.channelInProgress) {
            let index = 0;
            let requestedMsg = 10;
            let processedMsg = 0;
            let cancelled = false;

            let flow = new Flowable(subscriber => {
                this.requestChannelClientSubscription = subscriber;
                this.requestChannelClientSubscription.onSubscribe({
                    cancel: () => {
                        cancelled = true;
                    },
                    request: n => {
                        this.appendLog('REQUEST CHANNEL: OUTBOUND: ' + n + ' message(s) was/were requested by the server');

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
                    this.requestChannelServerSubscription = sub;
                    this.requestChannelServerSubscription.request(requestedMsg);
                    this.appendLog('REQUEST CHANNEL: INBOUND: ' + requestedMsg + ' message(s) was/were requested by the client');
                    this.setState({channelInProgress: true});
                },
                onError: error => {
                    this.appendLog('REQUEST CHANNEL: INBOUND: error occurred:' + JSON.stringify(error));
                },
                onNext: msg => {
                    this.appendLog('REQUEST CHANNEL: INBOUND: new message arrived: ' + new Message().toObject(msg.data).toString());
                    processedMsg++;

                    if (processedMsg >= requestedMsg) {
                        this.requestChannelServerSubscription.request(requestedMsg);
                        this.appendLog('REQUEST CHANNEL: INBOUND: ' + requestedMsg + ' message(s) was/were requested by the client');
                        processedMsg = 0;
                    }
                },
                onComplete: msg => {
                    console.log('REQUEST CHANNEL: INBOUND: stream completed')
                },
            });
        } else {
            this.requestChannelClientSubscription._subscription.cancel();
            this.requestChannelServerSubscription.cancel();
            this.setState({channelInProgress: false});
            this.appendLog('REQUEST CHANNEL: channel cancelled');
        }
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
                />
                <Button variant="contained" color="primary" className="connect-btn"
                        onClick={this.handleConnect}>{this.state.connected === true ? 'Disconnect' : 'Connect'}</Button>
            </div>
            <div className="btn-container">
                <Button variant="contained" color="primary" onClick={this.handleRequestResponse}>Request
                    response</Button>
                <Button variant="contained" color="primary" onClick={this.handleFireAndForget}>Fire and forget</Button>
                <Button variant="contained" color="primary"
                        onClick={this.handleRequestStream}>{this.state.streamInProgress ? 'Cancel stream' : 'Request stream'}</Button>
                <Button variant="contained" color="primary"
                        onClick={this.handleRequestChannel}>{this.state.channelInProgress ? 'Cancel channel' : 'Request channel'}</Button>
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
