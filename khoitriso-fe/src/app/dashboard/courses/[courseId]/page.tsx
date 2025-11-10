'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, VideoCameraIcon, PlusIcon, ChatBubbleLeftRightIcon, XMarkIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { courseService, Course, Lesson, LessonDiscussion } from '@/services/courseService';
import { getInstructorCourse } from '@/services/instructor';
import { useToast } from '@/components/ToastProvider';

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
  const [loading, setLoading] = useState(true);
  const [loadingLessonDetails, setLoadingLessonDetails] = useState(false);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);

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
    setLoadingLessonDetails(true);
    setLoadingDiscussions(true);
    
    try {
      // Fetch lesson details with materials
      const lessonData = await courseService.getLessonAdmin(lesson.id);
      setLessonDetails(lessonData);
      setMaterials(lessonData.materials || []);
      
      // Fetch discussions
      const response = await courseService.getLessonDiscussions(lesson.id);
      setDiscussions(response.data || []);
    } catch (error: any) {
      console.error('Error fetching lesson details:', error);
      notify(error.message || 'Lỗi tải thông tin bài học', 'error');
    } finally {
      setLoadingLessonDetails(false);
      setLoadingDiscussions(false);
    }
  };

  const handleReply = async (discussionId: number, content: string) => {
    if (!selectedLesson) return;

    try {
      await courseService.replyToDiscussion(selectedLesson.id, discussionId, content);
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
              <p className="text-gray-600 mb-4">{course.description}</p>
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
                  lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedLesson?.id === lesson.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{lesson.title}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {lesson.description}
                      </div>
                      {lesson.videoDuration && (
                        <div className="text-xs text-blue-600 mt-1">
                          {Math.floor(lesson.videoDuration / 60)}:{(lesson.videoDuration % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </button>
                  ))
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
                  <h2 className="text-2xl font-semibold mb-2">{lessonDetails.title}</h2>
                  <div className="text-gray-600 mb-4">{lessonDetails.description}</div>
                  {(lessonDetails.videoDuration || lessonDetails.video_duration) && (
                    <div className="text-sm text-gray-500">
                      Thời lượng: {(() => {
                        const duration = lessonDetails.videoDuration || lessonDetails.video_duration || 0;
                        return `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
                      })()}
                    </div>
                  )}
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

    </div>
  );
}

interface DiscussionItemProps {
  discussion: LessonDiscussion;
  onReply: (discussionId: number, content: string) => void;
  onRefresh?: () => void;
}

function DiscussionItem({ discussion, onReply, onRefresh }: DiscussionItemProps) {
  const [replyContent, setReplyContent] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReplySubmit = async () => {
    const content = replyContent.trim();
    if (!content) {
      return;
    }
    await onReply(discussion.id, content);
    setReplyContent('');
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
            {new Date(discussion.createdAt).toLocaleString('vi-VN')}
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
              </div>
              <p className="text-gray-700">{reply.content}</p>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(reply.createdAt).toLocaleString('vi-VN')}
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
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => {
                setShowReplyForm(false);
                setReplyContent('');
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

