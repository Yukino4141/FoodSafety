package com.itheima.server.controller.admin;

import com.itheima.common.result.Result;
import com.itheima.pojo.dto.EmployeeLoginDTO;
import com.itheima.pojo.entity.Employee;
import com.itheima.pojo.vo.EmployeeLoginVO;
import com.itheima.server.service.EmployeeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/admin/employee")
// 解决跨域问题（必加，否则前端刷新token会报CORS错误）
@CrossOrigin(origins = "*")
public class AdminEmployeeController {

    @Autowired
    private EmployeeService employeeService;

    /**
     * 管理员登录
     * @param employeeLoginDTO 登录参数
     * @return 登录结果
     */
    @PostMapping("/login")
    public Result<EmployeeLoginVO> login(@Validated @RequestBody EmployeeLoginDTO employeeLoginDTO) {
        log.info("管理员登录：{}", employeeLoginDTO.getUsername());

        EmployeeLoginVO employeeLoginVO = employeeService.login(employeeLoginDTO);

        return Result.success(employeeLoginVO);
    }

    /**
     * 退出登录
     * @return 退出结果
     */
    @PostMapping("/logout")
    public Result<String> logout() {
        // 在实际应用中，可以在这里处理token失效逻辑
        // 但通常JWT是无状态的，所以只需要前端清除token即可
        return Result.success("退出成功");
    }


}