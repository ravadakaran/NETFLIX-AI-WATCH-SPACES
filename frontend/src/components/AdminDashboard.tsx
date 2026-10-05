import React, { useState } from 'react';
import { Title } from '../types';
import { api } from '../services/api';
import { AdminTimelineView } from './AdminTimelineView';

interface AdminDashboardProps {
  titles: Title[];
  onTitleCreated: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ titles, onTitleCreated }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'timeline'>('content');

  // New Title Form State
  const [name, setName] = useState('');
  const [durationSeconds, setDurationSeconds] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadFile = async (file: File): Promise<string> => {
    // Get presigned URL
    const { uploadUrl, cdnUrl } = await api.getUploadUrl(file.name, file.type);
    
    // Upload to S3 directly via presigned URL
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }

    return cdnUrl;
  };

  const handleCreateTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !durationSeconds || !description || !videoFile) {
      setStatus({ type: 'error', message: 'Name, Duration, Description, and Video File are required.' });
      return;
    }

    setIsUploading(true);
    setStatus(null);

    try {
      // 1. Upload Video
      const videoAssetUrl = await handleUploadFile(videoFile);

      // 2. Upload Thumbnail if present
      let thumbnailUrl = undefined;
      if (thumbnailFile) {
        thumbnailUrl = await handleUploadFile(thumbnailFile);
      }

      // 3. Create Title
      await api.createTitle({
        name,
        durationSeconds: Number(durationSeconds),
        description,
        genre,
        videoAssetUrl,
        thumbnailUrl
      });

      setStatus({ type: 'success', message: 'Title created successfully!' });
      
      // Reset Form
      setName('');
      setDurationSeconds('');
      setDescription('');
      setGenre('');
      setVideoFile(null);
      setThumbnailFile(null);

      // Notify parent to refresh titles
      onTitleCreated();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to create title' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto pt-10 pb-24 text-on-surface">
      <div className="space-y-1 mb-8">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#f3bd79]" />
          <span className="font-label-sm text-[10px] tracking-[0.2em] uppercase text-secondary font-semibold">
            ADMINISTRATION CONSOLE
          </span>
        </div>
        <h1 className="font-display-lg text-3xl sm:text-5xl text-white font-bold tracking-tight">
          System Management
        </h1>
        <p className="font-body-md text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
          Manage cinema titles, upload media assets, and author interactive narrative timelines.
        </p>
      </div>

      <div className="flex border-b border-white/10 mb-8">
        <button
          onClick={() => setActiveTab('content')}
          className={`px-6 py-3 font-label-md text-xs uppercase tracking-wider font-bold transition-colors ${
            activeTab === 'content'
              ? 'text-white border-b-2 border-secondary'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          Content Management
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-6 py-3 font-label-md text-xs uppercase tracking-wider font-bold transition-colors ${
            activeTab === 'timeline'
              ? 'text-white border-b-2 border-secondary'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          Timeline Engine
        </button>
      </div>

      {activeTab === 'content' && (
        <div className="max-w-2xl">
          <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-low border border-white/5 space-y-6">
            <h2 className="font-title-lg text-xl text-white font-bold">Create New Title</h2>
            <form onSubmit={handleCreateTitle} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Title Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-secondary transition-colors"
                  placeholder="e.g. Cyberpunk 2099"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Duration (seconds)</label>
                  <input
                    type="number"
                    value={durationSeconds}
                    onChange={e => setDurationSeconds(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-secondary transition-colors"
                    placeholder="e.g. 7200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Genre</label>
                  <input
                    type="text"
                    value={genre}
                    onChange={e => setGenre(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-secondary transition-colors"
                    placeholder="e.g. Sci-Fi, Thriller"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-secondary transition-colors"
                  placeholder="Synopsis of the title..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Video File (.mp4)</label>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={e => setVideoFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-secondary/20 file:text-secondary hover:file:bg-secondary/30"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Thumbnail Image (.jpg, .png)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e => setThumbnailFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                />
              </div>

              {status && (
                <div className={`p-3 rounded-xl text-xs font-mono border ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {status.message}
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#EC4899] text-white font-label-md text-xs uppercase tracking-wider font-bold shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_30px_rgba(236,72,153,0.7)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload & Create Title'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="-mx-4 sm:-mx-8 lg:-mx-14 mt-[-2.5rem]">
           <AdminTimelineView titles={titles} />
        </div>
      )}

    </div>
  );
};
