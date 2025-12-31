package com.itheima.server.service;

import com.itheima.pojo.dto.UserLoginDTO;
import com.itheima.pojo.vo.UserLoginVO;

/**
 * 用户服务接口
 */
public interface UserService {

    /**
     * 微信登录
     * @param userLoginDTO 微信授权码
     * @return 用户登录信息（含Token）
     */
    UserLoginVO wxLogin(UserLoginDTO userLoginDTO);
    
    /**
     * 获取总用户数
     * @return 总用户数
     */
    Integer getTotalUsers();
}
