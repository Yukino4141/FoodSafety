package com.itheima.server.service.impl;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.itheima.common.properties.JwtProperties;
import com.itheima.common.untils.HttpClientUtil;
import com.itheima.common.untils.JwtUtil;
import com.itheima.pojo.dto.UserLoginDTO;
import com.itheima.pojo.entity.User;
import com.itheima.pojo.vo.UserLoginVO;
import com.itheima.server.mapper.UserMapper;
import com.itheima.server.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 用户服务实现类
 */
@Service
@Slf4j
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private JwtProperties jwtProperties;

    // 微信接口地址
    private static final String WX_LOGIN_URL = "https://api.weixin.qq.com/sns/jscode2session";

    @Value("${food-safety.wechat.appid}")
    private String appid;

    @Value("${food-safety.wechat.secret}")
    private String secret;

    /**
     * 微信登录
     * @param userLoginDTO 微信授权码
     * @return 用户登录信息（含Token）
     */
    @Override
    public UserLoginVO wxLogin(UserLoginDTO userLoginDTO) {
        String code = userLoginDTO.getCode();
        
        // 1. 调用微信接口，获取 openid
        String openid = getOpenid(code);
        
        if (openid == null) {
            throw new RuntimeException("微信登录失败，请重试");
        }

        // 2. 判断用户是否已存在
        User user = userMapper.getByOpenid(openid);
        
        // 3. 如果不存在，自动注册
        if (user == null) {
            user = User.builder()
                    .openid(openid)
                    .createTime(LocalDateTime.now())
                    .build();
            userMapper.insert(user);
            log.info("新用户自动注册，openid: {}", openid);
        }

        // 4. 生成 JWT 令牌
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        
        String token = JwtUtil.createJWT(
                jwtProperties.getUserSecretKey(),
                jwtProperties.getUserTtl(),
                claims
        );

        // 5. 封装返回对象
        UserLoginVO userLoginVO = UserLoginVO.builder()
                .id(user.getId())
                .openid(openid)
                .token(token)
                .build();

        return userLoginVO;
    }

    /**
     * 调用微信接口获取 openid
     * @param code 临时票据
     * @return openid
     */
    private String getOpenid(String code) {
        Map<String, String> params = new HashMap<>();
        params.put("appid", appid);
        params.put("secret", secret);
        params.put("js_code", code);
        params.put("grant_type", "authorization_code");

        String json = HttpClientUtil.doGet(WX_LOGIN_URL, params);
        log.info("微信接口返回: {}", json);

        JSONObject jsonObject = JSON.parseObject(json);
        String openid = jsonObject.getString("openid");
        
        return openid;
    }
}
