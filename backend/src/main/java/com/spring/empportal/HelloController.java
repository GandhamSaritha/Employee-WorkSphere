package com.spring.empportal;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spring.empportal.model.Employee;
import com.spring.empportal.repo.EmployeeRepo;

@RestController
public class HelloController {
	
	@Autowired
	EmployeeRepo employeeRepo ;
	
	@RequestMapping("/hello")
	String hello() {
		return "spring Boot is Comedy!!!";
	}
	// http://localhost:8183/emp/getAllEmps
		@GetMapping("/getEmpList")
		List<Employee> getAllEmployeeDetails(){
			return employeeRepo.findAll();
		}
				
	

}
