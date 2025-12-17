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
public class JwtTokenAdminInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtProperties jwtProperties;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 判断当前拦截到的是Controller的方法还是其他资源
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }

        // 1. 从请求头中获取令牌
        String token = request.getHeader(jwtProperties.getAdminTokenName());

        // 2. 校验令牌
        try {
            log.info("管理端拦截器: jwt校验: {}", token);
            Claims claims = JwtUtil.parseJWT(jwtProperties.getAdminSecretKey(), token);
            Long empId = Long.valueOf(claims.get("empId").toString());

            // 3. 将用户ID存入 ThreadLocal
            BaseContext.setCurrentId(empId);

            log.info("当前员工ID: {}", empId);
            return true;
        } catch (Exception e) {
            // 4. 不通过，响应 401 状态码
            response.setStatus(401);
            return false;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        // 清理 ThreadLocal，防止内存泄漏
        BaseContext.removeCurrentId();
    }
}