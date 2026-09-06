package com.aceinterview.backend.controller;

import com.aceinterview.backend.entity.Question;
import com.aceinterview.backend.repository.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
    private final CompanyRepository companies; private final TechRoleRepository roles;
    private final InterviewTypeRepository types; private final QuestionRepository questions;
    public CatalogController(CompanyRepository companies, TechRoleRepository roles, InterviewTypeRepository types, QuestionRepository questions) {
        this.companies=companies; this.roles=roles; this.types=types; this.questions=questions;
    }
    @GetMapping
    public Map<String,Object> catalog() {
        return Map.of(
                "companies", companies.findByActiveTrueOrderByDisplayOrderAsc().stream().map(c->c.getName()).toList(),
                "roles", roles.findByActiveTrueOrderByDisplayOrderAsc().stream().map(r->r.getName()).toList(),
                "interviewTypes", types.findByActiveTrueOrderByDisplayOrderAsc().stream().map(t->t.getName()).toList());
    }
    @GetMapping("/availability")
    public List<Map<String,Object>> availability(@RequestParam String role, @RequestParam String interviewType, @RequestParam(required=false) String company) {
        Map<String,Long> counts=new TreeMap<>();
        for(Question q:questions.findByActiveTrue()) if("Approved".equals(q.getReviewStatus()) && q.getTechRole().getName().equals(role) && q.getInterviewType().getName().equals(interviewType) && (q.getCompany()==null || Objects.equals(q.getCompany().getName(),company))) counts.merge(q.getTopic(),1L,Long::sum);
        return counts.entrySet().stream().map(e->Map.<String,Object>of("topic",e.getKey(),"count",e.getValue())).toList();
    }
}
