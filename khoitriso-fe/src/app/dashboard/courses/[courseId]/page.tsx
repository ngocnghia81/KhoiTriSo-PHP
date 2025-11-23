'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, VideoCameraIcon, PlusIcon, ChatBubbleLeftRightIcon, XMarkIcon, DocumentArrowUpIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { courseService, Course, Lesson, LessonDiscussion } from '@/services/courseService';
import { getInstructorCourse } from '@/services/instructor';
import { useToast } from '@/components/ToastProvider';
import { getLessonAssignments, disableAssignment, restoreAssignment, getAssignmentAttempts, getAttemptDetails, gradeAttempt, Assignment, AssignmentAttempt } from '@/services/assignments';
import { PencilIcon, EyeIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { notify } = useToast();
  
  const courseIdParam = params?.courseId;
  const courseId = courseIdParam ? (typeof courseIdParam === 'string' ? parseInt(courseIdParam) : parseInt(String(courseIdParam))) : null;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonDetails, setLessonDetails] = useState<Lesson | null>(null);
  const [discussions, setDiscussions] = useState<LessonDiscussion[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLessonDetails, setLoadingLessonDetails] = useState(false);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [attempts, setAttempts] = useState<AssignmentAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [loadingAttemptDetails, setLoadingAttemptDetails] = useState(false);
  const [grades, setGrades] = useState<Record<number, { pointsEarned: number; isCorrect?: boolean }>>({});
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    // Check user role
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        const userData = JSON.parse(userStr);
        setIsInstructor(userData.role === 'instructor');
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
  }, []);

  useEffect(() => {
    if (!courseId || isNaN(courseId)) {
      notify('ID khóa học không hợp lệ', 'error');
      router.push('/dashboard/courses');
      return;
    }
    fetchCourse();
  }, [courseId, router, isInstructor]);

  const fetchCourse = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      let courseData;
      if (isInstructor) {
        // Use instructor API
        courseData = await getInstructorCourse(courseId);
      } else {
        // Use admin API
        courseData = await courseService.getCourseAdmin(courseId);
      }
      setCourse(courseData as Course);
      if ((courseData as any).lessons) {
        setLessons((courseData as any).lessons);
      }
    } catch (error: any) {
      console.error('Error fetching course:', error);
      notify(error.message || 'Lỗi tải thông tin khóa học', 'error');
      router.push('/dashboard/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    // Set lesson details immediately with the lesson data we have
    setLessonDetails(lesson);
    setLoadingLessonDetails(true);
    setLoadingDiscussions(true);
    setLoadingAssignments(true);
    
    try {
      // Fetch lesson details with materials
      const lessonData = await courseService.getLessonAdmin(lesson.id);
      setLessonDetails(lessonData);
      setMaterials(lessonData.materials || []);
      
      // Fetch discussions
      const response = await courseService.getLessonDiscussions(lesson.id);
      setDiscussions(response.data || []);
      
      // Fetch assignments
      const assignmentsData = await getLessonAssignments(lesson.id);
      setAssignments(assignmentsData);
    } catch (error: any) {
      console.error('Error fetching lesson details:', error);
      notify(error.message || 'Lỗi tải thông tin bài học', 'error');
    } finally {
      setLoadingLessonDetails(false);
      setLoadingDiscussions(false);
      setLoadingAssignments(false);
    }
  };

  const handleDisableAssignment = async (assignmentId: number) => {
    if (!confirm('Bạn có chắc chắn muốn vô hiệu hóa bài tập này?')) {
      return;
    }
    try {
      await disableAssignment(assignmentId);
      notify('Vô hiệu hóa bài tập thành công', 'success');
      // Refresh assignments
      if (selectedLesson) {
        const assignmentsData = await getLessonAssignments(selectedLesson.id);
        setAssignments(assignmentsData);
      }
    } catch (error: any) {
      notify(error.message || 'Lỗi vô hiệu hóa bài tập', 'error');
    }
  };

  const handleViewAttempts = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowAttemptsModal(true);
    await loadAttempts(assignment.id);
  };

  const loadAttempts = async (assignmentId: number) => {
    try {
      setLoadingAttempts(true);
      const response: any = await getAssignmentAttempts(assignmentId);
      // Handle different response structures
      let attemptsData: AssignmentAttempt[] = [];
      if (Array.isArray(response)) {
        attemptsData = response;
      } else if (response && response.data) {
        if (Array.isArray(response.data)) {
          attemptsData = response.data;
        } else if (response.data.attempts && Array.isArray(response.data.attempts)) {
          attemptsData = response.data.attempts;
        }
      } else if (response && (response as any).attempts && Array.isArray((response as any).attempts)) {
        attemptsData = (response as any).attempts;
      }
      setAttempts(attemptsData);
    } catch (error: any) {
      console.error('Error loading attempts:', error);
      notify(error.message || 'Lỗi tải danh sách bài nộp', 'error');
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handleViewAttemptDetails = async (attemptId: number) => {
    try {
      setLoadingAttemptDetails(true);
      const response = await getAttemptDetails(attemptId);
      // Handle different response structures
      const attemptData = (response as any).data || response;
      setSelectedAttempt(attemptData);
      
      // Initialize grades from existing answers
      const initialGrades: Record<number, { pointsEarned: number; isCorrect?: boolean }> = {};
      if (attemptData.questions) {
        attemptData.questions.forEach((q: any) => {
          if (q.answer) {
            initialGrades[q.id] = {
              pointsEarned: q.answer.pointsEarned || q.answer.points_earned || 0,
              isCorrect: q.answer.isCorrect !== undefined ? q.answer.isCorrect : (q.answer.is_correct !== undefined ? q.answer.is_correct : undefined),
            };
          } else {
            initialGrades[q.id] = {
              pointsEarned: 0,
            };
          }
        });
      }
      setGrades(initialGrades);
      setShowGradingModal(true);
    } catch (error: any) {
      console.error('Error loading attempt details:', error);
      notify(error.message || 'Lỗi tải chi tiết bài nộp', 'error');
    } finally {
      setLoadingAttemptDetails(false);
    }
  };

  const handleGradeChange = (questionId: number, field: 'pointsEarned' | 'isCorrect', value: number | boolean) => {
    setGrades(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  const handleSubmitGrading = async () => {
    if (!selectedAttempt) return;
    
    try {
      setGrading(true);
      const gradesArray = Object.entries(grades).map(([questionId, grade]) => ({
        questionId: parseInt(questionId),
        pointsEarned: grade.pointsEarned,
        isCorrect: grade.isCorrect,
      }));

      await gradeAttempt(selectedAttempt.attempt.id, {
        grades: gradesArray,
      });

      notify('Chấm điểm thành công!', 'success');
      setShowGradingModal(false);
      if (selectedAssignment) {
        await loadAttempts(selectedAssignment.id);
      }
    } catch (error: any) {
      console.error('Error grading attempt:', error);
      notify(error.message || 'Lỗi chấm điểm', 'error');
    } finally {
      setGrading(false);
    }
  };

  const handleRestoreAssignment = async (assignmentId: number) => {
    if (!confirm('Bạn có chắc chắn muốn khôi phục bài tập này?')) {
      return;
    }
    try {
      await restoreAssignment(assignmentId);
      notify('Khôi phục bài tập thành công', 'success');
      // Refresh assignments
      if (selectedLesson) {
        const assignmentsData = await getLessonAssignments(selectedLesson.id);
        setAssignments(assignmentsData);
      }
    } catch (error: any) {
      notify(error.message || 'Lỗi khôi phục bài tập', 'error');
    }
  };

  const handleReply = async (discussionId: number, content: string, videoTimestamp?: number) => {
    if (!selectedLesson) return;

    try {
      await courseService.replyToDiscussion(selectedLesson.id, discussionId, content, videoTimestamp);
      notify('Trả lời thành công!', 'success');
      // Refresh discussions
      const response = await courseService.getLessonDiscussions(selectedLesson.id);
      setDiscussions(response.data || []);
    } catch (error: any) {
      console.error('Error replying to discussion:', error);
      notify(error.message || 'Lỗi trả lời câu hỏi', 'error');
    }
  };

  const refreshDiscussions = async () => {
    if (!selectedLesson) return;
    try {
      setLoadingDiscussions(true);
      const response = await courseService.getLessonDiscussions(selectedLesson.id);
      setDiscussions(response.data || []);
    } catch (error: any) {
      console.error('Error refreshing discussions:', error);
    } finally {
      setLoadingDiscussions(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/dashboard/courses')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Quay lại
          </button>
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">Không tìm thấy khóa học</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/courses')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Quay lại
          </button>
          <div className="flex items-start space-x-6">
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-32 h-32 object-cover rounded-lg shadow-md"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              {course.description && (
                <div 
                  className="prose prose-sm max-w-none text-gray-600 mb-4"
                  dangerouslySetInnerHTML={{ __html: course.description }}
                />
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {course.category && <span>Danh mục: {course.category.name}</span>}
                {course.instructor && <span>Giảng viên: {course.instructor.name}</span>}
                <span>Bài học: {lessons.length}</span>
              </div>
            </div>
            <button
              onClick={() => router.push(`/dashboard/courses/${courseId}/lessons/create`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Thêm bài học
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lessons List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <VideoCameraIcon className="h-6 w-6 mr-2" />
                Danh sách bài học ({lessons.length})
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {lessons.length === 0 ? (
                  <p className="text-gray-500 text-sm">Chưa có bài học nào</p>
                ) : (
                  lessons.map((lesson) => {
                    const isInactive = lesson.isActive === false || lesson.is_active === false;
                    return (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedLesson?.id === lesson.id
                          ? isInactive
                            ? 'border-red-500 bg-red-50'
                            : 'border-blue-500 bg-blue-50'
                          : isInactive
                            ? 'border-red-300 bg-red-50/50 hover:border-red-400 hover:bg-red-100'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">{lesson.title}</div>
                        {isInactive && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                            Đã vô hiệu hóa
                          </span>
                        )}
                      </div>
                      {lesson.description && (
                        <div 
                          className="text-xs text-gray-500 mt-1 line-clamp-2 prose prose-xs max-w-none"
                          dangerouslySetInnerHTML={{ 
                            __html: lesson.description.replace(/<[^>]*>/g, '').substring(0, 100) + (lesson.description.replace(/<[^>]*>/g, '').length > 100 ? '...' : '')
                          }}
                        />
                      )}
                      {lesson.videoDuration && (
                        <div className="text-xs text-blue-600 mt-1">
                          {Math.floor(lesson.videoDuration / 60)}:{(lesson.videoDuration % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Lesson Details */}
          <div className="lg:col-span-2">
            {loadingLessonDetails ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Đang tải thông tin bài học...</p>
              </div>
            ) : selectedLesson && lessonDetails ? (
              <div className="space-y-6">
                {/* Lesson Header */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-semibold">{lessonDetails.title}</h2>
                        {(lessonDetails.isActive === false || lessonDetails.is_active === false) && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded">
                            Đã vô hiệu hóa
                          </span>
                        )}
                      </div>
                      {lessonDetails.description && (
                        <div 
                          className="prose prose-sm max-w-none text-gray-600 mb-4"
                          dangerouslySetInnerHTML={{ __html: lessonDetails.description }}
                        />
                      )}
                      {(lessonDetails.videoDuration || lessonDetails.video_duration) && (
                        <div className="text-sm text-gray-500">
                          Thời lượng: {(() => {
                            const duration = lessonDetails.videoDuration || lessonDetails.video_duration || 0;
                            return `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
                          })()}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/courses/${courseId}/lessons/${lessonDetails.id}/edit`)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium flex items-center gap-2"
                      >
                        Chỉnh sửa
                      </button>
                      {(lessonDetails.isActive !== false && lessonDetails.is_active !== false) ? (
                        <button
                          onClick={async () => {
                            if (confirm('Bạn có chắc chắn muốn vô hiệu hóa bài học này?')) {
                              try {
                                await courseService.deleteLesson(lessonDetails.id);
                                notify('Vô hiệu hóa bài học thành công', 'success');
                                await fetchCourse();
                                setSelectedLesson(null);
                                setLessonDetails(null);
                              } catch (error: any) {
                                notify(error.message || 'Lỗi vô hiệu hóa bài học', 'error');
                              }
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium flex items-center gap-2"
                        >
                          <TrashIcon className="h-5 w-5" />
                          Vô hiệu hóa
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            if (confirm('Bạn có chắc chắn muốn khôi phục bài học này?')) {
                              try {
                                await courseService.restoreLesson(lessonDetails.id);
                                notify('Khôi phục bài học thành công', 'success');
                                await fetchCourse();
                                // Refresh lesson details
                                const updatedLessons = (course as any)?.lessons || lessons;
                                const updatedLesson = updatedLessons.find((l: Lesson) => l.id === lessonDetails.id);
                                if (updatedLesson) {
                                  setSelectedLesson(updatedLesson);
                                  setLessonDetails(updatedLesson);
                                }
                              } catch (error: any) {
                                notify(error.message || 'Lỗi khôi phục bài học', 'error');
                              }
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center gap-2"
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                          Khôi phục
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Video */}
                {(lessonDetails.videoUrl || lessonDetails.video_url) && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <VideoCameraIcon className="h-5 w-5 mr-2" />
                      Video bài giảng
                    </h3>
                    <div className="aspect-video">
                      {(() => {
                        const videoUrl = lessonDetails.videoUrl || lessonDetails.video_url || '';
                        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                          return (
                            <iframe
                              src={videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                              className="w-full h-full rounded-lg"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          );
                        }
                        return (
                          <video
                            src={videoUrl}
                            controls
                            className="w-full h-full rounded-lg"
                          >
                            Trình duyệt không hỗ trợ video.
                          </video>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Content Text */}
                {(lessonDetails.contentText || lessonDetails.content_text) && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Nội dung bài học</h3>
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: lessonDetails.contentText || lessonDetails.content_text || '' }}
                    />
                  </div>
                )}

                {/* Materials */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    Tài liệu đính kèm ({materials.length})
                  </h3>
                  {materials.length === 0 ? (
                    <p className="text-gray-500 text-sm">Chưa có tài liệu đính kèm</p>
                  ) : (
                    <div className="space-y-2">
                      {materials.map((material) => (
                        <a
                          key={material.id}
                          href={material.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                        >
                          <DocumentArrowUpIcon className="h-5 w-5 mr-3 text-blue-500" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{material.title}</div>
                            <div className="text-xs text-gray-500">{material.fileName}</div>
                            {material.fileSize && (
                              <div className="text-xs text-gray-400 mt-1">
                                {(material.fileSize / 1024).toFixed(2)} KB
                              </div>
                            )}
                          </div>
                          <span className="text-blue-600 text-sm">Tải xuống</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assignments Section */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                      Bài tập ({assignments.length})
                    </h3>
                    {(lessonDetails.isActive !== false && lessonDetails.is_active !== false) && (
                      <button
                        onClick={() => router.push(`/dashboard/courses/${courseId}/lessons/${lessonDetails.id}/assignments/create`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                      >
                        <PlusIcon className="h-5 w-5" />
                        Tạo bài tập
                      </button>
                    )}
                  </div>
                  {loadingAssignments ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : assignments.length === 0 ? (
                    <p className="text-gray-500 text-sm">Chưa có bài tập nào</p>
                  ) : (
                    <div className="space-y-3">
                      {assignments.map((assignment) => {
                        const isInactive = assignment.isActive === false || assignment.is_active === false;
                        return (
                          <div
                            key={assignment.id}
                            className={`p-4 border rounded-lg ${
                              isInactive
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                                  {isInactive && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                                      Đã vô hiệu hóa
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                  <div dangerouslySetInnerHTML={{ __html: assignment.description.substring(0, 100) + (assignment.description.length > 100 ? '...' : '') }} />
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>Điểm tối đa: {assignment.maxScore || assignment.max_score || 0}</span>
                                  {assignment.timeLimit || assignment.time_limit ? (
                                    <span>Thời gian: {assignment.timeLimit || assignment.time_limit} phút</span>
                                  ) : null}
                                  {assignment.maxAttempts || assignment.max_attempts ? (
                                    <span>Số lần làm: {assignment.maxAttempts || assignment.max_attempts}</span>
                                  ) : null}
                                </div>
                              </div>
                              <div className="ml-4 flex gap-2">
                                <button
                                  onClick={() => handleViewAttempts(assignment)}
                                  className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium flex items-center gap-1"
                                >
                                  <ClipboardDocumentCheckIcon className="h-4 w-4" />
                                  Xem bài nộp
                                </button>
                                <button
                                  onClick={() => router.push(`/dashboard/courses/${courseId}/lessons/${lessonDetails.id}/assignments/${assignment.id}/edit`)}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-1"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                  Chỉnh sửa
                                </button>
                                {isInactive ? (
                                  <button
                                    onClick={() => handleRestoreAssignment(assignment.id)}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center gap-1"
                                  >
                                    <ArrowPathIcon className="h-4 w-4" />
                                    Khôi phục
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleDisableAssignment(assignment.id)}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium flex items-center gap-1"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                    Vô hiệu hóa
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Q&A Section */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                    Câu hỏi và trả lời ({discussions.length})
                  </h3>
                  {loadingDiscussions ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : discussions.length === 0 ? (
                    <p className="text-gray-500 text-sm">Chưa có câu hỏi nào</p>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {discussions.map((discussion) => (
                        <DiscussionItem
                          key={discussion.id}
                          discussion={discussion}
                          onReply={handleReply}
                          onRefresh={refreshDiscussions}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <VideoCameraIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chọn một bài học để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attempts Modal */}
      {showAttemptsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Bài nộp: {selectedAssignment.title}
                </h2>
                <button
                  onClick={() => {
                    setShowAttemptsModal(false);
                    setSelectedAssignment(null);
                    setAttempts([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {loadingAttempts ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : attempts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Chưa có bài nộp nào</p>
              ) : (
                <div className="space-y-4">
                  {attempts.map((attempt) => {
                    const scoreValue = attempt.score !== undefined && attempt.score !== null 
                      ? (typeof attempt.score === 'number' ? attempt.score : parseFloat(String(attempt.score)) || 0)
                      : 0;
                    const maxScore = selectedAssignment.maxScore || selectedAssignment.max_score || 0;
                    const percentage = maxScore > 0 ? Math.round((scoreValue / maxScore) * 100) : 0;
                    const isPassed = attempt.isPassed || attempt.is_passed || false;
                    const submittedAt = attempt.submittedAt || attempt.submitted_at;
                    const startedAt = attempt.startedAt || attempt.started_at;
                    const attemptNumber = attempt.attemptNumber || attempt.attempt_number || 0;
                    
                    return (
                      <div
                        key={attempt.id}
                        className={`border-2 rounded-lg p-4 ${
                          isPassed
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Lần làm bài {attemptNumber}
                            </h3>
                            {(attempt as any).user && (
                              <p className="text-sm text-gray-600 mt-1">
                                Học viên: {(attempt as any).user.name || (attempt as any).user.email || 'N/A'}
                              </p>
                            )}
                            {submittedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                Nộp bài: {submittedAt ? new Date(submittedAt).toLocaleString('vi-VN') : 'Chưa nộp'}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              isPassed ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {scoreValue.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-600">/ {maxScore} điểm</div>
                            <div className={`text-sm font-semibold mt-1 ${
                              isPassed ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {percentage}%
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewAttemptDetails(attempt.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                          >
                            Xem chi tiết & Chấm điểm
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {showGradingModal && selectedAttempt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Chấm điểm bài nộp</h2>
                <button
                  onClick={() => {
                    setShowGradingModal(false);
                    setSelectedAttempt(null);
                    setGrades({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              {selectedAttempt.attempt && (selectedAttempt.attempt as any).user && (
                <p className="text-sm text-gray-600 mt-2">
                  Học viên: {(selectedAttempt.attempt as any).user.name || (selectedAttempt.attempt as any).user.email || 'N/A'}
                </p>
              )}
            </div>
            <div className="p-6">
              {loadingAttemptDetails ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : selectedAttempt.questions && selectedAttempt.questions.length > 0 ? (
                <div className="space-y-6">
                  {selectedAttempt.questions.map((question: any, index: number) => {
                    const questionId = question.id;
                    const questionType = question.questionType || question.question_type || 1;
                    const isMultipleChoice = questionType === 1 || questionType === 2;
                    const defaultPoints = question.defaultPoints || question.default_points || 0;
                    const answer = question.answer;
                    const currentGrade = grades[questionId] || { pointsEarned: 0 };
                    
                    return (
                      <div key={questionId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-semibold text-sm">
                                Câu {index + 1}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({defaultPoints} điểm)
                              </span>
                            </div>
                            <div className="text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: question.questionContent || question.question_content || '' }} />
                            
                            {isMultipleChoice && question.options && question.options.length > 0 && (
                              <div className="space-y-2 mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Các lựa chọn:</p>
                                {question.options.map((option: any, optIndex: number) => {
                                  const isSelected = answer && (answer.optionId === option.id || answer.option_id === option.id);
                                  const isCorrect = option.isCorrect || option.is_correct;
                                  
                                  return (
                                    <div
                                      key={option.id}
                                      className={`p-3 rounded border-2 ${
                                        isSelected
                                          ? isCorrect
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-red-500 bg-red-50'
                                          : isCorrect
                                          ? 'border-green-300 bg-green-50'
                                          : 'border-gray-200 bg-gray-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                          {String.fromCharCode(65 + optIndex)}.
                                        </span>
                                        <span className="flex-1" dangerouslySetInnerHTML={{ __html: option.content || option.optionContent || option.option_content || '' }} />
                                        {isSelected && (
                                          <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                                            isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                                          }`}>
                                            {isCorrect ? '✓ Đúng (Đã chọn)' : '✗ Sai (Đã chọn)'}
                                          </span>
                                        )}
                                        {!isSelected && isCorrect && (
                                          <span className="ml-auto text-green-600 font-semibold">✓ Đáp án đúng</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                {answer && !question.options.some((opt: any) => answer.optionId === opt.id || answer.option_id === opt.id) && (
                                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded">
                                    <p className="text-sm text-yellow-800">
                                      <strong>Lưu ý:</strong> Học viên chưa chọn đáp án cho câu hỏi này.
                                    </p>
                                  </div>
                                )}
                                {!answer && (
                                  <div className="mt-2 p-2 bg-gray-50 border border-gray-300 rounded">
                                    <p className="text-sm text-gray-600">
                                      Học viên chưa trả lời câu hỏi này.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {!isMultipleChoice && (
                              <div className="mb-4">
                                {answer && (answer.answerText || answer.answer_text) ? (
                                  <div className="p-4 bg-blue-50 rounded border-2 border-blue-300">
                                    <p className="text-sm font-semibold text-blue-900 mb-2">📝 Câu trả lời của học viên:</p>
                                    <div className="bg-white p-3 rounded border border-blue-200">
                                      <p className="text-gray-900 whitespace-pre-wrap">{answer.answerText || answer.answer_text || ''}</p>
                                    </div>
                                    {answer.pointsEarned !== undefined && answer.pointsEarned !== null && (
                                      <p className="text-xs text-blue-700 mt-2">
                                        Điểm hiện tại: <strong>{answer.pointsEarned || answer.points_earned || 0}</strong> / {defaultPoints} điểm
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-3 bg-gray-50 rounded border border-gray-300">
                                    <p className="text-sm text-gray-600">
                                      Học viên chưa trả lời câu hỏi này.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="border-t pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Điểm số
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={defaultPoints}
                                step="0.1"
                                value={currentGrade.pointsEarned}
                                onChange={(e) => handleGradeChange(questionId, 'pointsEarned', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">Tối đa: {defaultPoints} điểm</p>
                            </div>
                            {!isMultipleChoice && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Đánh giá
                                </label>
                                <select
                                  value={currentGrade.isCorrect === true ? 'correct' : currentGrade.isCorrect === false ? 'incorrect' : 'pending'}
                                  onChange={(e) => {
                                    const value = e.target.value === 'correct' ? true : e.target.value === 'incorrect' ? false : undefined;
                                    handleGradeChange(questionId, 'isCorrect', value as boolean);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="pending">Chưa chấm</option>
                                  <option value="correct">Đúng</option>
                                  <option value="incorrect">Sai</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="border-t pt-4 flex justify-end gap-4">
                    <button
                      onClick={() => {
                        setShowGradingModal(false);
                        setSelectedAttempt(null);
                        setGrades({});
                      }}
                      className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSubmitGrading}
                      disabled={grading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {grading ? 'Đang lưu...' : 'Lưu điểm'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Không có câu hỏi nào</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

interface DiscussionItemProps {
  discussion: LessonDiscussion;
  onReply: (discussionId: number, content: string, videoTimestamp?: number) => void;
  onRefresh?: () => void;
}

function DiscussionItem({ discussion, onReply, onRefresh }: DiscussionItemProps) {
  const [replyContent, setReplyContent] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [videoTimestamp, setVideoTimestamp] = useState<string>('');

  const handleReplySubmit = async () => {
    const content = replyContent.trim();
    if (!content) {
      return;
    }
    
    // Parse video timestamp (format: MM:SS or seconds)
    let timestamp: number | undefined = undefined;
    if (videoTimestamp.trim()) {
      const parts = videoTimestamp.trim().split(':');
      if (parts.length === 2) {
        // Format: MM:SS
        const minutes = parseInt(parts[0], 10) || 0;
        const seconds = parseInt(parts[1], 10) || 0;
        timestamp = minutes * 60 + seconds;
      } else {
        // Format: seconds
        timestamp = parseInt(videoTimestamp.trim(), 10) || undefined;
      }
    }
    
    await onReply(discussion.id, content, timestamp);
    setReplyContent('');
    setVideoTimestamp('');
    setShowReplyForm(false);
    // Refresh to show new reply
    if (onRefresh) {
      setTimeout(() => onRefresh(), 500);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start space-x-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-gray-900">
              {discussion.user?.name || 'Người dùng'}
            </span>
            {discussion.videoTimestamp && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                Tại {Math.floor(discussion.videoTimestamp / 60)}:{(discussion.videoTimestamp % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
          <p className="text-gray-700">{discussion.content}</p>
          <div className="text-xs text-gray-500 mt-1">
            {(discussion.createdAt || discussion.created_at) ? new Date(discussion.createdAt || discussion.created_at || '').toLocaleString('vi-VN') : ''}
          </div>
        </div>
      </div>

      {/* Replies */}
      {discussion.replies && discussion.replies.length > 0 && (
        <div className="ml-8 mt-4 space-y-3 border-l-2 border-gray-200 pl-4">
          {discussion.replies.map((reply) => (
            <div key={reply.id} className={`${reply.isInstructor ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'} p-3 rounded`}>
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-gray-900">
                  {reply.user?.name || 'Người dùng'}
                </span>
                {reply.isInstructor && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Giảng viên</span>
                )}
                {((reply.videoTimestamp ?? reply.video_timestamp) !== undefined && (reply.videoTimestamp ?? reply.video_timestamp) !== null) && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Tại {Math.floor((reply.videoTimestamp ?? reply.video_timestamp ?? 0) / 60)}:{((reply.videoTimestamp ?? reply.video_timestamp ?? 0) % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
              <p className="text-gray-700">{reply.content}</p>
              <div className="text-xs text-gray-500 mt-1">
                {(reply.createdAt || reply.created_at) ? new Date(reply.createdAt || reply.created_at || '').toLocaleString('vi-VN') : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {!showReplyForm ? (
        <button
          onClick={() => setShowReplyForm(true)}
          className="mt-3 text-sm text-blue-600 hover:text-blue-900 font-medium"
        >
          + Trả lời
        </button>
      ) : (
        <div className="mt-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Nhập câu trả lời..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mốc thời gian video (tùy chọn, định dạng: MM:SS hoặc số giây)
            </label>
            <input
              type="text"
              value={videoTimestamp}
              onChange={(e) => setVideoTimestamp(e.target.value)}
              placeholder="VD: 1:30 hoặc 90"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {discussion.videoTimestamp && (
              <button
                type="button"
                onClick={() => {
                  const minutes = Math.floor(discussion.videoTimestamp! / 60);
                  const seconds = discussion.videoTimestamp! % 60;
                  setVideoTimestamp(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                }}
                className="mt-1 text-xs text-blue-600 hover:text-blue-900"
              >
                Dùng mốc thời gian của câu hỏi ({Math.floor(discussion.videoTimestamp / 60)}:{(discussion.videoTimestamp % 60).toString().padStart(2, '0')})
              </button>
            )}
          </div>
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => {
                setShowReplyForm(false);
                setReplyContent('');
                setVideoTimestamp('');
              }}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleReplySubmit}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

