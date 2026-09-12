export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  is_featured: boolean;
  author_name: string;
  author_avatar: string;
  author_bio: string;
  meta_title: string;
  meta_description: string;
  og_image: string;
  published_at: string;
  read_time: number;
  created_at: string;
  updated_at: string;
  related_services: string[];
  related_packages: string[];
}

// API returns camelCase fields (see /api/v1/blogs). Map to the snake_case
// shape used throughout the admin UI.
export function mapBlogFromApi(b: any): BlogPost {
  return {
    id: b.id,
    title: b.title ?? "",
    slug: b.slug ?? "",
    excerpt: b.excerpt ?? "",
    content: b.content ?? "",
    cover_image: b.coverImage ?? "",
    category: b.category ?? "",
    tags: b.tags ?? [],
    status: (b.status ?? "DRAFT").toUpperCase(),
    is_featured: !!b.isFeatured,
    author_name: b.authorName ?? "",
    author_avatar: b.authorAvatar ?? "",
    author_bio: b.authorBio ?? "",
    meta_title: b.metaTitle ?? "",
    meta_description: b.metaDescription ?? "",
    og_image: b.ogImage ?? "",
    published_at: b.publishedAt ?? "",
    read_time: b.readTime ?? 1,
    created_at: b.createdAt ?? "",
    updated_at: b.updatedAt ?? "",
    related_services: b.relatedServiceIds ?? b.relatedServices ?? [],
    related_packages: b.relatedPackageIds ?? b.relatedPackages ?? [],
  };
}

// Build a request payload matching the API's expected camelCase field names.
export function mapBlogToApi(form: {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  tags: string[];
  status: string;
  is_featured: boolean;
  author_name: string;
  author_avatar: string;
  author_bio: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  published_at: string;
  read_time: number;
  related_services: string[];
  related_packages: string[];
}) {
  return {
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    content: form.content,
    coverImage: form.cover_image,
    category: form.category,
    tags: form.tags,
    status: form.status.toUpperCase(),
    isFeatured: form.is_featured,
    authorName: form.author_name,
    authorAvatar: form.author_avatar,
    authorBio: form.author_bio,
    metaTitle: form.meta_title || form.title,
    metaDescription: form.meta_description || form.excerpt,
    ogImage: form.og_image || form.cover_image,
    publishedAt: form.published_at ? new Date(form.published_at).toISOString() : undefined,
    readTime: form.read_time,
    relatedServiceIds: form.related_services,
    relatedPackageIds: form.related_packages,
  };
}
