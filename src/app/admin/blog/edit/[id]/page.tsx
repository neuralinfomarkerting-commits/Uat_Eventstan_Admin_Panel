'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FileText, Users, Calendar, Layers, ArrowLeft, Image as ImageIcon, X, Plus, ChevronDown } from 'lucide-react';
import Button from '@/components/admin/Button';
import Input from '@/components/admin/Input';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/adminApi';
import { mapBlogFromApi, mapBlogToApi } from '@/lib/blog';
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
  height = "max-h-48"
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: string[]; 
  placeholder?: string;
  height?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400 text-left flex items-center justify-between"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder || 'Select an option'}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className={`absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-y-auto ${height}`}>
            {options.map((option) => (
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
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function EditBlogPost() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    category: 'Trends',
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
  const [loadingData, setLoadingData] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

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

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const id = params.id as string;
        const data = await adminApi.blogs.get(id);
        const post = mapBlogFromApi(data);

        setForm({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          cover_image: post.cover_image,
          category: post.category,
          tags: post.tags,
          status: post.status.toLowerCase() as 'draft' | 'published' | 'archived',
          is_featured: post.is_featured,
          author_name: post.author_name,
          author_avatar: post.author_avatar,
          author_bio: post.author_bio,
          published_at: post.published_at ? post.published_at.slice(0, 16) : new Date().toISOString().slice(0, 16),
          read_time: post.read_time,
          related_services: post.related_services,
          related_packages: post.related_packages,
        });
        setCoverPreview(post.cover_image);
        setLoadingData(false);
      } catch (error: any) {
        console.error('Error fetching post:', error);
        toast.error(error?.message || 'Failed to load blog post');
        router.push('/admin/blog');
      }
    };

    fetchPost();
  }, [params.id, router]);

  const calculateReadTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleContentChange = (content: string) => {
    const readTime = calculateReadTime(content);
    setForm({ ...form, content, read_time: readTime });
  };

  const handleTitleChange = (title: string) => {
    const slug = generateSlug(title);
    setForm({ ...form, title, slug });
  };

  const [uploadingCover, setUploadingCover] = useState(false);

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setCoverPreview(localPreview);

    setUploadingCover(true);
    try {
      const result = await adminApi.uploads.image(file, 'blogs');
      setForm((prev) => ({ ...prev, cover_image: result.url }));
      setCoverPreview(result.url);
    } catch (error: any) {
      toast.error(error?.message || 'Cover image upload failed');
    } finally {
      setUploadingCover(false);
    }
  };

  const filteredTags = tagOptions.filter(tag => 
    tag.toLowerCase().includes(tagInput.toLowerCase()) && !form.tags.includes(tag)
  );

  const addTag = (tag: string) => {
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag] });
    }
    setTagInput('');
    setShowTagDropdown(false);
  };

  const removeTag = (tagToRemove: string) => {
    setForm({ ...form, tags: form.tags.filter(tag => tag !== tagToRemove) });
  };

  const addRelatedService = (serviceId: string) => {
    if (serviceId && !form.related_services.includes(serviceId)) {
      setForm({ ...form, related_services: [...form.related_services, serviceId] });
    }
    setRelatedServiceInput('');
  };

  const removeRelatedService = (serviceId: string) => {
    setForm({ ...form, related_services: form.related_services.filter(id => id !== serviceId) });
  };

  const addRelatedPackage = (packageId: string) => {
    if (packageId && !form.related_packages.includes(packageId)) {
      setForm({ ...form, related_packages: [...form.related_packages, packageId] });
    }
    setRelatedPackageInput('');
  };

  const removeRelatedPackage = (packageId: string) => {
    setForm({ ...form, related_packages: form.related_packages.filter(id => id !== packageId) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!form.title || !form.content) {
      toast.error('Please fill title and content');
      setLoading(false);
      return;
    }

    try {
      const id = params.id as string;
      const payload = mapBlogToApi(form);
      await adminApi.blogs.update(id, payload);
      toast.success('Blog post updated successfully!');
      router.push('/admin/blog');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update blog post');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Post</h1>
            <p className="text-sm text-gray-500 mt-0.5">Update your blog post</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={18} /> Core Article Fields
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input 
                label="Title" 
                value={form.title} 
                onChange={e => handleTitleChange(e.target.value)} 
                placeholder="Enter post title"
                required 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image</label>
              <div className="flex items-center gap-4">
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition-colors bg-gray-50 overflow-hidden">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <ImageIcon size={24} className="text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">Upload</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleCoverImageUpload} className="hidden" />
                </label>
                {coverPreview && (
                  <button
                    type="button"
                    onClick={() => { setCoverPreview(''); setForm({ ...form, cover_image: '' }); }}
                    className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">Upload a cover image (JPG, PNG, WEBP)</p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Excerpt (Short Summary)</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => {
                  if (e.target.value.length <= 160) setForm({ ...form, excerpt: e.target.value });
                }}
                placeholder="Write a brief summary of your post..."
                rows={3}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${form.excerpt.length >= 160 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {form.excerpt.length}/160 characters
                </span>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
              <RichTextEditor
                value={form.content}
                onChange={handleContentChange}
                placeholder="Write your blog content here..."
                onImageUpload={(file) => adminApi.uploads.image(file, 'blogs/content')}
                onVideoUpload={(file) => adminApi.uploads.video(file, 'blogs/content')}
              />
              <p className="text-xs text-gray-400 mt-1">Read time: {form.read_time} minutes (auto-calculated)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <ScrollableSelect
                value={form.category}
                onChange={(value) => setForm({ ...form, category: value })}
                options={categories.map(c => c.name)}
                placeholder={optionsLoading ? 'Loading categories...' : 'Select a category'}
                height="max-h-60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
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
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="Type to search or add tag..."
                    />
                    {showTagDropdown && filteredTags.length > 0 && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowTagDropdown(false)} />
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
                      </>
                    )}
                  </div>
                  <Button type="button" variant="secondary" onClick={() => tagInput && addTag(tagInput)} className="!px-4">
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {form.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-orange-900">×</button>
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <SearchableSelect
                options={[{ id: 'draft', label: 'Draft' }, { id: 'published', label: 'Published' }, { id: 'archived', label: 'Archived' }]}
                value={form.status}
                onChange={id => setForm({ ...form, status: id as any })}
                searchPlaceholder="Search..."
              />
            </div>
            
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_featured"
                checked={form.is_featured}
                onChange={e => setForm({ ...form, is_featured: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 focus:ring-offset-0 focus:ring-2"
                style={{ accentColor: '#f97316' }}
              />
              <label htmlFor="is_featured" className="text-sm font-medium text-gray-700 cursor-pointer">Feature this post</label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={18} /> Publishing Settings
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Published Date" 
              type="datetime-local" 
              value={form.published_at} 
              onChange={e => setForm({ ...form, published_at: e.target.value })} 
            />
            <Input 
              label="Read Time (minutes)" 
              type="number" 
              value={form.read_time} 
              onChange={e => setForm({ ...form, read_time: Number(e.target.value) })} 
            />
          </div>
        </div>

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
                <Button type="button" variant="secondary" onClick={() => addRelatedService(relatedServiceInput)} className="!px-4">
                  <Plus size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 max-h-32 overflow-y-auto">
                {services.filter(s => form.related_services.includes(s.id)).map(service => (
                  <span key={service.id} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs flex items-center gap-1 border border-blue-200">
                    {service.name}
                    <button type="button" onClick={() => removeRelatedService(service.id)} className="hover:text-blue-900">×</button>
                  </span>
                ))}
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
                <Button type="button" variant="secondary" onClick={() => addRelatedPackage(relatedPackageInput)} className="!px-4">
                  <Plus size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 max-h-32 overflow-y-auto">
                {packages.filter(p => form.related_packages.includes(p.id)).map(pkg => (
                  <span key={pkg.id} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs flex items-center gap-1 border border-green-200">
                    {pkg.name}
                    <button type="button" onClick={() => removeRelatedPackage(pkg.id)} className="hover:text-green-900">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 sticky bottom-4 bg-white/80 backdrop-blur-sm p-4 rounded-xl border">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
            {loading ? 'Updating...' : 'Update Blog'}
          </Button>
        </div>
      </form>
    </div>
  );
}