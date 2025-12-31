package com.itheima.server.controller.user;

import com.itheima.common.result.Result;
import com.itheima.pojo.dto.FamilyMemberDTO;
import com.itheima.server.service.FamilyMemberService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user/family")
@Api(tags = "C端-家庭成员")
@Slf4j
public class FamilyMemberController {

    @Autowired
    private FamilyMemberService familyMemberService;

    @PostMapping
    @ApiOperation("新增家庭成员")
    public Result<String> add(@RequestBody FamilyMemberDTO dto) {
        familyMemberService.addMember(dto);
        return Result.success("success");
    }
}
