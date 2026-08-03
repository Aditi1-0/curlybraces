package com.curlybraces.service;

import com.curlybraces.dto.AnalysisResultDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.stmt.*;
import com.github.javaparser.ast.expr.BinaryExpr;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CodeAnalysisService {

    @Value("ADD_API_KEY_HERE")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AnalysisResultDTO analyzeCode(String sourceCode) {
        List<String> suggestions = new ArrayList<>();
        int cyclomaticComplexity = calculateCyclomaticComplexity(sourceCode);
        int readabilityScore = evaluateReadability(sourceCode, suggestions);

        // Call Gemini LLM Engine
        AnalysisResultDTO llmResult = callGeminiAnalysis(sourceCode);

        // Merge JavaParser AST structural metrics with LLM semantic analysis
        llmResult.setCyclomaticComplexity(cyclomaticComplexity);
        if (llmResult.getSuggestions() != null) {
            suggestions.addAll(llmResult.getSuggestions());
        }
        llmResult.setSuggestions(suggestions);

        return llmResult;
    }

    private int calculateCyclomaticComplexity(String code) {
        try {
            CompilationUnit cu = StaticJavaParser.parse(code);
            int complexity = 1;
            complexity += cu.findAll(IfStmt.class).size();
            complexity += cu.findAll(ForStmt.class).size();
            complexity += cu.findAll(ForEachStmt.class).size();
            complexity += cu.findAll(WhileStmt.class).size();
            complexity += cu.findAll(DoStmt.class).size();
            complexity += cu.findAll(CatchClause.class).size();
            complexity += cu.findAll(BinaryExpr.class).stream()
                    .filter(b -> b.getOperator() == BinaryExpr.Operator.BINARY_AND ||
                            b.getOperator() == BinaryExpr.Operator.BINARY_OR)
                    .count();
            return complexity;
        } catch (Exception e) {
            return 1;
        }
    }

    private int evaluateReadability(String code, List<String> suggestions) {
        int score = 100;
        try {
            CompilationUnit cu = StaticJavaParser.parse(code);
            for (MethodDeclaration method : cu.findAll(MethodDeclaration.class)) {
                if (method.getRange().isPresent()) {
                    int lineCount = method.getRange().get().end.line - method.getRange().get().begin.line;
                    if (lineCount > 25) {
                        score -= 10;
                        suggestions.add("AST Alert: Method '" + method.getNameAsString() + "' is long (" + lineCount + " lines).");
                    }
                }
            }
            for (CatchClause catchClause : cu.findAll(CatchClause.class)) {
                if (catchClause.getBody().getStatements().isEmpty()) {
                    score -= 15;
                    suggestions.add("AST Alert: Empty catch block detected.");
                }
            }
        } catch (Exception ignored) {
        }
        return Math.max(20, score);
    }

    private AnalysisResultDTO callGeminiAnalysis(String sourceCode) {
        String prompt = "You are an expert Java code reviewer. Analyze the following Java code and respond strictly in JSON format with NO markdown formatting or code blocks.\n" +
                "JSON Schema:\n" +
                "{\n" +
                "  \"overallScore\": <integer 0-100>,\n" +
                "  \"timeComplexity\": \"<e.g. O(N log N)>\",\n" +
                "  \"readabilityScore\": <integer 0-100>,\n" +
                "  \"refactoredCode\": \"<optimized production quality Java code>\",\n" +
                "  \"suggestions\": [\"<suggestion 1>\", \"<suggestion 2>\"]\n" +
                "}\n\n" +
                "Java Code:\n" + sourceCode;

        try {
            String cleanKey = apiKey != null ? apiKey.trim() : "";
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

            String jsonPayload = objectMapper.writeValueAsString(
                    Map.of("contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", prompt)
                            ))
                    ))
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", cleanKey)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode rootNode = objectMapper.readTree(response.body());
                String rawText = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

                rawText = rawText.replaceAll("```json", "").replaceAll("```", "").trim();
                return objectMapper.readValue(rawText, AnalysisResultDTO.class);
            } else {
                System.err.println("Gemini HTTP Error Code: " + response.statusCode());
                System.err.println("Gemini Response Body: " + response.body());
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return AnalysisResultDTO.builder()
                .overallScore(70)
                .timeComplexity("O(N)")
                .readabilityScore(75)
                .refactoredCode("// Fallback returned due to API error.\n" + sourceCode)
                .suggestions(List.of("Using local fallback evaluation."))
                .build();
    }
}