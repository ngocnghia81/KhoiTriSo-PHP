'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { getLiveClass, updateLiveClass } from '@/services/liveclasses';

export default function EditLiveClassPage({ params }: { params: { id: string } }) {
  useAuthGuard();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    courseId: '',
    scheduledAt: '',
    durationMinutes: 60,
    maxParticipants: 100,
    meetingUrl: '',
    meetingId: '',
    meetingPassword: '',
  });

  useEffect(() => {
    (async () => {
      const idNum = Number(params.id);
      const res = await getLiveClass(idNum);
      if (res.ok && res.data) {
        const lc: any = res.data;
        setForm({
          title: lc.title ?? '',
          description: lc.description ?? '',
          courseId: String(lc.courseId ?? ''),
          scheduledAt: lc.scheduledAt ? lc.scheduledAt.slice(0, 16) : '',
          durationMinutes: lc.durationMinutes ?? 60,
          maxParticipants: lc.maxParticipants ?? 100,
          meetingUrl: lc.meetingUrl ?? '',
          meetingId: lc.meetingId ?? '',
          meetingPassword: lc.meetingPassword ?? '',
        });
      }
      setLoading(false);
    })();
  }, [params.id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      title: form.title,
      description: form.description,
      courseId: Number(form.courseId) || undefined,
      scheduledAt: form.scheduledAt,
      durationMinutes: Number(form.durationMinutes) || 60,
      maxParticipants: Number(form.maxParticipants) || 100,
      meetingUrl: form.meetingUrl,
      meetingId: form.meetingId,
      meetingPassword: form.meetingPassword,
    };
    const res = await updateLiveClass(Number(params.id), payload);
    setSubmitting(false);
    if (res.ok) {
      router.push('/instructor/live-classes');
    } else {
      alert('Cập nhật thất bại');
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Chỉnh sửa lớp học trực tuyến</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full border rounded px-3 py-2" placeholder="Tiêu đề" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} required />
        <textarea className="w-full border rounded px-3 py-2" placeholder="Mô tả" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />
        <input className="w-full border rounded px-3 py-2" placeholder="ID khóa học (tùy chọn)" value={form.courseId} onChange={(e)=>setForm({...form, courseId:e.target.value})} />
        <input className="w-full border rounded px-3 py-2" type="datetime-local" value={form.scheduledAt} onChange={(e)=>setForm({...form, scheduledAt:e.target.value})} required />
        <div className="grid grid-cols-2 gap-4">
          <input className="w-full border rounded px-3 py-2" type="number" placeholder="Thời lượng (phút)" value={form.durationMinutes} onChange={(e)=>setForm({...form, durationMinutes:Number(e.target.value)})} />
          <input className="w-full border rounded px-3 py-2" type="number" placeholder="Số HV tối đa" value={form.maxParticipants} onChange={(e)=>setForm({...form, maxParticipants:Number(e.target.value)})} />
        </div>
        <input className="w-full border rounded px-3 py-2" placeholder="Link phòng học" value={form.meetingUrl} onChange={(e)=>setForm({...form, meetingUrl:e.target.value})} />
        <div className="grid grid-cols-2 gap-4">
          <input className="w-full border rounded px-3 py-2" placeholder="Meeting ID" value={form.meetingId} onChange={(e)=>setForm({...form, meetingId:e.target.value})} />
          <input className="w-full border rounded px-3 py-2" placeholder="Mật khẩu" value={form.meetingPassword} onChange={(e)=>setForm({...form, meetingPassword:e.target.value})} />
        </div>
        <div className="flex gap-3">
          <button disabled={submitting} className="px-5 py-2 rounded bg-blue-600 text-white">{submitting ? 'Đang lưu...' : 'Lưu'}</button>
          <button type="button" onClick={()=>history.back()} className="px-5 py-2 rounded border">Hủy</button>
        </div>
      </form>
    </div>
  );
}



