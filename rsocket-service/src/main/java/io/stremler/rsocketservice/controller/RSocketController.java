package io.stremler.rsocketservice.controller;

import io.stremler.rsocketservice.model.Message;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;

import java.time.Duration;

@Slf4j
@Controller
public class RSocketController {

    @MessageMapping("request-response")
    public Message requestResponse(final Message request) {
        log.info("Received request-response request: {}", request);
        return new Message("server", "response");
    }

    @MessageMapping("fire-and-forget")
    public void fireAndForget(final Message request) {
        log.info("Received fire-and-forget request: {}", request);
    }

    @MessageMapping("stream")
    public Flux<Message> stream(final Message request) {
        log.info("Received stream request: {}", request);
        return Flux
                .interval(Duration.ofSeconds(1))//.onBackpressureBuffer()
                .map(index -> new Message("server", "stream", index))
                .log();
    }

    @MessageMapping("channel")
    public Flux<Message> channel(final Flux<Message> settings) {
        log.info("Received channel request");
        settings.subscribe(message -> log.info(message.toString()));

        return Flux.interval(Duration.ofSeconds(1))
                .doOnCancel(() -> log.warn("The client cancelled the channel."))
                .map(index -> new Message("server", "stream", index));
    }
}
