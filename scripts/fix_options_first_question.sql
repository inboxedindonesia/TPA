-- Update options for the first question in test-1 to ensure it has valid choices
UPDATE questions 
SET options = '["27","28","29","30"]' 
WHERE "testId" = 'test-1' AND "order" = 1;
