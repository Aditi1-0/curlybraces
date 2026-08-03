package com.curlybraces.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisResultDTO {
    private Integer overallScore;
    private Integer cyclomaticComplexity;
    private String timeComplexity;
    private Integer readabilityScore;
    private String refactoredCode;
    private List<String> suggestions;
}