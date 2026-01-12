package com.itheima.server.service.impl;

import com.alibaba.fastjson.JSON;
import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.itheima.common.context.BaseContext;
import com.itheima.common.result.PageResult;
import com.itheima.pojo.dto.CommentDTO;
import com.itheima.pojo.dto.LikeDTO;
import com.itheima.pojo.dto.PostDTO;
import com.itheima.pojo.entity.CommunityPost;
import com.itheima.pojo.entity.PostComment;
import com.itheima.pojo.entity.PostLike;
import com.itheima.pojo.vo.CommentVO;
import com.itheima.pojo.vo.PostVO;
import com.itheima.server.mapper.CommunityPostMapper;
import com.itheima.server.mapper.PostCommentMapper;
import com.itheima.server.mapper.PostLikeMapper;
import com.itheima.server.mapper.UserPointsMapper;
import com.itheima.server.service.CommunityService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CommunityServiceImpl implements CommunityService {

    @Autowired
    private CommunityPostMapper communityPostMapper;

    @Autowired
    private UserPointsMapper userPointsMapper;

    @Autowired
    private PostLikeMapper postLikeMapper;

    @Autowired
    private PostCommentMapper postCommentMapper;

    @Override
    public void publish(PostDTO dto) {
        Long userId = BaseContext.getCurrentId();
        CommunityPost post = CommunityPost.builder()
                .userId(userId)
                .title(dto.getTitle())
                .content(dto.getContent())
                .images(dto.getImages() == null ? null : JSON.toJSONString(dto.getImages()))
                .likeCount(0)
                .viewCount(0)
                .createTime(LocalDateTime.now())
                .build();
        communityPostMapper.insert(post);
    }

    @Override
    public PageResult feed(Integer page, Integer pageSize, String sort) {
        PageHelper.startPage(page, pageSize);
        List<CommunityPost> raw;
        if ("hot".equalsIgnoreCase(sort)) {
            raw = communityPostMapper.listHot();
        } else {
            raw = communityPostMapper.listLatest();
        }
        Page<CommunityPost> p = (Page<CommunityPost>) raw;
        List<PostVO> records = p.getResult().stream()
                .map(this::enrich)
                .collect(Collectors.toList());
        return new PageResult(p.getTotal(), records);
    }

    @Override
    public void like(LikeDTO dto) {
        CommunityPost post = communityPostMapper.getById(dto.getPostId());
        if (post == null) {
            throw new RuntimeException("帖子不存在");
        }
        Long userId = BaseContext.getCurrentId();
        PostLike existing = postLikeMapper.getByUserAndPost(dto.getPostId(), userId);
        int likeCount = post.getLikeCount() == null ? 0 : post.getLikeCount();
        if (Boolean.TRUE.equals(dto.getIsLike())) {
            if (existing == null) {
                PostLike like = PostLike.builder()
                        .postId(dto.getPostId())
                        .userId(userId)
                        .createTime(LocalDateTime.now())
                        .build();
                postLikeMapper.insert(like);
                likeCount += 1;
            }
        } else {
            if (existing != null) {
                postLikeMapper.deleteById(existing.getId());
                if (likeCount > 0) {
                    likeCount -= 1;
                }
            }
        }
        communityPostMapper.updateLikeCount(dto.getPostId(), likeCount);
    }

    @Override
    public PostVO detail(Long id) {
        CommunityPost post = communityPostMapper.getById(id);
        if (post == null) {
            throw new RuntimeException("帖子不存在");
        }
        post.setViewCount((post.getViewCount() == null ? 0 : post.getViewCount()) + 1);
        communityPostMapper.updateViewCount(post.getId(), post.getViewCount());
        return enrich(post);
    }

    @Override
    public PageResult myPosts(Integer page, Integer pageSize) {
        Long userId = BaseContext.getCurrentId();
        PageHelper.startPage(page, pageSize);
        List<CommunityPost> raw = communityPostMapper.listByUserId(userId);
        Page<CommunityPost> p = (Page<CommunityPost>) raw;
        List<PostVO> records = p.getResult().stream()
                .map(this::enrich)
                .collect(Collectors.toList());
        return new PageResult(p.getTotal(), records);
    }

    @Override
    public Long comment(CommentDTO dto) {
        if (dto.getPostId() == null || !StringUtils.hasText(dto.getContent())) {
            throw new RuntimeException("参数不完整");
        }
        CommunityPost post = communityPostMapper.getById(dto.getPostId());
        if (post == null) {
            throw new RuntimeException("帖子不存在");
        }
        Long userId = BaseContext.getCurrentId();
        PostComment comment = PostComment.builder()
                .postId(dto.getPostId())
                .userId(userId)
                .content(dto.getContent())
                .createTime(LocalDateTime.now())
                .status(1)
                .build();
        postCommentMapper.insert(comment);
        return comment.getId();
    }

    @Override
    public PageResult commentList(Long postId, Integer page, Integer pageSize) {
        PageHelper.startPage(page, pageSize);
        List<PostComment> raw = postCommentMapper.listByPostId(postId);
        Page<PostComment> p = (Page<PostComment>) raw;
        List<CommentVO> records = p.getResult().stream()
                .filter(Objects::nonNull)
                .map(pc -> CommentVO.builder()
                        .id(pc.getId())
                        .postId(pc.getPostId())
                        .userId(pc.getUserId())
                        .content(pc.getContent())
                        .createTime(pc.getCreateTime())
                        .build())
                .collect(Collectors.toList());
        return new PageResult(p.getTotal(), records);
    }

    private PostVO toVO(CommunityPost post) {
        PostVO vo = new PostVO();
        BeanUtils.copyProperties(post, vo);
        vo.setImages(post.getImages() == null ? null : JSON.parseArray(post.getImages(), String.class));
        return vo;
    }

    private PostVO enrich(CommunityPost post) {
        PostVO vo = toVO(post);
        Long postId = post.getId();
        vo.setCommentCount(postCommentMapper.countByPostId(postId));
        Long userId = BaseContext.getCurrentId();
        if (userId != null) {
            vo.setLiked(postLikeMapper.getByUserAndPost(postId, userId) != null);
        }
        return vo;
    }
}
