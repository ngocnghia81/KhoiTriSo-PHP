'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { httpClient } from '@/lib/http-client';
import Link from 'next/link';

interface Material {
  id: number;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  download_count: number;
}

interface Lesson {
  id: number;
  title: string;
  lesson_type: string;
  duration: number;
  lesson_order: number;
  is_preview: boolean;
  video_url?: string;
  content?: string;
  content_text?: string;
  is_completed?: boolean;
  materials?: Material[];
}

interface Discussion {
  id: number;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
  };
  user_name?: string; // For backward compatibility
  content: string;
  video_timestamp?: number;
  videoTimestamp?: number;
  parent_id?: number;
  parentId?: number;
  like_count?: number;
  likeCount?: number;
  is_instructor?: boolean;
  isInstructor?: boolean;
  created_at: string;
  createdAt?: string;
  replies?: Discussion[];
}

interface Note {
  id: number;
  content: string;
  video_timestamp?: number | null;
  timestamp?: number; // For backward compatibility
  created_at: string;
  updated_at?: string;
}

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string;
  instructor: {
    id: number;
    name: string;
  };
  lessons: Lesson[];
}

export default function CourseLearningPage() {
  console.log('🔵 CourseLearningPage component rendered');
  
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  console.log('🔵 Params:', params);
  console.log('🔵 Course ID:', courseId);

  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'discussion' | 'notes'>('overview');
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null);
  const [isYouTube, setIsYouTube] = useState<boolean>(false);

  useEffect(() => {
    console.log('🟢 useEffect triggered');
    console.log('🟢 courseId in useEffect:', courseId);
    
    if (courseId) {
      console.log('🟢 Calling fetchCourseData...');
      fetchCourseData();
      loadStoredData();
    } else {
      console.log('🔴 No courseId!');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Load discussions when currentLesson changes
  useEffect(() => {
    if (currentLesson && currentLesson.id) {
      console.log('Loading discussions for current lesson:', currentLesson.id);
      loadLessonData(currentLesson.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLesson?.id]);

  const loadStoredData = () => {
    // Load completed lessons from localStorage
    const storedCompleted = localStorage.getItem(`completed-lessons-${courseId}`);
    if (storedCompleted) {
      setCompletedLessons(new Set(JSON.parse(storedCompleted)));
    }

    // Load discussions from localStorage
    const storedDiscussions = localStorage.getItem(`discussions-${courseId}`);
    if (storedDiscussions) {
      setDiscussions(JSON.parse(storedDiscussions));
    }

    // Load notes from localStorage
    const storedNotes = localStorage.getItem(`notes-${courseId}`);
    if (storedNotes) {
      setNotes(JSON.parse(storedNotes));
    }
  };

  const fetchCourseData = async () => {
    if (isFetching) {
      console.log('⚠️ Already fetching, skip...');
      return;
    }
    
    console.log('=== FETCH START ===');
    console.log('Course ID:', courseId);
    
    try {
      setIsFetching(true);
      setLoading(true);
      console.log('Making API request to:', `/courses/${courseId}`);
      
      // Fetch course with lessons
      const response = await httpClient.get(`courses/${courseId}`);
      
      console.log('Learn page - Full response:', response);
      console.log('Learn page - Response data:', response.data);
      
      if (response.ok && response.data) {
        const courseData = response.data as any;
        console.log('Setting course...');
        console.log('Total lessons in response:', courseData.lessons?.length);
        console.log('Lessons array:', courseData.lessons);
        
        setCourse(courseData);
        
        // Set first lesson as current
        if (courseData.lessons && courseData.lessons.length > 0) {
          const firstLesson = courseData.lessons[0];
          setCurrentLesson(firstLesson);
          console.log('First lesson set:', firstLesson);
          // Load discussions for first lesson
          // Note: loadLessonData is defined below, so we'll use useEffect to call it
        } else {
          console.log('No lessons found in response');
        }
      } else {
        console.log('Response is null or undefined');
      }
    } catch (error) {
      console.error('=== ERROR CAUGHT ===');
      console.error('Lỗi khi tải khóa học:', error);
      
      const errorResponse = error as { response?: { status?: number } };
      if (errorResponse.response?.status === 401) {
        router.push(`/auth/login?redirect=/courses/${courseId}/learn`);
      } else if (errorResponse.response?.status === 404) {
        router.push('/404');
      }
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
      setIsFetching(false);
    }
  };

  const loadLessonData = async (lessonId: number) => {
    // Load notes from API
    try {
      console.log('Loading notes for lesson:', lessonId);
      const notesResponse = await httpClient.get(`lessons/${lessonId}/notes`);
      console.log('Notes API response:', notesResponse);
      
      if (notesResponse.ok && notesResponse.data) {
        const notesData = notesResponse.data as any;
        // API returns { success: true, data: [...] }
        let notesArray = [];
        if (notesData.success && notesData.data) {
          notesArray = notesData.data;
        } else if (Array.isArray(notesData)) {
          notesArray = notesData;
        } else if (notesData.data && Array.isArray(notesData.data)) {
          notesArray = notesData.data;
        }
        
        const formattedNotes = Array.isArray(notesArray) ? notesArray.map((n: any) => ({
          id: n.id,
          content: n.content,
          video_timestamp: n.video_timestamp,
          timestamp: n.video_timestamp || 0, // For backward compatibility
          created_at: n.created_at || new Date().toISOString(),
          updated_at: n.updated_at,
        })) : [];
        
        // Sort by created_at descending (newest first)
        formattedNotes.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA; // Descending order
        });
        
        console.log('Formatted notes:', formattedNotes);
        setNotes(formattedNotes);
      } else {
        console.error('Failed to load notes:', notesResponse);
        setNotes([]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    }

    // Load discussions from API
    try {
      console.log('Loading discussions for lesson:', lessonId);
      const response = await httpClient.get(`lessons/${lessonId}/discussions`);
      console.log('Discussions API response:', response);
      
      if (response.ok && response.data) {
        const apiResponse = response.data as any;
        console.log('API Response:', apiResponse);
        
        // API returns { success: true, data: [...], total: ... } from paginated method
        let discussionsData = [];
        if (apiResponse.success && apiResponse.data) {
          discussionsData = apiResponse.data;
        } else if (Array.isArray(apiResponse)) {
          discussionsData = apiResponse;
        } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
          discussionsData = apiResponse.data;
        }
        
        console.log('Discussions data:', discussionsData);
        
        const formattedDiscussions = Array.isArray(discussionsData) ? discussionsData.map((d: any) => ({
          id: d.id,
          user_id: d.user_id,
          user: d.user,
          user_name: d.user?.name || d.user_name || 'Người dùng',
          content: d.content,
          video_timestamp: d.video_timestamp || d.videoTimestamp,
          parent_id: d.parent_id || d.parentId,
          like_count: d.like_count || d.likeCount || 0,
          is_instructor: d.is_instructor || d.isInstructor || false,
          created_at: d.created_at || d.createdAt || new Date().toISOString(),
        })) : [];
        
        // Sort by created_at descending (newest first)
        formattedDiscussions.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA; // Descending order
        });
        
        console.log('Formatted discussions:', formattedDiscussions);
        setDiscussions(formattedDiscussions);
      } else {
        console.error('Failed to load discussions:', response);
        setDiscussions([]);
      }
    } catch (error) {
      console.error('Error loading discussions:', error);
      setDiscussions([]);
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    // Load notes and discussions for this lesson
    loadLessonData(lesson.id);
  };

  const toggleLessonCompletion = (lessonId: number) => {
    const newCompleted = new Set(completedLessons);
    if (newCompleted.has(lessonId)) {
      newCompleted.delete(lessonId);
    } else {
      newCompleted.add(lessonId);
    }
    
    setCompletedLessons(newCompleted);
    localStorage.setItem(`completed-lessons-${courseId}`, JSON.stringify([...newCompleted]));
  };

  const saveNote = async () => {
    if (!note.trim() || !currentLesson) return;
    
    try {
      // Get current video time if available
      let videoTimestamp: number | null = null;
      if (isYouTube && youtubePlayer && youtubePlayer.getCurrentTime) {
        try {
          videoTimestamp = Math.floor(youtubePlayer.getCurrentTime());
        } catch (e) {
          console.error('Error getting YouTube current time:', e);
        }
      } else if (videoRef && videoRef.currentTime) {
        videoTimestamp = Math.floor(videoRef.currentTime);
      } else if (currentVideoTime > 0) {
        videoTimestamp = currentVideoTime;
      }
      
      console.log('Saving note to lesson:', currentLesson.id, 'at timestamp:', videoTimestamp);
      const response = await httpClient.post(`lessons/${currentLesson.id}/notes`, {
        content: note,
        videoTimestamp: videoTimestamp,
      });
      
      console.log('Note API response:', response);
      
      if (response.ok && response.data) {
        const responseData = response.data as any;
        // API returns { success: true, data: {...} }
        const savedNote = responseData.success && responseData.data ? responseData.data : responseData;
        
        const newNote: Note = {
          id: savedNote.id,
          content: savedNote.content,
          video_timestamp: savedNote.video_timestamp,
          timestamp: savedNote.video_timestamp || 0,
          created_at: savedNote.created_at || new Date().toISOString(),
          updated_at: savedNote.updated_at,
        };
        
        // Add new note and sort by created_at descending
        const updatedNotes = [...notes, newNote].sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA; // Descending order
        });
        setNotes(updatedNotes);
        setNote('');
      } else {
        console.error('Failed to save note:', response);
        alert('Không thể lưu ghi chú. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi khi lưu ghi chú:', error);
      alert('Có lỗi xảy ra khi lưu ghi chú. Vui lòng thử lại.');
    }
  };

  const postQuestion = async () => {
    if (!newQuestion.trim() || !currentLesson) return;
    
    try {
      // Get current video time if available
      let videoTimestamp: number | null = null;
      if (isYouTube && youtubePlayer && youtubePlayer.getCurrentTime) {
        try {
          videoTimestamp = Math.floor(youtubePlayer.getCurrentTime());
        } catch (e) {
          console.error('Error getting YouTube current time:', e);
        }
      } else if (videoRef && videoRef.currentTime) {
        videoTimestamp = Math.floor(videoRef.currentTime);
      } else if (currentVideoTime > 0) {
        videoTimestamp = currentVideoTime;
      }
      
      console.log('Posting question to lesson:', currentLesson.id, 'at timestamp:', videoTimestamp, 'isYouTube:', isYouTube, 'hasPlayer:', !!youtubePlayer);
      const response = await httpClient.post(`lessons/${currentLesson.id}/discussions`, {
        content: newQuestion,
        videoTimestamp: videoTimestamp,
      });
      
      console.log('Discussion API response:', response);
      
      if (response.ok && response.data) {
        const apiResponse = response.data as any;
        console.log('API Response data:', apiResponse);
        
        // Backend returns { success: true, data: {...} }
        const newDiscussionData = apiResponse.data || apiResponse;
        
        if (!newDiscussionData || !newDiscussionData.id) {
          console.error('Invalid discussion data:', newDiscussionData);
          alert('Dữ liệu trả về không hợp lệ. Vui lòng thử lại.');
          return;
        }
        
        const newDiscussion: Discussion = {
          id: newDiscussionData.id,
          user_id: newDiscussionData.user_id,
          user: newDiscussionData.user,
          user_name: newDiscussionData.user?.name || 'Bạn',
          content: newDiscussionData.content,
          video_timestamp: newDiscussionData.video_timestamp,
          like_count: newDiscussionData.like_count || 0,
          is_instructor: newDiscussionData.is_instructor || false,
          created_at: newDiscussionData.created_at || new Date().toISOString(),
        };
        
        // Add new discussion and sort by created_at descending
        const updatedDiscussions = [newDiscussion, ...discussions].sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA; // Descending order
        });
        setDiscussions(updatedDiscussions);
        setNewQuestion('');
      } else {
        console.error('Failed to post question:', response);
        const errorMsg = response.error?.message || 'Có lỗi xảy ra khi đăng câu hỏi. Vui lòng thử lại.';
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('Error posting question:', error);
      alert(error?.message || 'Có lỗi xảy ra khi đăng câu hỏi. Vui lòng thử lại.');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Không tìm thấy khóa học</div>
          <Link href="/my-learning" className="text-blue-400 hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  if (!currentLesson && (!course.lessons || course.lessons.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-2">Khóa học chưa có bài học</div>
          <p className="text-gray-400 mb-4">Vui lòng quay lại sau</p>
          <Link href="/my-learning" className="text-blue-400 hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  if (!currentLesson) {
    return null; // This should not happen as we set first lesson above
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/my-learning" className="hover:text-blue-400 transition-colors">
            ← Quay lại
          </Link>
          <h1 className="font-semibold text-lg line-clamp-1">{course.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-gray-800 rounded"
          >
            {sidebarOpen ? 'X' : 'Menu'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className={`flex-1 ${sidebarOpen ? 'lg:mr-96' : ''} overflow-y-auto`}>
          {/* Video Player */}
          {currentLesson.video_url ? (
            <div className="bg-black aspect-video">
              {currentLesson.video_url.includes('youtube.com') || currentLesson.video_url.includes('youtu.be') ? (
                <div id={`youtube-player-${currentLesson.id}`} className="w-full h-full"></div>
              ) : (
                <video
                  key={currentLesson.id}
                  ref={(el) => setVideoRef(el)}
                  controls
                  className="w-full h-full"
                  src={currentLesson.video_url}
                  onTimeUpdate={(e) => {
                    const video = e.currentTarget;
                    if (video) {
                      setCurrentVideoTime(Math.floor(video.currentTime));
                    }
                  }}
                >
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 aspect-video flex items-center justify-center text-white">
              <span className="text-xl">Video không khả dụng</span>
            </div>
          )}

          {/* Lesson Content */}
          <div className="bg-white p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentLesson.title}
              </h2>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3 px-1 font-medium transition-colors border-b-2 ${
                    activeTab === 'overview'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  Tổng quan
                </button>
                <button
                  onClick={() => setActiveTab('discussion')}
                  className={`pb-3 px-1 font-medium transition-colors border-b-2 ${
                    activeTab === 'discussion'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  Hỏi đáp ({discussions.length})
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`pb-3 px-1 font-medium transition-colors border-b-2 ${
                    activeTab === 'notes'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  Ghi chú ({notes.length})
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div>
                {/* Lesson Content */}
                <div className="prose max-w-none mb-8">
                  {currentLesson.content_text ? (
                    <div dangerouslySetInnerHTML={{ __html: currentLesson.content_text }} />
                  ) : (
                    <p className="text-gray-500">Chưa có nội dung tổng quan cho bài học này.</p>
                  )}
                </div>

                {/* Materials Section */}
                {currentLesson.materials && currentLesson.materials.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Tài liệu bài học ({currentLesson.materials.length})
                    </h3>
                    <div className="grid gap-4">
                      {currentLesson.materials.map(material => (
                        <div key={material.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              {material.file_type === 'pdf' && '📄'}
                              {material.file_type === 'docx' && '📝'}
                              {material.file_type === 'pptx' && '📊'}
                              {material.file_type === 'xlsx' && '📈'}
                              {material.file_type === 'mp4' && '🎥'}
                              {!['pdf', 'docx', 'pptx', 'xlsx', 'mp4'].includes(material.file_type) && '📁'}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{material.title}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{material.file_type.toUpperCase()}</span>
                                <span>•</span>
                                <span>{(material.file_size / 1024 / 1024).toFixed(2)} MB</span>
                                <span>•</span>
                                <span>{material.download_count} lượt tải</span>
                              </div>
                            </div>
                          </div>
                          <a
                            href={material.file_path}
                            download
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <span>⬇️</span>
                            Tải xuống
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'discussion' && (
              <div>
                {/* Post Question Form */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Đặt câu hỏi</h3>
                  <textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Nhập câu hỏi của bạn..."
                    className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                  <button
                    onClick={postQuestion}
                    disabled={!newQuestion.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Đăng câu hỏi
                  </button>
                </div>

                {/* Discussions List */}
                <div className="space-y-4">
                  {discussions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!
                    </p>
                  ) : (
                    discussions.map(discussion => (
                      <div key={discussion.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          {discussion.user?.avatar ? (
                            <img 
                              src={discussion.user.avatar} 
                              alt={discussion.user_name || 'User'}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                              {(discussion.user_name || discussion.user?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">
                                {discussion.user_name || discussion.user?.name || 'Người dùng'}
                              </span>
                              {discussion.is_instructor && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded">
                                  Giảng viên
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                {new Date(discussion.created_at).toLocaleDateString('vi-VN')}
                              </span>
                              {discussion.video_timestamp && discussion.video_timestamp > 0 && (
                                <span className="text-xs text-gray-400">
                                  @ {Math.floor(discussion.video_timestamp / 60)}:{(discussion.video_timestamp % 60).toString().padStart(2, '0')}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700">{discussion.content}</p>
                            {discussion.like_count && discussion.like_count > 0 && (
                              <div className="mt-2 text-sm text-gray-500">
                                👍 {discussion.like_count} lượt thích
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                {/* Add Note Form */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Thêm ghi chú</h3>
                  {currentVideoTime > 0 && (
                    <div className="mb-2 text-sm text-gray-600">
                      Thời gian video hiện tại: {Math.floor(currentVideoTime / 60)}:{(currentVideoTime % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Viết ghi chú của bạn..."
                    className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                  <button
                    onClick={saveNote}
                    disabled={!note.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lưu ghi chú {currentVideoTime > 0 && `(@ ${Math.floor(currentVideoTime / 60)}:${(currentVideoTime % 60).toString().padStart(2, '0')})`}
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                  {notes.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Chưa có ghi chú nào. Hãy thêm ghi chú đầu tiên!
                    </p>
                  ) : (
                    notes.map(noteItem => (
                      <div key={noteItem.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-500">
                              {new Date(noteItem.created_at).toLocaleDateString('vi-VN')}
                            </span>
                            {noteItem.video_timestamp !== null && noteItem.video_timestamp !== undefined && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded font-medium">
                                @ {Math.floor(noteItem.video_timestamp / 60)}:{(noteItem.video_timestamp % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{noteItem.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                onClick={() => {
                  const currentIndex = course.lessons.findIndex(l => l.id === currentLesson.id);
                  if (currentIndex > 0) {
                    handleLessonClick(course.lessons[currentIndex - 1]);
                  }
                }}
                disabled={course.lessons[0].id === currentLesson.id}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Bài trước
              </button>
              
              <button
                onClick={() => {
                  const currentIndex = course.lessons.findIndex(l => l.id === currentLesson.id);
                  if (currentIndex < course.lessons.length - 1) {
                    handleLessonClick(course.lessons[currentIndex + 1]);
                  }
                }}
                disabled={course.lessons[course.lessons.length - 1].id === currentLesson.id}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bài tiếp theo →
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Lesson List */}
        <aside
          className={`
            fixed lg:fixed top-[57px] right-0 bottom-0 w-96 bg-white border-l shadow-lg
            transform transition-transform duration-300 z-40
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg text-gray-900">Nội dung khóa học</h3>
              <p className="text-sm text-gray-600 mt-1">
                {course.lessons.length} bài học
              </p>
            </div>

            {/* Lesson List */}
            <div className="flex-1 overflow-y-auto">
              {course.lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`
                    p-4 border-b transition-colors
                    ${currentLesson.id === lesson.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={lesson.is_completed || completedLessons.has(lesson.id)}
                        onChange={() => toggleLessonCompletion(lesson.id)}
                        className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                      />
                    </div>

                    {/* Lesson Number */}
                    <div className="flex-shrink-0">
                      <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                    </div>

                    {/* Lesson Content */}
                    <button
                      onClick={() => handleLessonClick(lesson)}
                      className="flex-1 min-w-0 text-left hover:text-blue-600 transition-colors"
                    >
                      <h4 className={`font-medium mb-1 line-clamp-2 ${
                        completedLessons.has(lesson.id) ? 'text-green-700' : 'text-gray-900'
                      }`}>
                        {lesson.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>
                          {lesson.lesson_type === 'video' ? 'Video' : 'Bài giảng'}
                        </span>
                        {lesson.duration > 0 && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(lesson.duration)}</span>
                          </>
                        )}
                        {completedLessons.has(lesson.id) && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-medium">✓ Đã học</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
