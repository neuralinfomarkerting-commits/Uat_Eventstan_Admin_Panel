"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Tag,
  ArrowLeft,
  Edit,
  Trash2,
  Star,
  Layers,
  Hash,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import toast from "react-hot-toast";
import { adminApi } from "@/api/adminApi";
import { BlogPost, mapBlogFromApi } from "@/lib/blog";

interface Service {
  id: string;
  name: string;
  description?: string;
}

interface Package {
  id: string;
  name: string;
  price?: string;
}

// Strips inline width/height/style attributes from a matched tag string
const stripInlineSizing = (tag: string) =>
  tag
    .replace(/\swidth\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\sheight\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\sstyle\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\sclass\s*=\s*["'][^"']*["']/gi, "");

const MarkdownContent = ({ content }: { content: string }) => {
  const renderContent = () => {
    // If the content already contains HTML tags, render it directly
    const looksLikeHtml = /<\/?(h[1-6]|p|ul|ol|li|strong|em|a|img|video|iframe|blockquote|div|span|br)[\s>]/i.test(content);
    if (looksLikeHtml) {
      let styledHtml = content;
      styledHtml = styledHtml.replace(/<h1(?![^>]*class=)/gi, '<h1 class="text-3xl font-bold mt-10 mb-4 text-gray-900 tracking-tight"');
      styledHtml = styledHtml.replace(/<h2(?![^>]*class=)/gi, '<h2 class="text-2xl font-bold mt-10 mb-4 text-gray-800 border-b border-gray-200 pb-3"');
      styledHtml = styledHtml.replace(/<h3(?![^>]*class=)/gi, '<h3 class="text-lg font-semibold mt-8 mb-3 text-gray-800"');
      styledHtml = styledHtml.replace(/<h4(?![^>]*class=)/gi, '<h4 class="text-base font-semibold mt-6 mb-2 text-gray-800"');
      styledHtml = styledHtml.replace(/<p(?![^>]*class=)/gi, '<p class="mb-5 text-gray-700 leading-[1.8] text-[15px]"');
      styledHtml = styledHtml.replace(/<ul(?![^>]*class=)/gi, '<ul class="my-4 space-y-2 list-disc pl-5 text-gray-700"');
      styledHtml = styledHtml.replace(/<ol(?![^>]*class=)/gi, '<ol class="my-4 space-y-2 list-decimal pl-5 text-gray-700"');
      styledHtml = styledHtml.replace(/<li(?![^>]*class=)/gi, '<li class="mb-1 leading-relaxed"');
      styledHtml = styledHtml.replace(/<a(?![^>]*class=)/gi, '<a class="text-orange-500 hover:text-orange-600 underline underline-offset-2 font-medium"');
      styledHtml = styledHtml.replace(/<blockquote(?![^>]*class=)/gi, '<blockquote class="border-l-4 border-orange-400 bg-orange-50/60 px-5 py-4 my-6 italic text-gray-700 rounded-r-lg"');
      // FIX: removed text-gray-900 so <strong> inherits color from parent (e.g. TipTap color spans)
      styledHtml = styledHtml.replace(/<strong(?![^>]*class=)/gi, '<strong class="font-semibold"');
      styledHtml = styledHtml.replace(/<em(?![^>]*class=)/gi, '<em class="italic"');

      // Images
      styledHtml = styledHtml.replace(/<img\b[^>]*>/gi, (match) => {
        const cleaned = stripInlineSizing(match);
        const withClass = cleaned.replace(
          /^<img/i,
          '<img class="w-full h-64 md:h-[420px] object-cover rounded-xl" loading="lazy"'
        );
        return `<figure class="my-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">${withClass}</figure>`;
      });

      // Videos
      styledHtml = styledHtml.replace(/<video\b[^>]*>/gi, (match) => {
        const cleaned = stripInlineSizing(match);
        const withClass = cleaned.replace(
          /^<video/i,
          '<video class="w-full h-64 md:h-[420px] object-cover bg-black rounded-xl" controls preload="metadata"'
        );
        return `<figure class="my-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">${withClass}</figure>`;
      });

      // Iframes
      styledHtml = styledHtml.replace(/<iframe\b[^>]*>/gi, (match) => {
        const cleaned = stripInlineSizing(match);
        const withClass = cleaned.replace(
          /^<iframe/i,
          '<iframe class="w-full h-64 md:h-[420px] border-0 rounded-xl"'
        );
        return `<figure class="my-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">${withClass}</figure>`;
      });

      return <div dangerouslySetInnerHTML={{ __html: styledHtml }} />;
    }

    let html = content;
    
    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="language-${lang}">${code}</code></pre>`;
    });
    
    // Headers
    html = html.replace(/### (.*?)(?:\n|$)/g, '<h3 class="text-lg font-semibold mt-8 mb-3 text-gray-800">$1</h3>');
    html = html.replace(/## (.*?)(?:\n|$)/g, '<h2 class="text-2xl font-bold mt-10 mb-4 text-gray-800 border-b border-gray-200 pb-3">$1</h2>');
    html = html.replace(/# (.*?)(?:\n|$)/g, '<h1 class="text-3xl font-bold mt-10 mb-4 text-gray-900 tracking-tight">$1</h1>');
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-orange-500 hover:text-orange-600 underline underline-offset-2 font-medium">$1</a>');
    
    // Numbered lists
    const numberedListRegex = /(\d+\.\s[^\n]+(?:\n[^\d][^\n]*)*)/g;
    html = html.replace(numberedListRegex, (match) => {
      const lines = match.split('\n');
      let items = [];
      let currentItem = { title: '', desc: '' };
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.match(/^\d+\.\s/)) {
          if (currentItem.title) {
            items.push({ ...currentItem });
          }
          currentItem = {
            title: line.replace(/^\d+\.\s/, ''),
            desc: ''
          };
        } else if (line.trim() && currentItem.title) {
          currentItem.desc += (currentItem.desc ? ' ' : '') + line.trim();
        }
      }
      if (currentItem.title) {
        items.push(currentItem);
      }
      
      const listItems = items.map(item => {
        return `<div class="mb-5">
          <div class="font-bold text-gray-800 text-base">${item.title}</div>
          <div class="text-gray-600 text-sm mt-1 leading-relaxed">${item.desc}</div>
        </div>`;
      }).join('');
      
      return `<div class="my-4 space-y-0">${listItems}</div>`;
    });
    
    // Unordered lists
    html = html.replace(/\n- (.*?)(?:\n|$)/g, '<li class="ml-4 mb-1">• $1</li>');
    html = html.replace(/<li/g, '\n<ul class="my-4 space-y-2"><li');
    html = html.replace(/(<\/li>\n)+/g, '</li></ul>\n');
    
    // Blockquotes
    html = html.replace(/\n&gt; (.*?)(?:\n|$)/g, '<blockquote class="border-l-4 border-orange-400 bg-orange-50/60 px-5 py-4 my-6 italic text-gray-700 rounded-r-lg">$1</blockquote>');
    
    // Images
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<figure class="my-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300"><img src="$2" alt="$1" class="w-full h-64 md:h-[420px] object-cover rounded-xl" loading="lazy" /></figure>');

    // Guard raw video/iframe tags
    html = html.replace(/<video\b[^>]*>/gi, (match) => {
      const cleaned = stripInlineSizing(match);
      const withClass = cleaned.replace(
        /^<video/i,
        '<video class="w-full h-64 md:h-[420px] object-cover bg-black rounded-xl" controls preload="metadata"'
      );
      return `<figure class="my-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">${withClass}</figure>`;
    });
    html = html.replace(/<iframe\b[^>]*>/gi, (match) => {
      const cleaned = stripInlineSizing(match);
      const withClass = cleaned.replace(
        /^<iframe/i,
        '<iframe class="w-full h-64 md:h-[420px] border-0 rounded-xl"'
      );
      return `<figure class="my-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">${withClass}</figure>`;
    });
    
    // Wrap first paragraph if needed
    const firstParagraph = html.match(/^[^<]+/);
    if (firstParagraph && firstParagraph[0].trim() && !html.includes('<div') && !html.includes('<ul')) {
      html = `<p class="mb-5 text-gray-700 leading-[1.8] text-[15px]">${firstParagraph[0].trim()}</p>${html.substring(firstParagraph[0].length)}`;
    }
    
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return <div className="prose max-w-none">{renderContent()}</div>;
};

export default function ViewBlogPost() {
  const router = useRouter();
  const params = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [servicesData, packagesData] = await Promise.all([
          adminApi.services.list(),
          adminApi.packages.list(),
        ]);
        setServices(
          (servicesData ?? []).map((s: any) => ({
            id: String(s.id),
            name: s.title ?? s.name,
            description: s.description,
          })),
        );
        setPackages(
          (packagesData ?? []).map((p: any) => ({
            id: p.id,
            name: p.title ?? p.name,
            price: p.price?.amount ? `${p.price.amount} ${p.price.currency ?? ''}`.trim() : undefined,
          })),
        );
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load services or packages');
      }
    })();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const id = params.id as string;
        const data = await adminApi.blogs.get(id);
        setPost(mapBlogFromApi(data));
      } catch (error: any) {
        toast.error(error?.message || "Post not found");
        router.push("/admin/blog");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id, router]);

  const handleEdit = () => {
    router.push(`/admin/blog/edit/${post?.id}`);
  };

  const handleDelete = async () => {
    if (!post) return;
    try {
      await adminApi.blogs.delete(post.id);
      toast.success("Post deleted successfully!");
      setIsDeleteModalOpen(false);
      router.push("/admin/blog");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete post");
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/blog/${post?.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const url = `${window.location.origin}/blog/${post?.slug}`;
    const text = post?.title || "";
    
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
    };
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
    setShowShareMenu(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PUBLISHED":
        return "bg-green-100 text-green-700 border-green-200";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-500 mt-4">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Post not found</p>
          <button
            onClick={() => router.push("/admin/blog")}
            className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  const relatedServicesList = services.filter(s => post.related_services?.includes(s.id));
  const relatedPackagesList = packages.filter(p => post.related_packages?.includes(p.id));

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">View Post</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Viewing blog post details
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Share Button */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <Share2 size={15} />
              Share
            </button>
            {showShareMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />
                <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden min-w-[200px]">
                  <div className="flex items-center gap-1 p-2">
                    <button
                      onClick={() => handleShare("twitter")}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                      title="Twitter"
                    >
                      <svg className="w-5 h-5" fill="#1DA1F2" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleShare("facebook")}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                      title="Facebook"
                    >
                      <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleShare("linkedin")}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                      title="LinkedIn"
                    >
                      <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.227 0 22.225 0z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleShare("whatsapp")}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                      title="WhatsApp"
                    >
                      <svg className="w-5 h-5" fill="#25D366" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.576 2.052.882 3.149.882 3.18 0 5.767-2.587 5.768-5.766.001-3.18-2.586-5.767-5.768-5.767zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.068-.252-.08-.586-.232-1.002-.454-.543-.29-1.134-.756-1.624-1.288-.688-.745-1.246-1.556-1.408-1.956-.155-.381-.148-.699.042-.982.144-.214.368-.353.573-.446.133-.06.285-.08.422-.08.13 0 .195.008.28.128.141.201.422.605.542.78.12.175.182.29.26.47.08.18.043.316-.042.46-.06.1-.123.18-.195.27-.06.075-.13.162-.064.304.11.24.363.552.692.876.459.451.915.725 1.142.856.125.072.282.049.38-.04.12-.11.25-.3.38-.48.122-.176.24-.239.396-.167.189.095.648.306.742.358.186.101.315.16.364.252.049.092.049.264-.019.46z"/>
                      </svg>
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                    <button
                      onClick={handleCopyLink}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy Link"
                    >
                      {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} className="text-gray-600" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={handleEdit}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <Edit size={15} />
            Edit
          </button>
          
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2 border border-red-300 rounded-xl text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors flex items-center gap-1"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-10">
          {/* Meta Info */}
          <div className="flex items-center flex-wrap gap-3 text-sm mb-5">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(post.status)}`}>
              {post.status}
            </span>
            <span className="px-3 py-1.5 bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 rounded-full text-xs font-semibold">
              {post.category}
            </span>
            {post.is_featured && (
              <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1">
                <Star size={12} />
                Featured
              </span>
            )}
            <div className="flex items-center gap-1.5 text-gray-500">
              <User size={14} />
              <span className="text-sm">{post.author_name || 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock size={14} />
              <span className="text-sm">{post.read_time} min read</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-[2.5rem] font-bold text-gray-900 mb-5 leading-[1.15] tracking-tight">
            {post.title}
          </h1>
          
          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-gray-600 text-base md:text-lg mb-8 leading-relaxed border-l-2 border-orange-200 pl-4">
              {post.excerpt}
            </p>
          )}
          
          {/* Cover Image */}
          {post.cover_image && (
            <div className="relative w-full h-64 md:h-[420px] mb-10 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="mb-10 text-sm md:text-base" id="post-content">
            <MarkdownContent content={post.content} />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="pt-5 flex flex-wrap items-center gap-2 border-t border-gray-100">
              <Tag size={14} className="text-gray-400" />
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Related Services & Packages */}
          {(relatedServicesList.length > 0 || relatedPackagesList.length > 0) && (
            <div className="pt-8 mt-8 border-t border-gray-200">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Layers size={16} /> Related
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedServicesList.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-blue-800 mb-3 uppercase tracking-wide">Services</h4>
                    <div className="space-y-2">
                      {relatedServicesList.map(service => (
                        <div key={service.id} className="flex items-center justify-between">
                          <span className="text-blue-700 text-sm font-medium">{service.name}</span>
                          {service.description && (
                            <span className="text-xs text-blue-500 ml-2 text-right">{service.description}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {relatedPackagesList.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-green-800 mb-3 uppercase tracking-wide">Packages</h4>
                    <div className="space-y-2">
                      {relatedPackagesList.map(pkg => (
                        <div key={pkg.id} className="flex items-center justify-between">
                          <span className="text-green-700 text-sm font-medium">{pkg.name}</span>
                          {pkg.price && (
                            <span className="text-xs text-green-600 font-semibold">{pkg.price}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-400 flex flex-wrap justify-between gap-2">
            <p>📅 Created: {new Date(post.created_at).toLocaleString()}</p>
            <p>✏️ Last updated: {new Date(post.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message={`Are you sure you want to delete "${post.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}