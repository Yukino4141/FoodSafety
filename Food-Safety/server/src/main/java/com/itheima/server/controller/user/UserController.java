package com.itheima.server.controller.user;

import com.itheima.common.result.Result;
import com.itheima.pojo.dto.UserLoginDTO;
import com.itheima.pojo.vo.UserLoginVO;
import com.itheima.server.service.UserService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户端-用户控制器
 */
@RestController
@RequestMapping("/user/user")
@Api(tags = "C端-用户接口")
@Slf4j
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * 微信登录
     * @param userLoginDTO 微信授权码
     * @return 用户登录信息（含Token）
     */
    @PostMapping("/login")
    @ApiOperation("微信登录")
    public Result<UserLoginVO> login(@RequestBody UserLoginDTO userLoginDTO) {
        log.info("微信登录，授权码: {}", userLoginDTO.getCode());
        
        UserLoginVO userLoginVO = userService.wxLogin(userLoginDTO);
        
        return Result.success(userLoginVO);
    }
}
