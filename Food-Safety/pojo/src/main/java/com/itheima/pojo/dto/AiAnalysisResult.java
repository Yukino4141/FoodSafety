package com.itheima.pojo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisResult {
    private int score;
    private int riskLevel;
    private String riskMsg;
}
