package com.itheima.server.controller.user;

import com.itheima.common.result.PageResult;
import com.itheima.common.result.Result;
import com.itheima.pojo.dto.CommentDTO;
import com.itheima.pojo.dto.LikeDTO;
import com.itheima.pojo.dto.PostDTO;
import com.itheima.pojo.vo.CommentVO;
import com.itheima.pojo.vo.PostVO;
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

    @GetMapping("/{id}")
    @ApiOperation("帖子详情")
    public Result<PostVO> detail(@PathVariable Long id) {
        return Result.success(communityService.detail(id));
    }

    @GetMapping("/my-posts")
    @ApiOperation("我的帖子")
    public Result<PageResult> myPosts(@RequestParam(defaultValue = "1") Integer page,
                                      @RequestParam(defaultValue = "10") Integer pageSize) {
        return Result.success(communityService.myPosts(page, pageSize));
    }

    @PostMapping("/comment")
    @ApiOperation("发表评论")
    public Result<Long> comment(@RequestBody CommentDTO dto) {
        return Result.success(communityService.comment(dto));
    }

    @GetMapping("/comment/list")
    @ApiOperation("评论列表")
    public Result<PageResult> commentList(@RequestParam Long postId,
                                          @RequestParam(defaultValue = "1") Integer page,
                                          @RequestParam(defaultValue = "10") Integer pageSize) {
        return Result.success(communityService.commentList(postId, page, pageSize));
    }
}
