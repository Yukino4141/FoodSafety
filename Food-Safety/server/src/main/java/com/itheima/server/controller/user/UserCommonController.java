package com.itheima.server.controller.user;

import com.itheima.common.result.Result;
import com.itheima.common.untils.AliOssUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

/**
 * 用户端通用接口
 */
@RestController
@RequestMapping("/user/common")
@Api(tags = "C端-通用接口")
@Slf4j
public class UserCommonController {

    @Autowired
    private AliOssUtil aliOssUtil;

    // 允许的文件类型
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"
    );

    // 最大文件大小：5MB
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    @PostMapping("/upload")
    @ApiOperation("文件上传")
    public Result<String> upload(MultipartFile file) {
        log.info("用户端文件上传：文件名={}, 大小={}B",
                file.getOriginalFilename(), file.getSize());

        // 1. 文件大小校验
        if (file.isEmpty()) {
            log.error("上传文件为空");
            return Result.error("文件不能为空");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            log.error("文件大小超过限制：{}B > {}B", file.getSize(), MAX_FILE_SIZE);
            return Result.error("文件大小不能超过5MB");
        }

        // 2. 文件类型校验
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            log.error("文件名无效");
            return Result.error("文件名无效");
        }
        
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            log.error("不支持的文件类型：{}", extension);
            return Result.error("只支持jpg、png、jpeg格式的图片");
        }

        try {
            // 3. 上传到阿里云OSS
            String url = aliOssUtil.upload(file);
            log.info("用户端文件上传成功：{}", url);

            return Result.success(url);
        } catch (Exception e) {
            log.error("文件上传失败：{}", e.getMessage(), e);
            return Result.error("文件上传失败");
        }
    }
}
