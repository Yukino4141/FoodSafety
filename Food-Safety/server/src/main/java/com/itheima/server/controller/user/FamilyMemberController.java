package com.itheima.server.controller.user;

import com.itheima.common.result.Result;
import com.itheima.pojo.dto.FamilyMemberDTO;
import com.itheima.pojo.vo.FamilyMemberVO;
import com.itheima.server.service.FamilyMemberService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
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

    @GetMapping("/list")
    @ApiOperation("家庭成员列表")
    public Result<java.util.List<FamilyMemberVO>> list() {
        return Result.success(familyMemberService.listMembers());
    }

    @PutMapping("/{id}")
    @ApiOperation("更新家庭成员")
    public Result<String> update(@PathVariable Long id, @RequestBody FamilyMemberDTO dto) {
        familyMemberService.updateMember(id, dto);
        return Result.success("success");
    }

    @DeleteMapping("/{id}")
    @ApiOperation("删除家庭成员")
    public Result<String> delete(@PathVariable Long id) {
        familyMemberService.deleteMember(id);
        return Result.success("success");
    }
}
