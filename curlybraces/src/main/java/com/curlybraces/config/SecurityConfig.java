package com.curlybraces.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Disabled for REST API simplicity
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/swagger-ui/**", "/v3/api-docs/**", "/", "/index.html", "/css/**", "/js/**").permitAll()
                        .anyRequest().permitAll() // Allow session access for quick demo setup
                );
        return http.build();
    }
}