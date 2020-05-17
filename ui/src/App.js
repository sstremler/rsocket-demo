import React, {Component} from 'react';
import './App.css';
import {Client} from './Client';
import {Message} from './Message';

class App extends Component {
    constructor(props) {
        super(props);
        this.client = new Client('ws://localhost:7000');

        this.handleConnect = this.handleConnect.bind(this);
        this.handleDisconnect = this.handleDisconnect.bind(this);
        this.handleRequestResponse = this.handleRequestResponse.bind(this);
        this.handleRequestStream = this.handleRequestStream.bind(this);
        this.handleFireAndForget = this.handleFireAndForget.bind(this);
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
        console.log('request response, request', msg);
        this.client.requestResponse(msg).then(response => {
            console.log('request-response response', response);
        });
    }

    handleFireAndForget(event) {
        let msg = new Message('client', 'request');
        console.log('request response, request', msg);
        this.client.fireAndForget(msg).then(response => {
            console.log('request-response response', response);
        });
    }

    handleRequestStream(event) {
        let subscription;
        let requestedMsg = 10;
        let processedMsg = 0;
        let msg = new Message('client', 'request');
        console.log('request stream, request', msg);

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

                if(processedMsg >= requestedMsg) {
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

    render() {
        return (<div className="App">
            <button onClick={this.handleConnect}>Connect</button>
            <button onClick={this.handleDisconnect}>Disconnect</button>
            <button onClick={this.handleRequestResponse}>Request response</button>
            <button onClick={this.handleFireAndForget}>Fire and forget</button>
            <button onClick={this.handleRequestStream}>Request stream</button>
        </div>);
    }
}

export default App;
