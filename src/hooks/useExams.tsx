import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Exam {
  id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  duration_minutes: number;
  passing_score: number;
  max_attempts: number;
  is_published: boolean;
  shuffle_questions: boolean;
  show_correct_answers: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: string;
  points: number;
  order_index: number;
  image_url: string | null;
  created_at: string;
}

export interface AnswerOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  passed: boolean | null;
  answers: Array<{ question_id: string; selected_option_id: string }>;
}

export interface QuestionWithOptions extends Question {
  answer_options: AnswerOption[];
}

// Get exams for a course
export const useCourseExams = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course-exams', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('created_at');
      
      if (error) throw error;
      return data as Exam[];
    },
    enabled: !!courseId,
  });
};

// Get a single exam with questions
export const useExam = (examId: string | undefined) => {
  return useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      if (!examId) return null;
      
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();
      
      if (error) throw error;
      return data as Exam;
    },
    enabled: !!examId,
  });
};

// Get questions for an exam (without correct answers for students)
export const useExamQuestions = (examId: string | undefined) => {
  return useQuery({
    queryKey: ['exam-questions', examId],
    queryFn: async () => {
      if (!examId) return [];
      
      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index');
      
      if (qError) throw qError;
      
      // Get options for all questions
      const questionIds = questions.map(q => q.id);
      const { data: options, error: oError } = await supabase
        .from('answer_options')
        .select('*')
        .in('question_id', questionIds)
        .order('order_index');
      
      if (oError) throw oError;
      
      // Combine questions with their options
      return questions.map(q => ({
        ...q,
        answer_options: options.filter(o => o.question_id === q.id)
      })) as QuestionWithOptions[];
    },
    enabled: !!examId,
  });
};

// Get user's attempts for an exam
export const useExamAttempts = (examId: string | undefined) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['exam-attempts', examId, user?.id],
    queryFn: async () => {
      if (!examId || !user) return [];
      
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      return data as ExamAttempt[];
    },
    enabled: !!examId && !!user,
  });
};

// Start an exam attempt
export const useStartExamAttempt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (examId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('exam_attempts')
        .insert({
          user_id: user.id,
          exam_id: examId
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ExamAttempt;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exam-attempts', data.exam_id] });
    },
  });
};

// Submit exam answers
export const useSubmitExam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      attemptId, 
      answers 
    }: { 
      attemptId: string; 
      answers: Array<{ question_id: string; selected_option_id: string }> 
    }) => {
      const { data, error } = await supabase
        .rpc('submit_exam', {
          _attempt_id: attemptId,
          _answers: answers
        });
      
      if (error) throw error;
      return data as ExamAttempt;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exam-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['my-certificates'] });
    },
  });
};

// ===== INSTRUCTOR HOOKS =====

// Get all exams for instructor's courses
export const useInstructorExams = (courseId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['instructor-exams', user?.id, courseId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('exams')
        .select(`
          *,
          courses!inner(instructor_id, title)
        `)
        .eq('courses.instructor_id', user.id);
      
      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// Get exam with all questions and correct answers (for instructor)
export const useInstructorExamDetails = (examId: string | undefined) => {
  return useQuery({
    queryKey: ['instructor-exam-details', examId],
    queryFn: async () => {
      if (!examId) return null;
      
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();
      
      if (examError) throw examError;
      
      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index');
      
      if (qError) throw qError;
      
      const questionIds = questions.map(q => q.id);
      const { data: options, error: oError } = await supabase
        .from('answer_options')
        .select('*')
        .in('question_id', questionIds.length > 0 ? questionIds : ['no-match'])
        .order('order_index');
      
      if (oError) throw oError;
      
      return {
        ...exam,
        questions: questions.map(q => ({
          ...q,
          answer_options: options.filter(o => o.question_id === q.id)
        }))
      };
    },
    enabled: !!examId,
  });
};

// Create exam
export const useCreateExam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (exam: { course_id: string; title: string; description?: string; duration_minutes?: number; passing_score?: number; max_attempts?: number; module_id?: string }) => {
      const { data, error } = await supabase
        .from('exams')
        .insert([exam])
        .select()
        .single();
      
      if (error) throw error;
      return data as Exam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-exams'] });
    },
  });
};

// Update exam
export const useUpdateExam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Exam> & { id: string }) => {
      const { data, error } = await supabase
        .from('exams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Exam;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instructor-exams'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-exam-details', data.id] });
    },
  });
};

// Delete exam
export const useDeleteExam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (examId: string) => {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-exams'] });
    },
  });
};

// Create question
export const useCreateQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      question, 
      options 
    }: { 
      question: { exam_id: string; question_text: string; question_type?: string; points?: number; order_index?: number; image_url?: string }; 
      options: Array<{ option_text: string; is_correct: boolean }> 
    }) => {
      // Create question
      const { data: q, error: qError } = await supabase
        .from('questions')
        .insert([question])
        .select()
        .single();
      
      if (qError) throw qError;
      
      // Create options
      const optionsWithQuestionId = options.map((o, i) => ({
        ...o,
        question_id: q.id,
        order_index: i
      }));
      
      const { error: oError } = await supabase
        .from('answer_options')
        .insert(optionsWithQuestionId);
      
      if (oError) throw oError;
      
      return q as Question;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instructor-exam-details'] });
      queryClient.invalidateQueries({ queryKey: ['exam-questions'] });
    },
  });
};

// Update question
export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      questionId,
      question, 
      options 
    }: { 
      questionId: string;
      question: Partial<Question> & { image_url?: string | null }; 
      options: Array<{ id?: string; option_text: string; is_correct: boolean }> 
    }) => {
      // Update question
      const { error: qError } = await supabase
        .from('questions')
        .update(question)
        .eq('id', questionId);
      
      if (qError) throw qError;
      
      // Delete old options
      await supabase
        .from('answer_options')
        .delete()
        .eq('question_id', questionId);
      
      // Create new options
      const optionsWithQuestionId = options.map((o, i) => ({
        option_text: o.option_text,
        is_correct: o.is_correct,
        question_id: questionId,
        order_index: i
      }));
      
      const { error: oError } = await supabase
        .from('answer_options')
        .insert(optionsWithQuestionId);
      
      if (oError) throw oError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-exam-details'] });
      queryClient.invalidateQueries({ queryKey: ['exam-questions'] });
    },
  });
};

// Delete question
export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-exam-details'] });
      queryClient.invalidateQueries({ queryKey: ['exam-questions'] });
    },
  });
};
