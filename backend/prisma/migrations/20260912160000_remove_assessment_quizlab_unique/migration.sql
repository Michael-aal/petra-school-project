-- QuizLab quiz IDs identify remote quizzes and may be shared by multiple
-- local Assessment records. The previous migration incorrectly enforced
-- global uniqueness on Assessment.quizlabQuizId, which prevents a second
-- assessment from using the configured published QuizLab test.
DROP INDEX IF EXISTS "Assessment_quizlabQuizId_key";
