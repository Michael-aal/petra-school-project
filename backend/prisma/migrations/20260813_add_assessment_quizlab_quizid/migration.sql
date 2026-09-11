-- Add QuizLab quiz linkage directly on Assessment
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "quizlabQuizId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Assessment_quizlabQuizId_key" ON "Assessment"("quizlabQuizId");
