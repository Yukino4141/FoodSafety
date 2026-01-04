package com.itheima.server.service.impl;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.itheima.common.properties.AiProperties;
import com.itheima.common.untils.AliOssUtil;
import com.itheima.pojo.dto.AiAnalyzeDTO;
import com.itheima.pojo.dto.AiAnalysisResult;
import com.itheima.pojo.vo.AiAnalyzeVO;
import com.itheima.pojo.vo.OcrResultVO;
import com.itheima.server.service.AiService;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AiServiceImpl implements AiService {

    @Autowired
    private AliOssUtil aliOssUtil;

    @Autowired
    private AiProperties aiProperties;

    private static final Pattern ING_PATTERN = Pattern.compile("配料[:：]?(.+)");

    @Override
    public OcrResultVO ocr(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            // 直接复用已有上传工具，避免方法签名不匹配
            String imageUrl = aliOssUtil.upload(file);

            String rawText = callAliyunOcr(bytes, imageUrl);
            List<String> ingredients = extractIngredients(rawText);

            return OcrResultVO.builder()
                    .imageUrl(imageUrl)
                    .rawText(rawText)
                    .ingredients(ingredients)
                    .build();
        } catch (Exception e) {
            log.error("OCR 处理失败", e);
            throw new RuntimeException("OCR 处理失败，请重试");
        }
    }

    @Override
    public AiAnalyzeVO analyze(AiAnalyzeDTO dto) {
        String prompt = buildAnalyzePrompt(dto);
        String content = callChatModel(prompt);
        return parseAnalyzeResult(content);
    }

    @Override
    public AiAnalysisResult analyzeIngredients(String ingredients) {
        String prompt = buildRiskPrompt(ingredients);
        String content = callChatModel(prompt);
        return parseAiAnalysisResult(content);
    }

    private List<String> extractIngredients(String rawText) {
        if (rawText == null || rawText.isEmpty()) {
            return Collections.emptyList();
        }
        Matcher matcher = ING_PATTERN.matcher(rawText.replace("\n", " "));
        if (matcher.find()) {
            String part = matcher.group(1);

            // 截断到句号，避免将过敏原说明等附加信息当作配料
            int stopIdx = part.indexOf('。');
            if (stopIdx > -1) {
                part = part.substring(0, stopIdx);
            }

            return Arrays.stream(part.split("[，,；;]"))
                    .map(String::trim)
                    .map(s -> s.replaceAll("[。.]$", ""))
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }
        return Collections.emptyList();
    }

    private String buildAnalyzePrompt(AiAnalyzeDTO dto) {
        String ingredients = dto.getIngredients() == null ? "" : String.join(",", dto.getIngredients());
        String target = dto.getTargetUser() == null ? "默认人群" : dto.getTargetUser();
        return "你是一名食品安全与营养分析助手，只能输出 JSON 对象。" +
                "输入信息: 配料列表=[" + ingredients + "], 食用人群=" + target + "。" +
                "请务必直接返回以下字段的 JSON，对应中文含义无需再解释：" +
                "score: 0-100 的整数; " +
                "riskLevel: 风险等级，0=安全,1=中风险,2=高风险; " +
                "summary: 一句话总结风险; " +
                "suggestion: 2-3 句具体建议。" +
                "输出要求：只返回单个 JSON 对象，不要使用 Markdown、不要使用代码块、不要添加额外文字或前后缀。示例: {\"score\":40,\"riskLevel\":2,\"summary\":\"...\",\"suggestion\":\"...\"}";
    }

    private String buildRiskPrompt(String ingredients) {
        String safeIng = ingredients == null ? "" : ingredients;
        return "你是食品配料安全分析师，请输出严格的 JSON，不要包含除 JSON 外的任何内容。" +
                "评分规则：80-100 分 riskLevel=0（安全），40-79 分 riskLevel=1（中风险），0-39 分 riskLevel=2（高风险）。" +
                "返回格式: {\"score\":80,\"riskLevel\":0,\"riskMsg\":\"风险说明\"}。" +
                "配料表：" + safeIng;
    }

    private String callChatModel(String prompt) {
        String url = aiProperties.getApiUrl();
        if (!StringUtils.hasText(url)) {
            throw new RuntimeException("AI 接口地址未配置");
        }
        String model = !StringUtils.hasText(aiProperties.getModel()) ? "deepseek-chat" : aiProperties.getModel();
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPost post = new HttpPost(url);
            post.setHeader("Content-Type", "application/json");
            post.setHeader("Authorization", "Bearer " + aiProperties.getApiKey());

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", prompt);
            messages.add(userMsg);
            body.put("messages", messages);
            body.put("temperature", 0.2);

            StringEntity entity = new StringEntity(JSON.toJSONString(body), StandardCharsets.UTF_8);
            post.setEntity(entity);

            try (CloseableHttpResponse response = client.execute(post)) {
                String resp = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
                log.info("AI analyze resp: {}", resp);
                JSONObject json = JSON.parseObject(resp);

                return json.getJSONArray("choices")
                        .getJSONObject(0)
                        .getJSONObject("message")
                        .getString("content");
            }
        } catch (Exception e) {
            log.error("调用大模型失败", e);
            throw new RuntimeException("AI 分析失败，请稍后再试");
        }
    }

    private AiAnalyzeVO parseAnalyzeResult(String content) {
        if (content == null) {
            throw new RuntimeException("AI 返回为空");
        }
        try {
            String cleaned = extractJsonObject(content);
            JSONObject obj = JSON.parseObject(cleaned);
            return AiAnalyzeVO.builder()
                    .score(obj.getInteger("score"))
                    .riskLevel(obj.getInteger("riskLevel"))
                    .summary(obj.getString("summary"))
                    .suggestion(obj.getString("suggestion"))
                    .build();
        } catch (Exception e) {
            return AiAnalyzeVO.builder()
                    .score(null)
                    .riskLevel(null)
                    .summary(content)
                    .suggestion(content)
                    .build();
        }
    }

    private AiAnalysisResult parseAiAnalysisResult(String content) {
        if (!StringUtils.hasText(content)) {
            return AiAnalysisResult.builder()
                    .score(80)
                    .riskLevel(0)
                    .riskMsg("未获取到AI结果，默认标记为低风险")
                    .build();
        }
        try {
            String cleaned = extractJsonObject(content);
            JSONObject obj = JSON.parseObject(cleaned);
            int score = obj.getInteger("score") == null ? 80 : obj.getInteger("score");
            int riskLevel = obj.getInteger("riskLevel") == null ? 0 : obj.getInteger("riskLevel");
            String riskMsg = obj.getString("riskMsg");
            if (!StringUtils.hasText(riskMsg)) {
                riskMsg = obj.getString("summary");
            }
            if (!StringUtils.hasText(riskMsg)) {
                riskMsg = "分析成功";
            }
            return AiAnalysisResult.builder()
                    .score(score)
                    .riskLevel(riskLevel)
                    .riskMsg(riskMsg)
                    .build();
        } catch (Exception e) {
            log.warn("解析 AI 风险结果失败，使用默认低风险: {}", content, e);
            return AiAnalysisResult.builder()
                    .score(80)
                    .riskLevel(0)
                    .riskMsg("AI 解析失败，默认标记为低风险")
                    .build();
        }
    }

    private String extractJsonObject(String content) {
        String trimmed = content.trim();

        Pattern block = Pattern.compile("```(?:json)?\\s*(\\{[\\s\\S]*?\\})\\s*```", Pattern.CASE_INSENSITIVE);
        Matcher matcher = block.matcher(trimmed);
        if (matcher.find()) {
            trimmed = matcher.group(1);
        }

        if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }

        int left = trimmed.indexOf('{');
        int right = trimmed.lastIndexOf('}');
        if (left >= 0 && right > left) {
            trimmed = trimmed.substring(left, right + 1);
        }

        return trimmed;
    }

    private String callAliyunOcr(byte[] imageBytes, String imageUrl) {
        String url = aiProperties.getOcrUrl();
        String appCode = aiProperties.getOcrAppCode();
        if (!StringUtils.hasText(url) || !StringUtils.hasText(appCode)) {
            throw new RuntimeException("OCR 接口配置缺失");
        }

        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPost post = new HttpPost(url);
            post.setHeader("Content-Type", "application/json");
            post.setHeader("Authorization", "APPCODE " + appCode);

            Map<String, Object> body = new HashMap<>();
            if (imageBytes != null && imageBytes.length > 0) {
                String base64 = Base64.getEncoder().encodeToString(imageBytes);
                body.put("img", base64);
            } else if (imageUrl != null && !imageUrl.isEmpty()) {
                body.put("url", imageUrl);
            } else {
                throw new RuntimeException("OCR 调用缺少图片数据");
            }
            StringEntity entity = new StringEntity(JSON.toJSONString(body), StandardCharsets.UTF_8);
            post.setEntity(entity);

            try (CloseableHttpResponse response = client.execute(post)) {
                String resp = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
                log.info("Aliyun OCR resp: {}", resp);
                JSONObject json = JSON.parseObject(resp);

                String content = json.getString("content");
                if (StringUtils.hasText(content)) {
                    return content;
                }
                if (json.containsKey("prism_wordsInfo")) {
                    try {
                        List<String> words = json.getJSONArray("prism_wordsInfo").stream()
                                .map(obj -> ((JSONObject) obj).getString("word"))
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList());
                        if (!words.isEmpty()) {
                            return String.join("\n", words);
                        }
                    } catch (Exception ignored) {
                        // ignore
                    }
                }
                return resp;
            }
        } catch (Exception e) {
            log.error("调用阿里云 OCR 失败", e);
            throw new RuntimeException("OCR 识别失败，请稍后重试");
        }
    }
}
