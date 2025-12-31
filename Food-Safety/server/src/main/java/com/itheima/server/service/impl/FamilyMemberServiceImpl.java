package com.itheima.server.service.impl;

import com.alibaba.fastjson.JSON;
import com.itheima.common.context.BaseContext;
import com.itheima.pojo.dto.FamilyMemberDTO;
import com.itheima.pojo.entity.FamilyMember;
import com.itheima.server.mapper.FamilyMemberMapper;
import com.itheima.server.service.FamilyMemberService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
public class FamilyMemberServiceImpl implements FamilyMemberService {

    @Autowired
    private FamilyMemberMapper familyMemberMapper;

    @Override
    public void addMember(FamilyMemberDTO dto) {
        Long userId = BaseContext.getCurrentId();
        FamilyMember member = FamilyMember.builder()
                .userId(userId)
                .name(dto.getName())
                .age(dto.getAge())
                .healthTags(dto.getHealthTags() == null ? null : JSON.toJSONString(dto.getHealthTags()))
                .createTime(LocalDateTime.now())
                .build();
        familyMemberMapper.insert(member);
        log.info("新增家庭成员，用户:{}, 成员:{}", userId, dto.getName());
    }
}
