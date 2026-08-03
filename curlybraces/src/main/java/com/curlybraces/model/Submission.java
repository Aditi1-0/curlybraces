package com.curlybraces.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String rawCode;

    @Column(nullable = false)
    private Integer overallScore;

    @Column(nullable = false)
    private Integer cyclomaticComplexity;

    @Column(nullable = false, length = 20)
    private String timeComplexity;

    @Column(nullable = false)
    private Integer readabilityScore;

    @Column(columnDefinition = "TEXT")
    private String refactoredCode;

    @Column(columnDefinition = "TEXT")
    private String suggestionsJson;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}