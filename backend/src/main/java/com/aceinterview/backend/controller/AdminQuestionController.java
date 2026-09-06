package com.aceinterview.backend.controller;

import com.aceinterview.backend.entity.*;
import com.aceinterview.backend.repository.*;
import com.aceinterview.backend.service.EvidenceGroupValidator;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/admin/questions")
@Transactional
public class AdminQuestionController {
    private static final Set<String> REVIEW_STATUSES=Set.of("Draft","Review","Approved","Retired");
    private static final Set<String> IMPORTANCE_LEVELS=Set.of("CORE","SUPPORTING");
    private static final Set<String> TERM_TYPES=Set.of("TERM","ALTERNATIVE","INCORRECT");
    private final QuestionRepository questions;private final RubricCriterionRepository rubrics;private final RubricEvidenceGroupRepository groups;private final EvidenceTermRepository terms;private final TechRoleRepository roles;private final InterviewTypeRepository types;private final CompanyRepository companies;private final EvidenceGroupValidator validator;

    public AdminQuestionController(QuestionRepository questions,RubricCriterionRepository rubrics,RubricEvidenceGroupRepository groups,EvidenceTermRepository terms,TechRoleRepository roles,InterviewTypeRepository types,CompanyRepository companies,EvidenceGroupValidator validator){this.questions=questions;this.rubrics=rubrics;this.groups=groups;this.terms=terms;this.roles=roles;this.types=types;this.companies=companies;this.validator=validator;}

    @GetMapping public List<QuestionAdminResponse> list(){return questions.findByReviewStatusNotOrderByIdAsc("Retired").stream().map(question->response(question,false)).toList();}
    @GetMapping("/{id}") public QuestionAdminResponse get(@PathVariable Long id){return response(find(id),true);}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public QuestionAdminResponse create(@RequestBody QuestionWriteRequest request){return save(new Question(),request);}
    @PutMapping("/{id}") public QuestionAdminResponse update(@PathVariable Long id,@RequestBody QuestionWriteRequest request){return save(find(id),request);}
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void retire(@PathVariable Long id){Question question=find(id);question.setActive(false);question.setReviewStatus("Retired");questions.save(question);}

    private QuestionAdminResponse save(Question question,QuestionWriteRequest request){
        validateQuestionRequest(request);
        question.setTechRole(roles.findByName(request.role()).orElseThrow(()->badRequest("Unknown role")));
        question.setInterviewType(types.findByName(request.interviewType()).orElseThrow(()->badRequest("Unknown interview type")));
        Company company=request.company()==null||request.company().isBlank()?null:companies.findByName(request.company()).orElseThrow(()->badRequest("Unknown company"));
        question.setCompany(company);question.setQuestionText(request.questionText().trim());question.setNormalizedText(normalize(request.questionText()));question.setCategory(request.interviewType());question.setTopic(request.topic().trim());question.setDifficulty(request.difficulty());question.setSourceType(company==null?"SHARED":"COMPANY_SPECIFIC");question.setExpectedAnswerSummary(request.expectedAnswerSummary().trim());question.setReviewStatus(request.reviewStatus());question.setActive("Approved".equals(request.reviewStatus()));question=questions.saveAndFlush(question);
        List<RubricCriterion> existing=rubrics.findByQuestionIdOrderByCriterionOrderAsc(question.getId());
        if(!existing.isEmpty()&&existing.size()!=5)throw new ResponseStatusException(HttpStatus.CONFLICT,"Existing question does not have exactly five rubric criteria");
        List<RubricCriterion> savedRubrics=new ArrayList<>();
        for(int index=0;index<5;index++){
            RubricWriteRequest source=request.rubrics().get(index);RubricCriterion target=existing.isEmpty()?new RubricCriterion():existing.get(index);
            target.setQuestion(question);target.setCriterionOrder(index+1);target.setCriterionName(required(source.name(),"Rubric name"));target.setDescription(required(source.description(),"Rubric description"));target.setExpectedEvidence(required(source.expectedEvidence(),"Expected evidence"));target.setAcceptableAlternatives(clean(source.acceptableAlternatives()));target.setKeywords(clean(source.keywords()));target.setWeight(source.weight());target.setImportance(IMPORTANCE_LEVELS.contains(source.importance())?source.importance():index<3?"CORE":"SUPPORTING");target.setSemanticDescription(source.semanticDescription()==null||source.semanticDescription().isBlank()?target.getExpectedEvidence():source.semanticDescription().trim());target.setRubricVersion(Math.max(2,source.rubricVersion()==null?2:source.rubricVersion()));target.setEvidenceStatus("DRAFT");target=rubrics.saveAndFlush(target);replaceEvidenceGroups(target,source.evidenceGroups());savedRubrics.add(target);
        }
        terms.flush();groups.flush();rubrics.flush();EvidenceGroupValidator.QuestionValidation validation=validator.validate(question,savedRubrics);
        if("Approved".equals(request.reviewStatus())&&!validation.valid())throw badRequest("Question cannot be approved: evidence validation found "+validation.issueCount()+" issue(s)");
        for(RubricCriterion criterion:savedRubrics){criterion.setEvidenceStatus(validation.valid()?("Approved".equals(request.reviewStatus())?"APPROVED":"AUTO_VALIDATED"):"REVISE");rubrics.save(criterion);}rubrics.flush();return response(question,true);
    }

    private void replaceEvidenceGroups(RubricCriterion criterion,List<EvidenceGroupWriteRequest> requestedGroups){
        List<RubricEvidenceGroup> existingGroups=groups.findByRubricCriterionIdOrderByGroupOrderAsc(criterion.getId());for(RubricEvidenceGroup group:existingGroups)terms.deleteByEvidenceGroupId(group.getId());terms.flush();groups.deleteByRubricCriterionId(criterion.getId());groups.flush();
        if(requestedGroups==null)return;if(requestedGroups.size()<2||requestedGroups.size()>4)throw badRequest("Each rubric criterion requires 2 to 4 evidence groups");
        for(int groupIndex=0;groupIndex<requestedGroups.size();groupIndex++){
            EvidenceGroupWriteRequest sourceGroup=requestedGroups.get(groupIndex);RubricEvidenceGroup group=new RubricEvidenceGroup();group.setRubricCriterion(criterion);group.setGroupOrder(groupIndex+1);group.setConcept(required(sourceGroup.concept(),"Evidence group concept"));group.setDescription(required(sourceGroup.description(),"Evidence group description"));group=groups.saveAndFlush(group);
            if(sourceGroup.terms()==null||sourceGroup.terms().isEmpty())throw badRequest("Each evidence group requires at least one term");Set<String>uniqueTerms=new HashSet<>();
            for(EvidenceTermWriteRequest sourceTerm:sourceGroup.terms()){
                String type=sourceTerm.type()==null?"TERM":sourceTerm.type().toUpperCase(Locale.ROOT);if(!TERM_TYPES.contains(type))throw badRequest("Unknown evidence term type: "+type);String value=required(sourceTerm.value(),"Evidence term");if(value.length()>500)throw badRequest("Evidence terms must be 500 characters or fewer");String uniqueKey=type+":"+normalize(value);if(!uniqueTerms.add(uniqueKey))continue;EvidenceTerm term=new EvidenceTerm();term.setEvidenceGroup(group);term.setTermType(type);term.setValue(value);terms.save(term);
            }
        }
    }

    private void validateQuestionRequest(QuestionWriteRequest request){
        required(request.questionText(),"Question text");required(request.role(),"Role");required(request.interviewType(),"Interview type");required(request.topic(),"Topic");required(request.difficulty(),"Difficulty");required(request.expectedAnswerSummary(),"Expected answer summary");if(!REVIEW_STATUSES.contains(request.reviewStatus()))throw badRequest("Unknown review status");if(request.rubrics()==null||request.rubrics().size()!=5||request.rubrics().stream().mapToInt(RubricWriteRequest::weight).sum()!=100)throw badRequest("Exactly five rubric criteria totaling 100 are required");
    }
    private Question find(Long id){return questions.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Question not found"));}
    private String required(String value,String field){if(value==null||value.isBlank())throw badRequest(field+" is required");return value.trim();}
    private String clean(String value){return value==null?"":value.trim();}
    private ResponseStatusException badRequest(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
    private String normalize(String value){return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+"," ").trim();}

    private QuestionAdminResponse response(Question question,boolean includeEvidence){
        List<RubricAdminResponse> rubricResponses=rubrics.findByQuestionIdOrderByCriterionOrderAsc(question.getId()).stream().map(criterion->new RubricAdminResponse(criterion.getId(),criterion.getCriterionOrder(),criterion.getCriterionName(),criterion.getDescription(),criterion.getExpectedEvidence(),criterion.getAcceptableAlternatives(),criterion.getKeywords(),criterion.getWeight(),criterion.getImportance(),criterion.getRubricVersion(),criterion.getEvidenceStatus(),criterion.getSemanticDescription(),includeEvidence?groups.findByRubricCriterionIdOrderByGroupOrderAsc(criterion.getId()).stream().map(group->new EvidenceGroupAdminResponse(group.getId(),group.getGroupOrder(),group.getConcept(),group.getDescription(),terms.findByEvidenceGroupId(group.getId()).stream().map(term->new EvidenceTermAdminResponse(term.getId(),term.getTermType(),term.getValue())).toList())).toList():List.of())).toList();
        return new QuestionAdminResponse(question.getId(),question.getQuestionText(),question.getTechRole().getName(),question.getInterviewType().getName(),question.getCompany()==null?null:question.getCompany().getName(),question.getTopic(),question.getDifficulty(),question.getSourceType(),question.getExpectedAnswerSummary(),question.getReviewStatus(),question.isActive(),rubricResponses);
    }

    public record QuestionWriteRequest(String questionText,String role,String interviewType,String company,String topic,String difficulty,String expectedAnswerSummary,String reviewStatus,List<RubricWriteRequest>rubrics){}
    public record RubricWriteRequest(String name,String description,String expectedEvidence,String acceptableAlternatives,String keywords,int weight,String importance,Integer rubricVersion,String evidenceStatus,String semanticDescription,List<EvidenceGroupWriteRequest>evidenceGroups){}
    public record EvidenceGroupWriteRequest(String concept,String description,List<EvidenceTermWriteRequest>terms){}
    public record EvidenceTermWriteRequest(String type,String value){}
    public record QuestionAdminResponse(Long id,String questionText,String role,String interviewType,String company,String topic,String difficulty,String sourceType,String expectedAnswerSummary,String reviewStatus,boolean active,List<RubricAdminResponse>rubrics){}
    public record RubricAdminResponse(Long id,int order,String name,String description,String expectedEvidence,String acceptableAlternatives,String keywords,int weight,String importance,int rubricVersion,String evidenceStatus,String semanticDescription,List<EvidenceGroupAdminResponse>evidenceGroups){}
    public record EvidenceGroupAdminResponse(Long id,int order,String concept,String description,List<EvidenceTermAdminResponse>terms){}
    public record EvidenceTermAdminResponse(Long id,String type,String value){}
}
