package com.itheima.common.untils;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.itheima.common.properties.AliOssProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Component
public class AliOssUtil {

    @Autowired
    private AliOssProperties aliOssProperties;

    private String endpoint;
    private String accessKeyId;
    private String accessKeySecret;
    private String bucketName;

    public AliOssUtil(String endpoint, String accessKeyId, String accessKeySecret, String bucketName) {
        this.endpoint = endpoint;
        this.accessKeyId = accessKeyId;
        this.accessKeySecret = accessKeySecret;
        this.bucketName = bucketName;
    }

    /**
     * 上传文件到阿里云OSS
     * @param file 上传的文件
     * @return 文件访问URL
     * @throws IOException
     */
    public String upload(MultipartFile file) throws IOException {
        // 获取原始文件名
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("文件名不能为空");
        }

        // 获取文件扩展名
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf(".");
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }

        // 使用UUID生成新文件名
        String objectName = generateObjectName(extension);

        // 创建OSSClient实例
        OSS ossClient = new OSSClientBuilder().build(
                aliOssProperties.getEndpoint(),
                aliOssProperties.getAccessKeyId(),
                aliOssProperties.getAccessKeySecret());

        try {
            // 上传文件流
            InputStream inputStream = file.getInputStream();
            ossClient.putObject(aliOssProperties.getBucketName(), objectName, inputStream);

            // 返回完整的URL
            return String.format("https://%s.%s/%s",
                    aliOssProperties.getBucketName(),
                    aliOssProperties.getEndpoint(),
                    objectName);
        } finally {
            if (ossClient != null) {
                ossClient.shutdown();
            }
        }
    }

    /**
     * 生成对象名（路径+文件名）
     * @param extension 文件扩展名
     * @return 对象名
     */
    private String generateObjectName(String extension) {
        // 按日期生成目录：yyyy/MM/dd
        String datePath = LocalDate.now()
                .format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));

        // 使用UUID作为文件名
        String fileName = UUID.randomUUID().toString().replace("-", "") + extension;

        // 组合成完整路径
        return datePath + "/" + fileName;
    }
}