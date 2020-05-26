package io.stremler.rsocketservice.util;

import io.rsocket.RSocketFactory;
import io.stremler.rsocketservice.model.Message;
import org.springframework.boot.rsocket.server.ServerRSocketFactoryProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.*;

import java.time.Duration;

@Configuration
public class BeanConfig {

    @Bean
    public DirectProcessor<Message> unicastProcessor() {
        return DirectProcessor.create();
    }

    @Bean
    public Flux<Message> messageFlux(DirectProcessor<Message> processor) {
        return processor.publish().autoConnect();
    }

    @Bean
    public FluxSink<Message> messageFluxSink(DirectProcessor<Message> processor) {
        return processor.sink();
    }

    @Bean
    ServerRSocketFactoryProcessor serverRSocketFactoryProcessor() {
        return RSocketFactory.ServerRSocketFactory::resume;
    }

}
