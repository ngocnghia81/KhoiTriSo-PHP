'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { createLiveClass } from '@/services/liveclasses';

export default function CreateLiveClassPage() {
  useAuthGuard();
  const router = useRouter();
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
  const [submitting, setSubmitting] = useState(false);

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
    const res = await createLiveClass(payload);
    setSubmitting(false);
    if (res.ok) {
      router.push('/instructor/live-classes');
    } else {
      alert('Tạo lớp học thất bại');
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Tạo lớp học trực tuyến</h1>
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
          <button disabled={submitting} className="px-5 py-2 rounded bg-blue-600 text-white">{submitting ? 'Đang tạo...' : 'Tạo lớp'}</button>
          <button type="button" onClick={()=>history.back()} className="px-5 py-2 rounded border">Hủy</button>
        </div>
      </form>
    </div>
  );
}



