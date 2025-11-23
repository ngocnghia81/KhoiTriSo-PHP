/**
 * Assignments Service
 */

import { api } from '@/lib/api';

export interface Assignment {
  id: number;
  lessonId?: number;
  lesson_id?: number;
  title: string;
  description: string;
  assignmentType?: number;
  assignment_type?: number;
  maxScore?: number;
  max_score?: number;
  timeLimit?: number;
  time_limit?: number;
  maxAttempts?: number;
  max_attempts?: number;
  showAnswersAfter?: number;
  show_answers_after?: number;
  dueDate?: string;
  due_date?: string;
  isPublished?: boolean;
  is_published?: boolean;
  passingScore?: number;
  passing_score?: number;
  shuffleQuestions?: boolean;
  shuffle_questions?: boolean;
  shuffleOptions?: boolean;
  shuffle_options?: boolean;
  isActive?: boolean;
  is_active?: boolean;
  questions?: Question[];
}

export interface Question {
  id: number;
  questionContent?: string;
  question_content?: string;
  questionType?: number;
  question_type?: number;
  difficultyLevel?: number;
  difficulty_level?: number;
  defaultPoints?: number;
  default_points?: number;
  explanationContent?: string;
  explanation_content?: string;
  orderIndex?: number;
  order_index?: number;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: number;
  optionContent?: string;
  option_content?: string;
  isCorrect?: boolean;
  is_correct?: boolean;
  pointsValue?: number;
  points_value?: number;
  orderIndex?: number;
  order_index?: number;
}

export interface AssignmentAttempt {
  id: number;
  userId?: number;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  attemptNumber?: number;
  attempt_number?: number;
  score?: number;
  isPassed?: boolean;
  is_passed?: boolean;
  startedAt?: string;
  started_at?: string;
  submittedAt?: string;
  submitted_at?: string;
  timeSpent?: number;
  time_spent?: number;
}

// Student APIs
export async function getAssignments(params?: { courseId?: number; lessonId?: number; page?: number }) {
  const query = new URLSearchParams();
  if (params?.courseId) query.set('courseId', String(params.courseId));
  if (params?.lessonId) query.set('lessonId', String(params.lessonId));
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();
  const response = await api.get<{ data: Assignment[] }>(`assignments${qs ? `?${qs}` : ''}`);
  return response.data || [];
}

export async function getAssignment(id: number) {
  const response = await api.get<{ data: Assignment }>(`assignments/${id}`);
  return response.data;
}

export async function startAssignment(id: number) {
  const response = await api.post<{ data: AssignmentAttempt }>(`assignments/${id}/start`);
  return response.data;
}

export async function submitAssignment(id: number, data: { attemptId: number; answers: any[] }) {
  const response = await api.post<{ data: AssignmentAttempt }>(`assignments/${id}/submit`, data);
  return response.data;
}

export async function getMyAssignmentAttempts(id: number) {
  const response = await api.get<{ data: { attempts: AssignmentAttempt[] } }>(`assignments/${id}/attempts`);
  return response.data;
}

// Admin APIs
export async function getLessonAssignments(lessonId: number) {
  const response = await api.get<{ data: Assignment[] }>(`admin/lessons/${lessonId}/assignments`);
  return response.data || [];
}

export async function createLessonAssignment(lessonId: number, data: {
  title: string;
  description: string;
  assignmentType: number;
  maxScore: number;
  timeLimit?: number;
  maxAttempts: number;
  showAnswersAfter: number;
  dueDate?: string;
  isPublished?: boolean;
  passingScore?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}) {
  const response = await api.post<{ data: Assignment }>(`admin/lessons/${lessonId}/assignments`, data);
  return response.data;
}

export async function createAssignmentQuestion(assignmentId: number, data: {
  questionContent: string;
  questionType: number;
  difficultyLevel?: number;
  defaultPoints?: number;
  explanationContent?: string;
  orderIndex?: number;
  options?: Array<{
    content: string;
    isCorrect: boolean;
    pointsValue?: number;
    orderIndex?: number;
  }>;
}) {
  const response = await api.post<{ data: Question }>(`admin/assignments/${assignmentId}/questions`, data);
  return response.data;
}

export async function getAssignmentAttempts(assignmentId: number, params?: { page?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await api.get<{ data: AssignmentAttempt[]; total?: number }>(`admin/assignments/${assignmentId}/attempts${qs ? `?${qs}` : ''}`);
  return response;
}

export async function createAssignmentQuestions(assignmentId: number, data: {
  questions: Array<{
    content: string;
    type: 'multiple_choice' | 'essay';
    options?: Array<{ text: string; isCorrect: boolean }>;
    explanation?: string;
    correctAnswer?: string;
    solutionVideo?: string;
    solutionType?: 'text' | 'video' | 'latex';
    defaultPoints?: number;
  }>;
  isBatchInsert?: boolean;
}) {
  const response = await api.post<{ data: {
    assignment: Assignment;
    questions: Question[];
    totalQuestions: number;
  } }>(`assignments/${assignmentId}/questions`, data);
  return response.data;
}

export async function getAttemptDetails(attemptId: number) {
  const response = await api.get<{ data: {
    attempt: AssignmentAttempt;
    assignment: Assignment;
    questions: Array<Question & { answer?: {
      id: number;
      optionId?: number;
      answerText?: string;
      isCorrect?: boolean;
      pointsEarned?: number;
    } }>;
  } }>(`admin/attempts/${attemptId}`);
  return response.data;
}

export async function gradeAttempt(attemptId: number, data: {
  grades: Array<{
    questionId: number;
    pointsEarned: number;
    isCorrect?: boolean;
  }>;
}) {
  const response = await api.post<{ data: {
    attempt: AssignmentAttempt;
    totalScore: number;
    maxScore: number;
    isPassed: boolean;
  } }>(`admin/attempts/${attemptId}/grade`, data);
  return response.data;
}

export async function disableAssignment(assignmentId: number) {
  const response = await api.post<{ data: Assignment }>(`admin/assignments/${assignmentId}/disable`);
  return response.data;
}

export async function restoreAssignment(assignmentId: number) {
  const response = await api.post<{ data: Assignment }>(`admin/assignments/${assignmentId}/restore`);
  return response.data;
}

export async function getAssignmentAdmin(assignmentId: number) {
  const response = await api.get<{ data: Assignment }>(`admin/assignments/${assignmentId}`);
  return response.data;
}

export async function updateAssignment(assignmentId: number, data: {
  title?: string;
  description?: string;
  assignmentType?: number;
  maxScore?: number;
  timeLimit?: number;
  maxAttempts?: number;
  showAnswersAfter?: number;
  dueDate?: string;
  isPublished?: boolean;
  passingScore?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}) {
  const response = await api.put<{ data: Assignment }>(`admin/assignments/${assignmentId}`, data);
  return response.data;
}
