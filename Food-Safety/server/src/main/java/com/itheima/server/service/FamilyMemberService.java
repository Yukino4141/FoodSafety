package com.itheima.server.service;

import com.itheima.pojo.dto.FamilyMemberDTO;
import com.itheima.pojo.vo.FamilyMemberVO;

public interface FamilyMemberService {
    void addMember(FamilyMemberDTO dto);

    java.util.List<FamilyMemberVO> listMembers();

    void updateMember(Long id, FamilyMemberDTO dto);

    void deleteMember(Long id);
}
