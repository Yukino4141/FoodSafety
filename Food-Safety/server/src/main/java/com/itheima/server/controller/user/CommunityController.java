package com.itheima.server.controller.user;

import com.itheima.common.result.PageResult;
import com.itheima.common.result.Result;
import com.itheima.pojo.dto.LikeDTO;
import com.itheima.pojo.dto.PostDTO;
import com.itheima.server.service.CommunityService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user/community")
@Api(tags = "C端-社区互动")
@Slf4j
public class CommunityController {

    @Autowired
    private CommunityService communityService;

    @PostMapping("/post")
    @ApiOperation("发布帖子")
    public Result<String> publish(@RequestBody PostDTO dto) {
        communityService.publish(dto);
        return Result.success("success");
    }

    @GetMapping("/feed")
    @ApiOperation("获取帖子列表")
    public Result<PageResult> feed(@RequestParam(defaultValue = "1") Integer page,
                                   @RequestParam(defaultValue = "10") Integer pageSize,
                                   @RequestParam(defaultValue = "latest") String sort) {
        return Result.success(communityService.feed(page, pageSize, sort));
    }

    @PostMapping("/like")
    @ApiOperation("点赞帖子")
    public Result<String> like(@RequestBody LikeDTO dto) {
        communityService.like(dto);
        return Result.success("success");
    }
}
