package com.itheima.server.controller.user;

import com.itheima.common.result.Result;
import com.itheima.pojo.dto.AiAnalyzeDTO;
import com.itheima.pojo.vo.AiAnalyzeVO;
import com.itheima.pojo.vo.OcrResultVO;
import com.itheima.server.service.AiService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/user/ai")
@Api(tags = "C端-AI工具")
@Slf4j
public class AiController {

    @Autowired
    private AiService aiService;

    @PostMapping("/ocr")
    @ApiOperation("上传配料表图片进行OCR")
    public Result<OcrResultVO> ocr(MultipartFile file) {
        return Result.success(aiService.ocr(file));
    }

    @PostMapping("/analyze")
    @ApiOperation("AI健康分析")
    public Result<AiAnalyzeVO> analyze(@RequestBody AiAnalyzeDTO dto) {
        return Result.success(aiService.analyze(dto));
    }
}
