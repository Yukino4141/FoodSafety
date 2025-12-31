package com.itheima.server.service;

import com.itheima.pojo.dto.AiAnalyzeDTO;
import com.itheima.pojo.vo.AiAnalyzeVO;
import com.itheima.pojo.vo.OcrResultVO;
import org.springframework.web.multipart.MultipartFile;

public interface AiService {

    OcrResultVO ocr(MultipartFile file);

    AiAnalyzeVO analyze(AiAnalyzeDTO dto);
}
