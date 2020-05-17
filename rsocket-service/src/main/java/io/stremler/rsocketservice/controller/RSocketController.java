package io.stremler.rsocketservice.controller;

import io.stremler.rsocketservice.model.Message;
import io.stremler.rsocketservice.service.MessageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.rsocket.RSocketRequester;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import reactor.core.publisher.DirectProcessor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

@Slf4j
@Controller
public class RSocketController {

    @Autowired
    private DirectProcessor<Message> processor;

    @Autowired
    private Flux<Message> messageFlux;

    @Autowired
    private FluxSink<Message> messageFluxSink;

    private final Queue<RSocketRequester> connectedClients = new ConcurrentLinkedQueue<>();

    private static Map<String, Integer> map = new HashMap<>();

    private final MessageService messageService;

    public RSocketController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("request-response")
    Message requestResponse(final Message request) {
        log.info("Received request-response request: {}", request);
        return new Message("server", "response");
    }

    @MessageMapping("fire-and-forget")
    public void fireAndForget(final Message request) {
        log.info("Received fire-and-forget request: {}", request);
    }

    @MessageMapping("stream")
    Flux<Message> stream(@RequestBody Message request) {
//        messageFluxSink.next(request);
//        return messageFlux;
        log.info("Received stream request: {}", request);
        return Flux
                .interval(Duration.ofSeconds(1)).onBackpressureBuffer()
                .map(index -> new Message("server", "stream", index))
                .log();
    }

    @MessageMapping("channel")
    Flux<Message> channel(Flux<Message> settings) {
//        connectedClients.offer(requester);
//        messageFlux = Flux.merge(messageFlux, settings);
        settings.subscribe(messageFluxSink::next);
//        settings.subscribe(System.out::println);
        return messageFlux;
//        String threadName = Thread.currentThread().getName();
//        log.info(threadName);

//        return this.messageService.getMessages()
//                .doOnTerminate(() -> {
//                    this.log.info("Server error while streaming data to the client");
//                    this.connectedClients.remove(requester);
//                })
//                .doOnCancel(() -> {
//                    this.log.info("Connection closed by the client");
//                    this.connectedClients.remove(requester);
//                });
    }
//    @MessageMapping("channel")
//    Flux<Message> channel(final Flux<Duration> settings) {
//        log.info("Received channel request...");
//        return settings
//                .doOnNext(setting -> log.info("Channel frequency setting is {} second(s).", setting.getSeconds()))
//                .doOnCancel(() -> log.warn("The client cancelled the channel."))
//                .switchMap(setting -> Flux.interval(setting)
//                        .map(index -> new Message(SERVER, CHANNEL, index)));
//    }
}
