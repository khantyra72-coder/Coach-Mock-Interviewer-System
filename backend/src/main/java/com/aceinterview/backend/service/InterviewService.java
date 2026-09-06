package com.aceinterview.backend.service;

import com.aceinterview.backend.dto.InterviewDtos;
import com.aceinterview.backend.entity.Answer;
import com.aceinterview.backend.entity.InterviewResult;
import com.aceinterview.backend.entity.InterviewSession;
import com.aceinterview.backend.entity.*;
import com.aceinterview.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class InterviewService {

    private final UserRepository userRepository;
    private final InterviewSessionRepository sessionRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final InterviewResultRepository resultRepository;
    private final SessionQuestionRepository sessionQuestionRepository;
    private final RubricCriterionRepository rubricRepository;
    private final TechRoleRepository roleRepository;
    private final InterviewTypeRepository typeRepository;
    private final CompanyRepository companyRepository;
    private final QuestionSelectionService selectionService;
    private final QuestionHistoryRepository historyRepository;
    private final AnswerRubricScoreRepository answerRubricScoreRepository;
    private final ExperienceLevelEvaluator levelEvaluator;
    private final RubricEvidenceEvaluator rubricEvidenceEvaluator;
    private final EvidenceAwareScoringService evidenceAwareScoringService;

    public InterviewService(
            UserRepository userRepository,
            InterviewSessionRepository sessionRepository,
            QuestionRepository questionRepository,
            AnswerRepository answerRepository,
            InterviewResultRepository resultRepository, SessionQuestionRepository sessionQuestionRepository,
            RubricCriterionRepository rubricRepository, TechRoleRepository roleRepository,
            InterviewTypeRepository typeRepository, CompanyRepository companyRepository,
            QuestionSelectionService selectionService, QuestionHistoryRepository historyRepository,
            AnswerRubricScoreRepository answerRubricScoreRepository, ExperienceLevelEvaluator levelEvaluator,
            RubricEvidenceEvaluator rubricEvidenceEvaluator, EvidenceAwareScoringService evidenceAwareScoringService
    ) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.resultRepository = resultRepository;
        this.sessionQuestionRepository = sessionQuestionRepository; this.rubricRepository = rubricRepository;
        this.roleRepository = roleRepository; this.typeRepository = typeRepository; this.companyRepository = companyRepository;
        this.selectionService=selectionService; this.historyRepository=historyRepository;
        this.answerRubricScoreRepository=answerRubricScoreRepository;
        this.levelEvaluator=levelEvaluator;
        this.rubricEvidenceEvaluator=rubricEvidenceEvaluator;
        this.evidenceAwareScoringService=evidenceAwareScoringService;
    }

    public InterviewDtos.StartResponse startInterview(
            Long userId,
            InterviewDtos.StartRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"
                ));

        InterviewSession session = new InterviewSession();
        session.setUser(user);
        session.setRole(request.role().trim());
        List<String> requestedTypes=request.interviewTypes()==null||request.interviewTypes().isEmpty()
                ? List.of(request.interviewType()==null?"":request.interviewType().trim())
                : request.interviewTypes().stream().filter(Objects::nonNull).map(String::trim).filter(value->!value.isBlank()).distinct().toList();
        if(requestedTypes.isEmpty()||requestedTypes.size()>3) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose between one and three interview types");
        session.setInterviewType(String.join(", ",requestedTypes));
        session.setCompany(cleanOptionalText(request.company()));
        session.setExperienceLevel(levelEvaluator.normalizeLevel(request.experienceLevel()));
        TechRole role = roleRepository.findByName(request.role().trim()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown role"));
        List<InterviewType> types=requestedTypes.stream().map(name->typeRepository.findByName(name).orElseThrow(()->new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown interview type: "+name))).toList();
        Company company = request.company() == null ? null : companyRepository.findByName(request.company().trim()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown company"));
        session.setTechRole(role); session.setInterviewTypeDefinition(types.size()==1?types.get(0):null); session.setCompanyDefinition(company);
        session = sessionRepository.save(session);

        List<Question> selected=selectionService.select(user,role,types,company,request.difficulty(),request.topics(),request.questionCount());
        for (int i=0;i<selected.size();i++) { Question selectedQuestion=selected.get(i); SessionQuestion sq=new SessionQuestion(); sq.setInterviewSession(session); sq.setQuestion(selectedQuestion); sq.setQuestionOrder(i+1); sq.setSourceType(selectedQuestion.getSourceType()); sessionQuestionRepository.save(sq); QuestionHistory h=historyRepository.findByUserIdAndQuestionId(userId,selectedQuestion.getId()).orElseGet(QuestionHistory::new); if(h.getId()==null){h.setUser(user);h.setQuestion(selectedQuestion);}h.setShownCount(h.getShownCount()+1);h.setLastShownAt(LocalDateTime.now());historyRepository.save(h); }
        return new InterviewDtos.StartResponse(InterviewDtos.SessionResponse.from(session), selected.stream().map(InterviewDtos.QuestionResponse::from).toList());
    }

    @Transactional(readOnly = true)
    public List<InterviewDtos.SessionResponse> getInterviewHistory(Long userId) {
        return sessionRepository.findByUserIdOrderByStartedAtDesc(userId)
                .stream()
                .map(InterviewDtos.SessionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InterviewDtos.QuestionResponse> getQuestions() {
        return questionRepository.findByActiveTrue()
                .stream()
                .map(InterviewDtos.QuestionResponse::from)
                .toList();
    }

    public InterviewDtos.AnswerResponse submitAnswer(
            Long userId,
            Long sessionId,
            InterviewDtos.SubmitAnswerRequest request
    ) {
        InterviewSession session = findOwnedSession(userId, sessionId);

        if (!"IN_PROGRESS".equals(session.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This interview is already completed"
            );
        }

        Question question = sessionQuestionRepository.findByInterviewSessionIdAndQuestionId(sessionId, request.questionId())
                .map(SessionQuestion::getQuestion).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question is not assigned to this session"));
        Optional<Answer> existingAnswer = answerRepository.findByInterviewSessionIdAndQuestionId(sessionId, question.getId());
        if (existingAnswer.isPresent()) return answerResponse(existingAnswer.get());

        Answer answer = new Answer();
        answer.setInterviewSession(session);
        answer.setQuestion(question);
        answer.setAnswerText(request.answerText().trim());
        List<RubricCriterion> criteria = rubricRepository.findByQuestionIdOrderByCriterionOrderAsc(question.getId());
        String normalized = request.answerText().toLowerCase(Locale.ROOT);
        List<String> covered=new ArrayList<>(), partial=new ArrayList<>(), missing=new ArrayList<>(), depthGaps=new ArrayList<>(); int score=0;
        List<CriterionEvaluation> evaluations=new ArrayList<>();
        if(evidenceAwareScoringService.supports(criteria)){
            EvidenceAwareScoringService.ScoreResult result=evidenceAwareScoringService.score(question,criteria,normalized);score=result.score();
            for(EvidenceAwareScoringService.CriterionScore item:result.criteria()){
                if("FULL".equals(item.status()))covered.add(item.criterion().getCriterionName());else if("PARTIAL".equals(item.status()))partial.add(item.criterion().getCriterionName());else missing.add(item.criterion().getCriterionName());
                String evidence=String.join(", ",item.matched());if(!item.incorrectMatched().isEmpty())evidence+=(evidence.isBlank()?"":"; ")+"Contradiction: "+String.join(", ",item.incorrectMatched());
                evaluations.add(new CriterionEvaluation(item.criterion(),item.status(),item.awarded(),evidence));
            }
            if(!result.relevant())depthGaps.add("a direct connection to the question topic");
            if(result.incorrect())depthGaps.add("correction of a contradictory or technically unsafe claim");
        }else for (RubricCriterion criterion:criteria) {
            RubricEvidenceEvaluator.Evaluation evidence=rubricEvidenceEvaluator.evaluate(criterion,criteria,normalized);
            List<String> matched=evidence.matched(); String status;
            if("Behavioral".equals(question.getCategory()))status=levelEvaluator.behavioralEvidenceStatus(criterion.getCriterionName(),normalized);
            else status=evidence.status();
            ExperienceLevelEvaluator.DepthResult depth="Behavioral".equals(question.getCategory())
                    ?levelEvaluator.evaluateBehavioral(session.getExperienceLevel(),criterion.getCriterionName(),normalized)
                    :levelEvaluator.evaluate(session.getExperienceLevel(),criterion.getCriterionName()+" "+criterion.getDescription(),normalized);
            if("FULL".equals(status)&&!depth.full())status="PARTIAL";
            if(!"MISSING".equals(status))depthGaps.addAll(depth.missing());
            int awarded="FULL".equals(status)?criterion.getWeight():"PARTIAL".equals(status)?(int)Math.round(criterion.getWeight()*0.5):0;
            if("FULL".equals(status))covered.add(criterion.getCriterionName());else if("PARTIAL".equals(status))partial.add(criterion.getCriterionName());else missing.add(criterion.getCriterionName());
            score+=awarded;evaluations.add(new CriterionEvaluation(criterion,status,awarded,String.join(", ",concat(matched,depth.found()))));
        }
        answer.setScore(score);
        answer.setFeedback(buildFeedback(session.getExperienceLevel(),covered,partial,missing,depthGaps));
        answer.setCoveredConcepts(String.join("; ", covered)+(partial.isEmpty()?"":"; Partial: "+String.join(", ",partial))); answer.setMissingConcepts(String.join("; ", missing));
        QuestionHistory history=historyRepository.findByUserIdAndQuestionId(userId,question.getId()).orElseThrow(); history.setAnsweredCount(history.getAnsweredCount()+1); history.setLastAnsweredAt(LocalDateTime.now()); historyRepository.save(history);
        answer=answerRepository.save(answer);
        for(CriterionEvaluation evaluation:evaluations){AnswerRubricScore detail=new AnswerRubricScore();detail.setAnswer(answer);detail.setRubricCriterion(evaluation.criterion());detail.setStatus(evaluation.status());detail.setAwardedPoints(evaluation.awarded());detail.setMaximumPoints(evaluation.criterion().getWeight());detail.setMatchedEvidence(evaluation.matchedEvidence());answerRubricScoreRepository.save(detail);}
        return answerResponse(answer);
    }

    public InterviewDtos.ResultResponse completeInterview(
            Long userId,
            Long sessionId,
            InterviewDtos.CompleteRequest request
    ) {
        InterviewSession session = findOwnedSession(userId, sessionId);
        List<Answer> submitted = answerRepository.findByInterviewSessionIdOrderByAnsweredAtAsc(sessionId);
        int assignedQuestionCount = sessionQuestionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId).size();
        if (submitted.size() != assignedQuestionCount) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "All " + assignedQuestionCount + " questions must be answered before completion"
            );
        }
        int calculatedScore = (int)Math.round(submitted.stream().mapToInt(a -> a.getScore()==null?0:a.getScore()).average().orElse(0));

        InterviewResult result = resultRepository
                .findByInterviewSessionId(sessionId)
                .orElseGet(InterviewResult::new);

        if (result.getId() == null) {
            result.setInterviewSession(session);
        }

        result.setOverallScore(calculatedScore);
        result.setTechnicalScore(categoryAverage(submitted,"Technical"));
        result.setBehavioralScore(categoryAverage(submitted,"Behavioral"));
        result.setSystemDesignScore(categoryAverage(submitted,"System Design"));
        result.setConceptScore(calculatedScore); result.setAlgorithmScore(null); result.setCommunicationScore(null); result.setProblemSolvingScore(null);
        result.setStrengths(submitted.stream().map(Answer::getCoveredConcepts).filter(Objects::nonNull).distinct().limit(5).reduce((a,b)->a+"; "+b).orElse(""));
        result.setImprovements(submitted.stream().map(Answer::getMissingConcepts).filter(Objects::nonNull).distinct().limit(5).reduce((a,b)->a+"; "+b).orElse(""));
        result.setSummaryFeedback("Backend rubric score calculated for the "+session.getExperienceLevel()+" experience level from "+assignedQuestionCount+" submitted answers.");
        result.setResultDetails("{\"scoringSource\":\"SERVER_RUBRIC_WITH_EXPERIENCE_DEPTH\",\"experienceLevel\":\""+session.getExperienceLevel()+"\",\"answeredQuestions\":"+assignedQuestionCount+"}");

        session.setStatus("COMPLETED");
        if (session.getCompletedAt() == null) {
            session.setCompletedAt(LocalDateTime.now());
        }

        sessionRepository.save(session);
        return InterviewDtos.ResultResponse.from(resultRepository.save(result));
    }

    @Transactional(readOnly = true)
    public InterviewDtos.DetailsResponse getInterviewDetails(
            Long userId,
            Long sessionId
    ) {
        InterviewSession session = findOwnedSession(userId, sessionId);

        List<InterviewDtos.AnswerResponse> answers =
                answerRepository.findByInterviewSessionIdOrderByAnsweredAtAsc(sessionId)
                        .stream()
                        .map(this::answerResponse)
                        .toList();

        InterviewDtos.ResultResponse result = resultRepository
                .findByInterviewSessionId(sessionId)
                .map(InterviewDtos.ResultResponse::from)
                .orElse(null);

        return new InterviewDtos.DetailsResponse(
                InterviewDtos.SessionResponse.from(session),
                answers,
                result
        );
    }

    private InterviewSession findOwnedSession(Long userId, Long sessionId) {
        return sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Interview session not found"
                ));
    }

    private String cleanOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private InterviewDtos.AnswerResponse answerResponse(Answer answer){
        List<InterviewDtos.RubricScoreResponse> scores=answerRubricScoreRepository.findByAnswerIdOrderByRubricCriterionCriterionOrderAsc(answer.getId()).stream().map(s->new InterviewDtos.RubricScoreResponse(s.getRubricCriterion().getCriterionName(),s.getStatus(),s.getAwardedPoints(),s.getMaximumPoints())).toList();
        return new InterviewDtos.AnswerResponse(answer.getId(),answer.getQuestion().getId(),answer.getQuestion().getQuestionText(),answer.getAnswerText(),answer.getScore(),answer.getFeedback(),answer.getCoveredConcepts(),answer.getMissingConcepts(),answer.getAnsweredAt(),scores);
    }
    private String buildFeedback(String level,List<String> full,List<String> partial,List<String> missing,List<String> depthGaps){
        List<String> parts=new ArrayList<>();if(!full.isEmpty())parts.add("Covered: "+String.join(", ",full)+".");if(!partial.isEmpty())parts.add("Partially covered: "+String.join(", ",partial)+"; add mechanism, consequence, or verification.");if(!missing.isEmpty())parts.add("Missing: "+String.join(", ",missing)+".");List<String> uniqueGaps=depthGaps.stream().distinct().toList();if(!uniqueGaps.isEmpty())parts.add("For "+level+"-level full credit, add: "+String.join(", ",uniqueGaps)+".");return String.join(" ",parts);
    }
    private List<String> concat(List<String> left,List<String> right){List<String> result=new ArrayList<>(left);result.addAll(right);return result;}
    private Integer categoryAverage(List<Answer> answers,String category){List<Answer> matching=answers.stream().filter(answer->category.equals(answer.getQuestion().getCategory())).toList();return matching.isEmpty()?null:(int)Math.round(matching.stream().mapToInt(answer->answer.getScore()==null?0:answer.getScore()).average().orElse(0));}
    private record CriterionEvaluation(RubricCriterion criterion,String status,int awarded,String matchedEvidence){}
}
