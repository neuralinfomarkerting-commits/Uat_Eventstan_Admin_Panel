'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Users, Calendar, Layers, ArrowLeft, Image as ImageIcon, X, Plus, ChevronDown, Loader2 } from 'lucide-react';
import Button from '@/components/admin/Button';
import Input from '@/components/admin/Input';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/adminApi';
import { mapBlogToApi } from '@/lib/blog';
import RichTextEditor from '@/components/admin/RichTextEditor';
import SearchableSelect from '@/components/admin/SearchableSelect';

interface Service {
  id: string;
  name: string;
}

interface Package {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

const tagOptions = [
  'Wedding', 'Engagement', 'Haldi', 'Mehendi', 'Sangeet', 
  'Reception', 'Destination Wedding', 'Intimate Wedding', 
  'Luxury Wedding', 'Budget Wedding', 'Traditional', 'Modern',
  'Bridal', 'Groom', 'Bridal Party', 'DIY', 'Trending'
];

const ScrollableSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder,
  height = "max-h-48",
  disabled = false
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: string[]; 
  placeholder?: string;
  height?: string;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400 text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder || 'Select an option'}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && !disabled && (
        <div className={`absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-y-auto ${height}`}>
          {options.length === 0 ? (
            <div className="px-3.5 py-3 text-sm text-gray-500 text-center">No options available</div>
          ) : (
            options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-left text-sm hover:bg-orange-50 transition-colors ${
                  value === option ? 'bg-orange-100 text-orange-700' : 'text-gray-700'
                }`}
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default function AddBlogPost() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Load options
  useEffect(() => {
    (async () => {
      try {
        const [categoriesData, servicesData, packagesData] = await Promise.all([
          adminApi.categories.list(),
          adminApi.services.list(),
          adminApi.packages.list(),
        ]);
        setCategories((categoriesData ?? []).map((c: any) => ({ id: c.id, name: c.name })));
        setServices((servicesData ?? []).map((s: any) => ({ id: String(s.id), name: s.title ?? s.name })));
        setPackages((packagesData ?? []).map((p: any) => ({ id: p.id, name: p.title ?? p.name })));
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load categories, services or packages');
      } finally {
        setOptionsLoading(false);
      }
    })();
  }, []);
  
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    category: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published' | 'archived',
    is_featured: false,
    author_name: '',
    author_avatar: '',
    author_bio: '',
    published_at: new Date().toISOString().slice(0, 16),
    read_time: 5,
    related_services: [] as string[],
    related_packages: [] as string[]
  });

  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [relatedServiceInput, setRelatedServiceInput] = useState('');
  const [relatedPackageInput, setRelatedPackageInput] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const calculateReadTime = useCallback((content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }, []);

  const generateSlug = useCallback((title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }, []);

  const handleContentChange = useCallback((content: string) => {
    const readTime = calculateReadTime(content);
    setForm(prev => ({ ...prev, content, read_time: readTime }));
  }, [calculateReadTime]);

  const handleTitleChange = useCallback((title: string) => {
    const slug = generateSlug(title);
    setForm(prev => ({ ...prev, title, slug }));
  }, [generateSlug]);

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a valid image (JPG, PNG, or WEBP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Show local preview
    const localPreview = URL.createObjectURL(file);
    setCoverPreview(localPreview);

    setUploadingCover(true);
    try {
      const result = await adminApi.uploads.image(file, 'blogs');
      setForm(prev => ({ ...prev, cover_image: result.url }));
      setCoverPreview(result.url);
      toast.success('Cover image uploaded successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Cover image upload failed');
      // Revert preview if upload fails
      if (localPreview.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview);
      }
      setCoverPreview('');
    } finally {
      setUploadingCover(false);
      // Clear the input
      e.target.value = '';
    }
  };

  const filteredTags = tagOptions.filter(tag => 
    tag.toLowerCase().includes(tagInput.toLowerCase()) && !form.tags.includes(tag)
  );

  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !form.tags.includes(trimmedTag) && trimmedTag.length <= 30) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, trimmedTag] }));
    }
    setTagInput('');
    setShowTagDropdown(false);
  }, [form.tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  }, []);

  const addRelatedService = useCallback((serviceId: string) => {
    if (serviceId && !form.related_services.includes(serviceId)) {
      setForm(prev => ({ ...prev, related_services: [...prev.related_services, serviceId] }));
    }
    setRelatedServiceInput('');
  }, [form.related_services]);

  const removeRelatedService = useCallback((serviceId: string) => {
    setForm(prev => ({ ...prev, related_services: prev.related_services.filter(id => id !== serviceId) }));
  }, []);

  const addRelatedPackage = useCallback((packageId: string) => {
    if (packageId && !form.related_packages.includes(packageId)) {
      setForm(prev => ({ ...prev, related_packages: [...prev.related_packages, packageId] }));
    }
    setRelatedPackageInput('');
  }, [form.related_packages]);

  const removeRelatedPackage = useCallback((packageId: string) => {
    setForm(prev => ({ ...prev, related_packages: prev.related_packages.filter(id => id !== packageId) }));
  }, []);

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.content.trim()) errors.content = 'Content is required';
    if (!form.cover_image) errors.cover_image = 'Cover image is required';
    if (form.excerpt.length > 160) errors.excerpt = 'Excerpt must be 160 characters or less';
    if (!form.category) errors.category = 'Category is required';
    if (form.tags.length === 0) errors.tags = 'At least one tag is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix all validation errors');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const payload = mapBlogToApi(form);
      await adminApi.blogs.create(payload);
      toast.success('Blog post created successfully! 🎉');
      router.push('/admin/blog');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create blog post');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!form.title && !form.content) return;
    
    const autoSaveInterval = setInterval(async () => {
      try {
        // Only auto-save if we have minimal content
        if (form.title || form.content) {
          // You can implement auto-save to localStorage or API here
          localStorage.setItem('blog_draft', JSON.stringify(form));
        }
      } catch (error) {
        // Silent fail for auto-save
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [form]);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('blog_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        // Only load if it's recent (within last 24 hours)
        const savedTime = parsed._savedAt || 0;
        if (Date.now() - savedTime < 24 * 60 * 60 * 1000) {
          setForm(prev => ({ ...prev, ...parsed }));
          if (parsed.cover_image) setCoverPreview(parsed.cover_image);
          toast.success('Draft loaded from local storage');
        }
      }
    } catch (error) {
      // Silent fail
    }
  }, []);

  // Save draft timestamp
  useEffect(() => {
    const saveDraft = () => {
      try {
        const draftWithTimestamp = { ...form, _savedAt: Date.now() };
        localStorage.setItem('blog_draft', JSON.stringify(draftWithTimestamp));
      } catch (error) {
        // Silent fail
      }
    };

    const handleBeforeUnload = saveDraft;
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create New Post</h1>
            <p className="text-sm text-gray-500 mt-0.5">Write and publish a new blog post</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="px-2 py-1 bg-gray-100 rounded-full">Auto-save enabled</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Article Fields */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={18} /> Core Article Fields
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Enter post title"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                    validationErrors.title ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                {validationErrors.title && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.title}</p>
                )}
              </div>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image *</label>
              <div className="flex items-center gap-4">
                <label className={`flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors bg-gray-50 overflow-hidden ${
                  validationErrors.cover_image ? 'border-red-400' : 'border-gray-300 hover:border-orange-400'
                }`}>
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center">
                      {uploadingCover ? (
                        <Loader2 size={24} className="text-orange-500 animate-spin" />
                      ) : (
                        <>
                          <ImageIcon size={24} className="text-gray-400" />
                          <span className="text-xs text-gray-500 mt-1">Upload</span>
                        </>
                      )}
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleCoverImageUpload} 
                    className="hidden" 
                    disabled={uploadingCover}
                  />
                </label>
                {coverPreview && (
                  <button
                    type="button"
                    onClick={() => { 
                      setCoverPreview(''); 
                      setForm(prev => ({ ...prev, cover_image: '' })); 
                    }}
                    className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
                {uploadingCover && (
                  <span className="text-sm text-gray-500">Uploading...</span>
                )}
              </div>
              {validationErrors.cover_image && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.cover_image}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">Upload a cover image (JPG, PNG, WEBP, max 5MB)</p>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Excerpt (Short Summary)</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => {
                  if (e.target.value.length <= 160) {
                    setForm(prev => ({ ...prev, excerpt: e.target.value }));
                    if (validationErrors.excerpt) {
                      setValidationErrors(prev => ({ ...prev, excerpt: '' }));
                    }
                  }
                }}
                placeholder="Write a brief summary of your post..."
                rows={3}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y ${
                  validationErrors.excerpt ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${validationErrors.excerpt ? 'text-red-500' : 'text-gray-400'}`}>
                  {validationErrors.excerpt || `${form.excerpt.length}/160 characters`}
                </span>
                <span className="text-xs text-gray-400">Recommended: 150-160 characters</span>
              </div>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Content *</label>
              <RichTextEditor
                value={form.content}
                onChange={handleContentChange}
                placeholder="Write your blog content here..."
                onImageUpload={(file) => adminApi.uploads.image(file, 'blogs/content')}
                onVideoUpload={(file) => adminApi.uploads.video(file, 'blogs/content')}
              />
              {validationErrors.content && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.content}</p>
              )}
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-400">Read time: {form.read_time} minutes (auto-calculated)</p>
                <p className="text-xs text-gray-400">Words: {form.content.trim().split(/\s+/).length || 0}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
              <ScrollableSelect
                value={form.category}
                onChange={(value) => {
                  setForm(prev => ({ ...prev, category: value }));
                  if (validationErrors.category) {
                    setValidationErrors(prev => ({ ...prev, category: '' }));
                  }
                }}
                options={categories.map(c => c.name)}
                placeholder={optionsLoading ? 'Loading categories...' : 'Select a category'}
                height="max-h-60"
                disabled={optionsLoading}
              />
              {validationErrors.category && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.category}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags *</label>
              <div className="relative">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value);
                        setShowTagDropdown(true);
                      }}
                      onFocus={() => setShowTagDropdown(true)}
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter') { 
                          e.preventDefault(); 
                          if (filteredTags.length > 0) {
                            addTag(filteredTags[0]);
                          } else if (tagInput && !form.tags.includes(tagInput)) {
                            addTag(tagInput);
                          }
                        } 
                      }}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                        validationErrors.tags ? 'border-red-400' : 'border-gray-200'
                      }`}
                      placeholder="Type to search or add tag..."
                      maxLength={30}
                    />
                    {showTagDropdown && filteredTags.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="w-full px-3.5 py-2 text-left text-sm hover:bg-orange-50 transition-colors text-gray-700"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => tagInput && addTag(tagInput)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 hover:bg-gray-100 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              {validationErrors.tags && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.tags}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {form.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-orange-900">×</button>
                  </span>
                ))}
                {form.tags.length === 0 && (
                  <span className="text-xs text-gray-400">No tags added yet</span>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <SearchableSelect
                options={[{ id: 'draft', label: 'Draft' }, { id: 'published', label: 'Published' }, { id: 'archived', label: 'Archived' }]}
                value={form.status}
                onChange={id => setForm(prev => ({ ...prev, status: id as any }))}
                searchPlaceholder="Search..."
              />
            </div>
            
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_featured"
                checked={form.is_featured}
                onChange={e => setForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 focus:ring-offset-0 focus:ring-2"
                style={{ accentColor: '#f97316' }}
              />
              <label htmlFor="is_featured" className="text-sm font-medium text-gray-700 cursor-pointer">Feature this post</label>
            </div>
          </div>
        </div>

        {/* Author Information */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={18} /> Author Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Author Name</label>
              <input
                type="text"
                value={form.author_name}
                onChange={e => setForm(prev => ({ ...prev, author_name: e.target.value }))}
                placeholder="Enter author name"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Author Avatar URL</label>
              <input
                type="text"
                value={form.author_avatar}
                onChange={e => setForm(prev => ({ ...prev, author_avatar: e.target.value }))}
                placeholder="Enter avatar image URL"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Author Bio</label>
              <textarea
                value={form.author_bio}
                onChange={e => setForm(prev => ({ ...prev, author_bio: e.target.value }))}
                placeholder="Brief author bio..."
                rows={2}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y"
              />
            </div>
          </div>
        </div>

        {/* Publishing Settings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={18} /> Publishing Settings
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Published Date</label>
              <input
                type="datetime-local"
                value={form.published_at}
                onChange={e => setForm(prev => ({ ...prev, published_at: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Read Time (minutes)</label>
              <input
                type="number"
                value={form.read_time}
                onChange={e => setForm(prev => ({ ...prev, read_time: Number(e.target.value) }))}
                min={1}
                max={60}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
        </div>

        {/* Related Services & Packages */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Layers size={18} /> Related Services & Packages
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Related Services</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <SearchableSelect
                    options={services.filter(s => !form.related_services.includes(s.id)).map(service => ({ id: service.id, label: service.name }))}
                    value={relatedServiceInput}
                    onChange={id => setRelatedServiceInput(String(id))}
                    placeholder="Select a service"
                    searchPlaceholder="Search services..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addRelatedService(relatedServiceInput)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 hover:bg-gray-100 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 max-h-32 overflow-y-auto">
                {services.filter(s => form.related_services.includes(s.id)).map(service => (
                  <span key={service.id} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs flex items-center gap-1 border border-blue-200">
                    {service.name}
                    <button type="button" onClick={() => removeRelatedService(service.id)} className="hover:text-blue-900">×</button>
                  </span>
                ))}
                {form.related_services.length === 0 && (
                  <span className="text-xs text-gray-400">No related services added</span>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Related Packages</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <SearchableSelect
                    options={packages.filter(p => !form.related_packages.includes(p.id)).map(pkg => ({ id: pkg.id, label: pkg.name }))}
                    value={relatedPackageInput}
                    onChange={id => setRelatedPackageInput(String(id))}
                    placeholder="Select a package"
                    searchPlaceholder="Search packages..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addRelatedPackage(relatedPackageInput)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 hover:bg-gray-100 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 max-h-32 overflow-y-auto">
                {packages.filter(p => form.related_packages.includes(p.id)).map(pkg => (
                  <span key={pkg.id} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs flex items-center gap-1 border border-green-200">
                    {pkg.name}
                    <button type="button" onClick={() => removeRelatedPackage(pkg.id)} className="hover:text-green-900">×</button>
                  </span>
                ))}
                {form.related_packages.length === 0 && (
                  <span className="text-xs text-gray-400">No related packages added</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-between items-center gap-3 pt-4 sticky bottom-4 bg-white/80 backdrop-blur-sm p-4 rounded-xl border shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {form.title || form.content ? 'Draft auto-saved' : 'No changes yet'}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isSubmitting || uploadingCover}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] flex items-center justify-center"
            >
              {loading || isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Publish Post'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}