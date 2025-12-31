package com.itheima.server.controller.user;

import com.itheima.common.result.Result;
import com.itheima.pojo.dto.ProfileDTO;
import com.itheima.pojo.vo.ProfileVO;
import com.itheima.server.service.UserProfileService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user/profile")
@Api(tags = "C端-用户画像")
@Slf4j
public class ProfileController {

    @Autowired
    private UserProfileService userProfileService;

    @GetMapping
    @ApiOperation("获取当前用户画像")
    public Result<ProfileVO> getProfile() {
        return Result.success(userProfileService.getProfile());
    }

    @PostMapping
    @ApiOperation("设置/更新用户画像")
    public Result<ProfileVO> updateProfile(@RequestBody ProfileDTO dto) {
        return Result.success(userProfileService.upsertProfile(dto));
    }
}
