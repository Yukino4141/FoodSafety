package com.itheima.server.interceptor;

import com.itheima.common.context.BaseContext;
import com.itheima.common.properties.JwtProperties;
import com.itheima.common.untils.JwtUtil;

import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
@Slf4j
public class JwtTokenUserInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtProperties jwtProperties;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }

        // 1. 从请求头中获取令牌 (authentication)
        String token = request.getHeader(jwtProperties.getUserTokenName());
        
        // 如果标准头部没有获取到，尝试从其他常见头部获取（兼容微信小程序）
        if (token == null || token.trim().isEmpty()) {
            token = request.getHeader("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
        }
        
        if (token == null || token.trim().isEmpty()) {
            token = request.getHeader("token");
        }

        try {
            log.info("C端用户拦截器: jwt校验: {}", token);
            Claims claims = JwtUtil.parseJWT(jwtProperties.getUserSecretKey(), token);
            Long userId = Long.valueOf(claims.get("userId").toString());

            // 存入 Context
            BaseContext.setCurrentId(userId);

            log.info("当前用户ID: {}", userId);
            return true;
        } catch (Exception e) {
            log.error("JWT验证失败: {}", e.getMessage());
            response.setStatus(401);
            return false;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        BaseContext.removeCurrentId();
    }
}