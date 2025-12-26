package com.itheima.server.interceptor;

import com.itheima.common.context.BaseContext;
import com.itheima.common.untils.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * 管理端JWT令牌验证拦截器
 */
@Slf4j
@Component
public class JwtTokenAdminInterceptor implements HandlerInterceptor {

    @Value("${food-safety.jwt.admin-secret-key}")
    private String adminSecretKey;

    /**
     * 校验管理端JWT令牌
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 1. 判断当前拦截到的是Controller的方法还是其他资源
        if (!(handler instanceof HandlerMethod)) {
            // 当前拦截到的不是动态方法，直接放行
            return true;
        }

        // 2. 从请求头中获取令牌
        String token = request.getHeader("token");
        log.debug("拦截器接收到Token：{}，请求路径：{}", token, request.getRequestURI());

        // 3. 校验令牌是否存在
        if (token == null || token.trim().isEmpty()) {
            log.error("令牌为空，拒绝访问路径：{}", request.getRequestURI());
            sendUnauthorizedResponse(response, "NOT_LOGIN");
            return false;
        }

        try {
            // 4. 解析令牌
            Claims claims = JwtUtil.parseJWT(adminSecretKey, token);

            // 5. 获取员工ID
            Object empIdObj = claims.get("empId");
            if (empIdObj == null) {
                log.error("Token中缺少empId字段");
                sendUnauthorizedResponse(response, "INVALID_TOKEN");
                return false;
            }

            // 6. 转换为Long类型
            Long empId = convertToLong(empIdObj);
            if (empId == null) {
                log.error("empId格式错误：{}", empIdObj);
                sendUnauthorizedResponse(response, "INVALID_TOKEN");
                return false;
            }

            log.debug("JWT验证通过，员工ID：{}，路径：{}", empId, request.getRequestURI());

            // 7. 将员工ID存入ThreadLocal
            BaseContext.setCurrentId(empId);

            return true;
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.error("Token已过期：{}", e.getMessage());
            sendUnauthorizedResponse(response, "TOKEN_EXPIRED");
            return false;
        } catch (io.jsonwebtoken.SignatureException e) {
            log.error("Token签名无效：{}", e.getMessage());
            sendUnauthorizedResponse(response, "INVALID_SIGNATURE");
            return false;
        } catch (Exception e) {
            log.error("JWT令牌验证失败：{}，路径：{}", e.getMessage(), request.getRequestURI());
            sendUnauthorizedResponse(response, "INVALID_TOKEN");
            return false;
        }
    }

    /**
     * 将对象转换为Long类型
     */
    private Long convertToLong(Object obj) {
        if (obj == null) {
            return null;
        }

        try {
            if (obj instanceof Integer) {
                return ((Integer) obj).longValue();
            } else if (obj instanceof Long) {
                return (Long) obj;
            } else if (obj instanceof String) {
                return Long.parseLong((String) obj);
            } else if (obj instanceof Number) {
                return ((Number) obj).longValue();
            }
        } catch (NumberFormatException e) {
            log.error("转换empId为Long时发生错误：{}", e.getMessage());
        }

        return null;
    }

    /**
     * 发送未授权响应
     */
    private void sendUnauthorizedResponse(HttpServletResponse response, String msg) throws Exception {
        response.setStatus(401);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"code\":0,\"msg\":\"" + msg + "\",\"data\":null}");
    }

    /**
     * 清理ThreadLocal，防止内存泄漏
     */
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        BaseContext.removeCurrentId();
    }
}