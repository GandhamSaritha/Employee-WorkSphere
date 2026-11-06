package com.spring.empportal.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spring.empportal.model.Employee;
import com.spring.empportal.repo.EmployeeRepo;

@RestController
@RequestMapping("emp")
public class Employeecontroller {
	
	@Autowired
	EmployeeRepo employeeRepo ;
	
	//checking purpose
	@GetMapping("/hello")
	public String Hello() {
		return "hi";
	}

	//Employee data add method by post method
	//http://localhost:8183/emp/add
	@PostMapping("/add")
	public String createEmp(@RequestBody Employee emp) {	
		employeeRepo.save(emp);	
		return "Done";
	}
	
	//Employee data get method by get method
	// http://localhost:8183/emp/getAllEmps
	@GetMapping("/getAllEmps")
	public List<Employee> GetAllEmp() {
		return employeeRepo.findAll() ;
	}
	
	// http://localhost:8183/emp/getEmp/1
	@GetMapping("/getEmp/{eid}")
	Employee getEmployee(@PathVariable Integer eid) {
		return employeeRepo.findById(eid). orElseThrow();
	}
	
	// http://localhost:8183/emp/updateEmp/5
	@PutMapping("updateEmp/{eid}")
	Employee updateEmployee(@RequestBody Employee employee, @PathVariable Integer eid) {
		Employee empfromDb = getEmployee (eid);
		empfromDb.setAge(employee.getAge());
		empfromDb.setCity(employee.getCity());
		empfromDb.setEname(employee.getEname());
		empfromDb.setState(employee.getState());
		empfromDb.setSalary(employee.getSalary());
	return employeeRepo.save(empfromDb);
	}
	
	//http://localhost:8183/emp/delEmp/5
	@DeleteMapping("/delEmp/{eid}")
	String deleteEmployee(@PathVariable Integer eid) {
		employeeRepo.deleteById(eid);
		return "Employee has been deleted successfully with id of !!" + eid;
	}

}
