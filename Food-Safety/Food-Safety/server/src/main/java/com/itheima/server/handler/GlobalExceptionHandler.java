package com.itheima.server.handler;

import com.itheima.common.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.sql.SQLIntegrityConstraintViolationException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * 捕获 SQL 异常 (如: 唯一键冲突)
     */
    @ExceptionHandler(SQLIntegrityConstraintViolationException.class)
    public Result exceptionHandler(SQLIntegrityConstraintViolationException ex) {
        // 错误信息示例: Duplicate entry 'zhangsan' for key 'idx_username'
        String message = ex.getMessage();
        if (message.contains("Duplicate entry")) {
            String[] split = message.split(" ");
            String username = split[2];
            String msg = username + " 已存在";
            return Result.error(msg);
        } else {
            return Result.error("未知数据库错误");
        }
    }

    /**
     * 捕获所有未知的 Exception
     */
    @ExceptionHandler(Exception.class)
    public Result exceptionHandler(Exception ex) {
        log.error("系统异常信息：{}", ex.getMessage());
        ex.printStackTrace();
        return Result.error(ex.getMessage());
    }
}