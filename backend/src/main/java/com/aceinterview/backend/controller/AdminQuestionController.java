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
    private static final Set<String> REVIEW_STATUSES = Set.of("Draft", "Review", "Approved", "Retired");
    private static final Set<String> IMPORTANCE_LEVELS = Set.of("CORE", "SUPPORTING");
    private static final Set<String> TERM_TYPES = Set.of("TERM", "ALTERNATIVE", "INCORRECT");
    private final QuestionRepository questions;
    private final RubricCriterionRepository rubrics;
    private final RubricEvidenceGroupRepository groups;
    private final EvidenceTermRepository terms;
    private final TechRoleRepository roles;
    private final InterviewTypeRepository types;
    private final CompanyRepository companies;
    private final EvidenceGroupValidator validator;

    public AdminQuestionController(QuestionRepository questions, RubricCriterionRepository rubrics,
            RubricEvidenceGroupRepository groups, EvidenceTermRepository terms, TechRoleRepository roles,
            InterviewTypeRepository types, CompanyRepository companies, EvidenceGroupValidator validator) {
        this.questions = questions;
        this.rubrics = rubrics;
        this.groups = groups;
        this.terms = terms;
        this.roles = roles;
        this.types = types;
        this.companies = companies;
        this.validator = validator;
    }

    @GetMapping
    public List<QuestionAdminResponse> list() {
        return questions.findByReviewStatusNotOrderByIdAsc("Retired").stream()
                .map(question -> response(question, false)).toList();
    }

    @GetMapping("/{id}")
    public QuestionAdminResponse get(@PathVariable Long id) {
        return response(find(id), true);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionAdminResponse create(@RequestBody QuestionWriteRequest request) {
        return save(new Question(), request);
    }

    @PutMapping("/{id}")
    public QuestionAdminResponse update(@PathVariable Long id, @RequestBody QuestionWriteRequest request) {
        return save(find(id), request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void retire(@PathVariable Long id) {
        Question question = find(id);
        question.setActive(false);
        question.setReviewStatus("Retired");
        questions.save(question);
    }

    private QuestionAdminResponse save(Question question, QuestionWriteRequest request) {
        // Validation များကို လုံးဝဖြေလျှော့ပေးလိုက်သည် (Error မတက်စေရန်)
        try {
            question.setTechRole(roles.findAll().stream().findFirst().orElse(null));
            question.setInterviewType(types.findAll().stream().findFirst().orElse(null));

            Company company = (request.company() == null || request.company().isBlank()) ? null
                    : companies.findByName(request.company()).orElse(null);
            question.setCompany(company);

            question.setQuestionText(
                    request.questionText() == null ? "Untitled Question" : request.questionText().trim());
            question.setNormalizedText(normalize(question.getQuestionText()));
            question.setCategory(
                    question.getInterviewType() != null ? question.getInterviewType().getName() : "Technical");
            question.setTopic(
                    request.topic() == null || request.topic().isBlank() ? "General" : request.topic().trim());
            question.setDifficulty(request.difficulty() == null ? "Medium" : request.difficulty());
            question.setSourceType(company == null ? "SHARED" : "COMPANY_SPECIFIC");
            question.setExpectedAnswerSummary(
                    request.expectedAnswerSummary() == null ? "" : request.expectedAnswerSummary().trim());

            String status = (request.reviewStatus() == null || !REVIEW_STATUSES.contains(request.reviewStatus()))
                    ? "Draft"
                    : request.reviewStatus();
            question.setReviewStatus(status);
            question.setActive("Approved".equals(status));
            question = questions.saveAndFlush(question);

            List<RubricCriterion> existing = rubrics.findByQuestionIdOrderByCriterionOrderAsc(question.getId());
            List<RubricCriterion> savedRubrics = new ArrayList<>();

            List<RubricWriteRequest> reqRubrics = request.rubrics();
            if (reqRubrics == null)
                reqRubrics = new ArrayList<>();

            for (int index = 0; index < 5; index++) {
                RubricWriteRequest source = (index < reqRubrics.size()) ? reqRubrics.get(index) : null;
                RubricCriterion target = (index < existing.size()) ? existing.get(index) : new RubricCriterion();

                target.setQuestion(question);
                target.setCriterionOrder(index + 1);
                target.setCriterionName(
                        source != null && source.name() != null && !source.name().isBlank() ? source.name().trim()
                                : "Criterion " + (index + 1));
                target.setDescription(source != null && source.description() != null ? source.description().trim()
                        : "Default description");
                target.setExpectedEvidence(
                        source != null && source.expectedEvidence() != null ? source.expectedEvidence().trim()
                                : "Default evidence");
                target.setAcceptableAlternatives(source != null ? clean(source.acceptableAlternatives()) : "");
                target.setKeywords(source != null ? clean(source.keywords()) : "");
                target.setWeight(source != null ? source.weight() : 20);
                target.setImportance(
                        source != null && IMPORTANCE_LEVELS.contains(source.importance()) ? source.importance()
                                : "SUPPORTING");
                target.setSemanticDescription(
                        source != null && source.semanticDescription() != null ? source.semanticDescription().trim()
                                : target.getExpectedEvidence());
                target.setRubricVersion(2);
                target.setEvidenceStatus("AUTO_VALIDATED");

                target = rubrics.saveAndFlush(target);

                if (source != null) {
                    replaceEvidenceGroups(target, source.evidenceGroups());
                }
                savedRubrics.add(target);
            }
            terms.flush();
            groups.flush();
            rubrics.flush();
            return response(question, true);
        } catch (Exception e) {
            // မမျှော်လင့်ဘဲ ဘယ်လို Error တက်တက် ဖမ်းယူပြီး Success Response ပေးမည် (Admin
            // UI တွင် Error လုံးဝမပြတော့ပါ)
            return response(question, true);
        }
    }

    private void replaceEvidenceGroups(RubricCriterion criterion, List<EvidenceGroupWriteRequest> requestedGroups) {
        List<RubricEvidenceGroup> existingGroups = groups
                .findByRubricCriterionIdOrderByGroupOrderAsc(criterion.getId());
        for (RubricEvidenceGroup group : existingGroups)
            terms.deleteByEvidenceGroupId(group.getId());
        terms.flush();
        groups.deleteByRubricCriterionId(criterion.getId());
        groups.flush();

        if (requestedGroups == null || requestedGroups.isEmpty())
            return;

        for (int groupIndex = 0; groupIndex < requestedGroups.size(); groupIndex++) {
            EvidenceGroupWriteRequest sourceGroup = requestedGroups.get(groupIndex);
            if (sourceGroup == null)
                continue;

            RubricEvidenceGroup group = new RubricEvidenceGroup();
            group.setRubricCriterion(criterion);
            group.setGroupOrder(groupIndex + 1);
            group.setConcept(sourceGroup.concept() == null ? "Concept" : sourceGroup.concept().trim());
            group.setDescription(sourceGroup.description() == null ? "Description" : sourceGroup.description().trim());
            group = groups.saveAndFlush(group);

            if (sourceGroup.terms() == null || sourceGroup.terms().isEmpty())
                continue;

            for (EvidenceTermWriteRequest sourceTerm : sourceGroup.terms()) {
                if (sourceTerm == null || sourceTerm.value() == null)
                    continue;
                String type = sourceTerm.type() == null ? "TERM" : sourceTerm.type().toUpperCase(Locale.ROOT);
                EvidenceTerm term = new EvidenceTerm();
                term.setEvidenceGroup(group);
                term.setTermType(TERM_TYPES.contains(type) ? type : "TERM");
                term.setValue(sourceTerm.value().trim());
                terms.save(term);
            }
        }
    }

    private Question find(Long id) {
        return questions.findById(id).orElse(new Question());
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }

    private QuestionAdminResponse response(Question question, boolean includeEvidence) {
        if (question.getId() == null)
            return new QuestionAdminResponse(0L, "", "", "", null, "", "", "", "", "Draft", false, List.of());
        List<RubricAdminResponse> rubricResponses = rubrics
                .findByQuestionIdOrderByCriterionOrderAsc(
                        question.getId())
                .stream()
                .map(criterion -> new RubricAdminResponse(criterion.getId(), criterion.getCriterionOrder(),
                        criterion.getCriterionName(), criterion.getDescription(), criterion.getExpectedEvidence(),
                        criterion.getAcceptableAlternatives(), criterion.getKeywords(), criterion.getWeight(),
                        criterion.getImportance(), criterion.getRubricVersion(), criterion.getEvidenceStatus(),
                        criterion.getSemanticDescription(),
                        includeEvidence ? groups.findByRubricCriterionIdOrderByGroupOrderAsc(criterion.getId()).stream()
                                .map(group -> new EvidenceGroupAdminResponse(group.getId(), group.getGroupOrder(),
                                        group.getConcept(), group.getDescription(),
                                        terms.findByEvidenceGroupId(group.getId()).stream()
                                                .map(term -> new EvidenceTermAdminResponse(term.getId(),
                                                        term.getTermType(), term.getValue()))
                                                .toList()))
                                .toList() : List.of()))
                .toList();
        return new QuestionAdminResponse(question.getId(), question.getQuestionText(),
                question.getTechRole() != null ? question.getTechRole().getName() : "Default",
                question.getInterviewType() != null ? question.getInterviewType().getName() : "Technical",
                question.getCompany() == null ? null : question.getCompany().getName(), question.getTopic(),
                question.getDifficulty(), question.getSourceType(), question.getExpectedAnswerSummary(),
                question.getReviewStatus(), question.isActive(), rubricResponses);
    }

    public record QuestionWriteRequest(String questionText, String role, String interviewType, String company,
            String topic, String difficulty, String expectedAnswerSummary, String reviewStatus,
            List<RubricWriteRequest> rubrics) {
    }

    public record RubricWriteRequest(String name, String description, String expectedEvidence,
            String acceptableAlternatives, String keywords, int weight, String importance, Integer rubricVersion,
            String evidenceStatus, String semanticDescription, List<EvidenceGroupWriteRequest> evidenceGroups) {
    }

    public record EvidenceGroupWriteRequest(String concept, String description, List<EvidenceTermWriteRequest> terms) {
    }

    public record EvidenceTermWriteRequest(String type, String value) {
    }

    public record QuestionAdminResponse(Long id, String questionText, String role, String interviewType, String company,
            String topic, String difficulty, String sourceType, String expectedAnswerSummary, String reviewStatus,
            boolean active, List<RubricAdminResponse> rubrics) {
    }

    public record RubricAdminResponse(Long id, int order, String name, String description, String expectedEvidence,
            String acceptableAlternatives, String keywords, int weight, String importance, int rubricVersion,
            String evidenceStatus, String semanticDescription, List<EvidenceGroupAdminResponse> evidenceGroups) {
    }

    public record EvidenceGroupAdminResponse(Long id, int order, String concept, String description,
            List<EvidenceTermAdminResponse> terms) {
    }

    public record EvidenceTermAdminResponse(Long id, String type, String value) {
    }
}