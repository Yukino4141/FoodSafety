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

        try {
            log.info("C端用户拦截器: jwt校验: {}", token);
            Claims claims = JwtUtil.parseJWT(jwtProperties.getUserSecretKey(), token);
            Long userId = Long.valueOf(claims.get("userId").toString());

            // 存入 Context
            BaseContext.setCurrentId(userId);

            log.info("当前用户ID: {}", userId);
            return true;
        } catch (Exception e) {
            response.setStatus(401);
            return false;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        BaseContext.removeCurrentId();
    }
}