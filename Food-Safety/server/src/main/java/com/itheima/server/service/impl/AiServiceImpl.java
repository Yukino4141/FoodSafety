package com.itheima.server.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itheima.pojo.dto.AiAnalysisResult;
import com.itheima.server.service.AiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
@Slf4j
public class AiServiceImpl implements AiService {
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    private static final String API_KEY = "sk-043c66860b214f12af5b5aed5b23d96c";
    private static final String API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

    @Autowired
    public AiServiceImpl(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder
                .baseUrl(API_URL)
                .defaultHeader("Authorization", "Bearer " + API_KEY)
                .build();
        this.objectMapper = objectMapper;
    }

    @Override
    public AiAnalysisResult analyzeIngredients(String ingredients) {
        try {
            String systemPrompt = buildSystemPrompt();
            String userPrompt = buildUserPrompt(ingredients);
            String requestBody = buildRequestBody(systemPrompt, userPrompt);
            
            log.debug("AI请求体内容: {}", requestBody);
            
            // 尝试解析请求体以验证JSON格式
            try {
                objectMapper.readTree(requestBody);
                log.debug("请求体JSON格式验证通过");
            } catch (Exception e) {
                log.error("请求体JSON格式错误: {}", e.getMessage());
                throw e;
            }
            
            // 发送请求
            String response;
            try {
                // 记录完整请求信息
                log.debug("发送AI请求到URL: {}", API_URL);
                log.debug("请求方法: POST");
                log.debug("请求Headers: Authorization=Bearer ******, Content-Type={}", MediaType.APPLICATION_JSON);
                log.debug("请求体长度: {} 字符", requestBody.length());
                
                response = webClient.post()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();
                
                // 确保完整记录响应内容
                if (response == null) {
                    log.debug("AI响应内容: null");
                } else {
                    log.debug("AI响应内容长度: {} 字符", response.length());
                    log.debug("AI响应内容完整: {}", response);
                }
            } catch (WebClientResponseException e) {
                // 其他WebClient响应错误
                log.error("WebClient响应错误 ({}): {}", e.getStatusCode(), e.getStatusText(), e);
                log.error("错误响应体: {}", e.getResponseBodyAsString());
                throw e;
            } catch (Exception e) {
                // 其他错误
                log.error("WebClient请求发送失败: {}", e.getMessage(), e);
                throw e;
            }
            
            // 解析响应
            AiAnalysisResult result;
            try {
                result = parseResponse(response);
                log.debug("响应解析成功");
            } catch (Exception e) {
                log.error("响应内容解析失败: {}", e.getMessage(), e);
                throw e;
            }
            
            return result;
        } catch (Exception e) {
            log.error("AI分析失败: {}", e.getMessage(), e);
            // 默认返回安全级别
            return AiAnalysisResult.builder()
                    .score(80)
                    .riskLevel(0)
                    .riskMsg("AI分析失败，默认标记为低风险")
                    .build();
        }
    }

    private String buildSystemPrompt() {
        return "你是食品配料安全分析师，请严格按照以下规则分析配料表安全性并输出JSON格式结果，不要输出任何JSON以外的内容。\n评分规则：\n- 80-100分 → riskLevel=0（低风险/安全）：成分天然，无高风险添加剂，营养均衡\n- 40-79分 → riskLevel=1（中风险）：含有一定量的糖分、盐分或普通食品添加剂，建议适量食用\n- 0-39分 → riskLevel=2（高风险）：含有反式脂肪酸、致敏原、大量添加剂或营养价值极低\n输出格式（必须为JSON，无其他内容）：\n{\n  \"score\": 分数,\n  \"riskLevel\": 等级值,\n  \"riskMsg\": \"风险说明\"\n}";
    }
    
    private String buildUserPrompt(String ingredients) {
        return "配料表：" + ingredients;
    }

    private String buildRequestBody(String systemPrompt, String userPrompt) {
        try {
            log.debug("开始构建AI请求体");
            log.debug("systemPrompt长度: {} 字符", systemPrompt.length());
            log.debug("userPrompt: {}", userPrompt);
            
            // 使用ObjectMapper构建请求体，避免手动拼接转义问题
            com.fasterxml.jackson.databind.node.ObjectNode requestNode = objectMapper.createObjectNode();
            
            requestNode.put("model", "qwen-turbo");
            log.debug("设置model字段为: qwen-turbo");
            
            com.fasterxml.jackson.databind.node.ArrayNode messagesNode = objectMapper.createArrayNode();
            
            // 系统角色消息
            com.fasterxml.jackson.databind.node.ObjectNode systemMsgNode = objectMapper.createObjectNode();
            systemMsgNode.put("role", "system");
            systemMsgNode.put("content", systemPrompt);
            messagesNode.add(systemMsgNode);
            log.debug("添加系统角色消息到messages数组");
            
            // 用户角色消息
            com.fasterxml.jackson.databind.node.ObjectNode userMsgNode = objectMapper.createObjectNode();
            userMsgNode.put("role", "user");
            userMsgNode.put("content", userPrompt);
            messagesNode.add(userMsgNode);
            log.debug("添加用户角色消息到messages数组");
            
            requestNode.set("messages", messagesNode);
            requestNode.put("temperature", 0.1);
            log.debug("设置temperature字段为: 0.1");
            
            requestNode.put("stream", false);
            log.debug("设置stream字段为: false");
            
            String requestBody = objectMapper.writeValueAsString(requestNode);
            log.debug("请求体构建完成，总长度: {} 字符", requestBody.length());
            
            return requestBody;
        } catch (Exception e) {
            log.error("构建请求体失败: {}", e.getMessage(), e);
            // 如果构建失败，返回一个安全的默认请求
            return "{\"model\":\"qwen-turbo\",\"messages\":[{\"role\":\"user\",\"content\":\"\"}],\"temperature\":0.1,\"stream\":false}";
        }
    }

    private AiAnalysisResult parseResponse(String response) throws Exception {
        log.debug("开始解析AI响应");
        
        if (response == null) {
            throw new IllegalArgumentException("响应内容为null");
        }
        
        JsonNode root = objectMapper.readTree(response);
        log.debug("解析响应根节点成功");
        
        JsonNode choicesNode = root.path("choices");
        log.debug("choices节点类型: {}, 大小: {}", choicesNode.getNodeType(), choicesNode.size());
        
        if (choicesNode.isArray() && choicesNode.size() > 0) {
            JsonNode choiceNode = choicesNode.get(0);
            log.debug("第一个choice节点内容: {}", choiceNode.toString());
            
            JsonNode messageNode = choiceNode.path("message");
            log.debug("message节点内容: {}", messageNode.toString());
            
            String content = messageNode.path("content").asText();
            log.debug("AI返回的原始content: {}", content);
            log.debug("content长度: {} 字符", content.length());
            
            // 解析AI返回的JSON内容
            JsonNode aiResult = objectMapper.readTree(content);
            log.debug("解析AI返回的content为JSON成功");
            
            int score = aiResult.path("score").asInt(80);
            int riskLevel = aiResult.path("riskLevel").asInt(0);
            String riskMsg = aiResult.path("riskMsg").asText("分析成功");
            
            log.debug("解析得到的score: {}, riskLevel: {}, riskMsg: {}", score, riskLevel, riskMsg);
            
            // 确保riskLevel与score一致
            if (score >= 80) {
                riskLevel = 0;
                log.debug("根据score调整riskLevel为: {}", riskLevel);
            } else if (score >= 40) {
                riskLevel = 1;
                log.debug("根据score调整riskLevel为: {}", riskLevel);
            } else {
                riskLevel = 2;
                log.debug("根据score调整riskLevel为: {}", riskLevel);
            }
            
            return AiAnalysisResult.builder()
                    .score(score)
                    .riskLevel(riskLevel)
                    .riskMsg(riskMsg)
                    .build();
        }
        throw new RuntimeException("AI响应格式错误，choices节点为空或不是数组");
    }
}
