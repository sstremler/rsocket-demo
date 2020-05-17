package io.stremler.rsocketservice.service;

import io.stremler.rsocketservice.model.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.rsocket.RSocketRequester;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Component
public class MessageService {

//    @Autowired
//    private Mono<RSocketRequester> requesterMono;
//
//    public Flux<Message> getMessages() {
//        return Flux.interval(Duration.ofSeconds(1))
//                .map(interval -> new Message("Server", "Client", interval));
//    }


}
