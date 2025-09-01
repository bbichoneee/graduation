package com.csu.csu_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AppMain {
    public static void main(String[] args) {
        System.out.println(">>> BOOTING with com.csu.csu_backend.AppMain");
        SpringApplication.run(AppMain.class, args);
    }
}
