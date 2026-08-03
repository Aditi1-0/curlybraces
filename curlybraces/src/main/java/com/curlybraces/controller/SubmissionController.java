package com.curlybraces.controller;

import com.curlybraces.dto.AnalysisResultDTO;
import com.curlybraces.dto.AuthDTO;
import com.curlybraces.model.Submission;
import com.curlybraces.model.User;
import com.curlybraces.repository.SubmissionRepository;
import com.curlybraces.repository.UserRepository;
import com.curlybraces.service.CodeAnalysisService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    private final CodeAnalysisService codeAnalysisService;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SubmissionController(CodeAnalysisService codeAnalysisService,
                                SubmissionRepository submissionRepository,
                                UserRepository userRepository) {
        this.codeAnalysisService = codeAnalysisService;
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeAndSave(@RequestBody AuthDTO.CodeSubmitRequest request, HttpSession session) {
        User sessionUser = (User) session.getAttribute("user");

        AnalysisResultDTO result = codeAnalysisService.analyzeCode(request.getCode());

        if (sessionUser != null && sessionUser.getId() != null) {
            User user = userRepository.findById(sessionUser.getId()).orElse(null);
            if (user != null) {
                try {
                    Submission submission = Submission.builder()
                            .user(user)
                            .title(request.getTitle() != null && !request.getTitle().isBlank() ? request.getTitle() : "Code Analysis")
                            .rawCode(request.getCode())
                            .overallScore(result.getOverallScore())
                            .cyclomaticComplexity(result.getCyclomaticComplexity())
                            .timeComplexity(result.getTimeComplexity())
                            .readabilityScore(result.getReadabilityScore())
                            .refactoredCode(result.getRefactoredCode())
                            .suggestionsJson(objectMapper.writeValueAsString(result.getSuggestions()))
                            .build();

                    submissionRepository.save(submission);
                } catch (Exception e) {
                    System.err.println("Error saving submission: " + e.getMessage());
                }
            }
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(HttpSession session) {
        User user = (User) session.getAttribute("user");

        if (user == null || user.getId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not logged in");
        }

        List<Submission> history = submissionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        // Nullify the lazy proxy user object before sending JSON to prevent ByteBuddyInterceptor 500 error
        history.forEach(submission -> submission.setUser(null));

        return ResponseEntity.ok(history);
    }
}