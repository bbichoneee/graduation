package com.Loop.CodeStartUP;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class CodeStartUpApplication {

	public static void main(String[] args) {
		SpringApplication.run(CodeStartUpApplication.class, args);
	}

}
