'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  Image as ImageIcon,
  Upload,
  Loader2,
  Undo,
  Redo,
  X,
  Video as VideoIcon,
  Film,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  /**
   * Optional uploader. If provided, images picked from the device are sent
   * through this function (e.g. adminApi.uploads.image(file, 'blogs')) and
   * only the returned URL is inserted into the content — so you can add as
   * many images as you want without bloating the saved HTML with base64.
   * If not provided, falls back to embedding the image as base64.
   */
  onImageUpload?: (file: File) => Promise<{ url: string }>;
  /**
   * Optional uploader for videos, same pattern as onImageUpload. If not
   * provided, falls back to embedding the video as base64.
   */
  onVideoUpload?: (file: File) => Promise<{ url: string }>;
}

const ToolbarButton = ({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      active ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-200 text-gray-700'
    }`}
  >
    {children}
  </button>
);

// Image extension with a delete (×) button that shows up on hover, so users
// can remove an inserted image directly without needing to select it and
// hit the keyboard Delete key.
const DeletableImage = Image.extend({
  addNodeView() {
    return ({ editor, getPos, node }) => {
      const wrapper = document.createElement('span');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';
      wrapper.className = 'rte-image-wrapper';

      const img = document.createElement('img');
      Object.entries(node.attrs).forEach(([key, val]) => {
        if (val !== null && val !== undefined) img.setAttribute(key, String(val));
      });
      img.className = 'rounded-lg max-w-full h-auto my-2 block';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      removeBtn.title = 'Remove image';
      removeBtn.className = 'rte-image-remove-btn';
      removeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 26px;
        height: 26px;
        border-radius: 9999px;
        background: #ffffff;
        color: #111827;
        border: 1px solid rgba(0,0,0,0.08);
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        z-index: 5;
        transform: scale(1);
        transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
      `;

      removeBtn.addEventListener('mouseenter', () => {
        removeBtn.style.background = '#f97316';
        removeBtn.style.color = '#ffffff';
        removeBtn.style.transform = 'scale(1.15)';
      });
      removeBtn.addEventListener('mouseleave', () => {
        removeBtn.style.background = '#ffffff';
        removeBtn.style.color = '#111827';
        removeBtn.style.transform = 'scale(1)';
      });

      removeBtn.addEventListener('mousedown', (e) => e.preventDefault());
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof getPos === 'function') {
          const pos = getPos();
          editor
            .chain()
            .focus()
            .deleteRange({ from: pos, to: pos + node.nodeSize })
            .run();
        }
      });

      wrapper.appendChild(img);
      wrapper.appendChild(removeBtn);

      return { dom: wrapper };
    };
  },
});

// Detects YouTube / Vimeo links and returns an embeddable iframe URL, or
// null if the URL isn't a recognized platform link (i.e. a direct video
// file like .mp4 should NOT go through this).
const getEmbedUrl = (url: string): string | null => {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') {
        const id = u.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (u.pathname.startsWith('/embed/')) {
        return url;
      }
    }

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === 'vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }

    return null;
  } catch {
    return null;
  }
};

// Custom video node. Handles two cases:
// - Direct video files (mp4/webm/uploaded files): rendered as <video controls>
// - YouTube/Vimeo links: rendered as a responsive <iframe> embed
const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      embedUrl: { default: null },
      controls: { default: true },
    };
  },

  parseHTML() {
    return [
      { tag: 'video' },
      { tag: 'div[data-video-embed]' },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    if (node.attrs.embedUrl) {
      return [
        'div',
        { 'data-video-embed': 'true', style: 'position:relative; padding-top:56.25%;' },
        [
          'iframe',
          {
            src: node.attrs.embedUrl,
            frameborder: '0',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowfullscreen: 'true',
            style: 'position:absolute; top:0; left:0; width:100%; height:100%;',
          },
        ],
      ];
    }
    return ['video', mergeAttributes(HTMLAttributes, { controls: 'true' })];
  },

  addNodeView() {
    return ({ editor, getPos, node }) => {
      const wrapper = document.createElement('span');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'block';
      wrapper.className = 'rte-video-wrapper';

      let mediaEl: HTMLElement;

      if (node.attrs.embedUrl) {
        const ratioBox = document.createElement('div');
        ratioBox.style.position = 'relative';
        ratioBox.style.paddingTop = '56.25%';
        ratioBox.className = 'rounded-lg overflow-hidden my-2 max-w-full';

        const iframe = document.createElement('iframe');
        iframe.src = node.attrs.embedUrl;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute(
          'allow',
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
        );
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; border:0;';

        ratioBox.appendChild(iframe);
        wrapper.appendChild(ratioBox);
        mediaEl = ratioBox;
      } else {
        const video = document.createElement('video');
        video.controls = true;
        video.preload = 'metadata';
        video.setAttribute('playsinline', 'true');
        video.className = 'rounded-lg max-w-full h-auto my-2 block';
        video.style.maxHeight = '360px';
        video.style.width = '100%';
        video.style.background = '#000';
        video.src = node.attrs.src;
        video.load();
        video.addEventListener('error', () => {
          console.error('Video failed to load:', node.attrs.src);
        });
        wrapper.appendChild(video);
        mediaEl = video;
      }

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      removeBtn.title = 'Remove video';
      removeBtn.className = 'rte-video-remove-btn';
      removeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 26px;
        height: 26px;
        border-radius: 9999px;
        background: #ffffff;
        color: #111827;
        border: 1px solid rgba(0,0,0,0.08);
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        z-index: 5;
        transform: scale(1);
        transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
      `;

      removeBtn.addEventListener('mouseenter', () => {
        removeBtn.style.background = '#f97316';
        removeBtn.style.color = '#ffffff';
        removeBtn.style.transform = 'scale(1.15)';
      });
      removeBtn.addEventListener('mouseleave', () => {
        removeBtn.style.background = '#ffffff';
        removeBtn.style.color = '#111827';
        removeBtn.style.transform = 'scale(1)';
      });

      removeBtn.addEventListener('mousedown', (e) => e.preventDefault());
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof getPos === 'function') {
          const pos = getPos();
          editor
            .chain()
            .focus()
            .deleteRange({ from: pos, to: pos + node.nodeSize })
            .run();
        }
      });

      wrapper.appendChild(removeBtn);

      return { dom: wrapper };
    };
  },
});

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = '260px',
  onImageUpload,
  onVideoUpload,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const isInternalUpdate = useRef(false);
  // Remembers where the cursor was right before the native file picker
  // opened. Opening the OS file dialog (and interacting with it) steals
  // focus/selection from the editor, so by the time the upload finishes
  // and we're ready to insert, TipTap's "current" selection can no longer
  // be trusted — it may have collapsed back to the end of the doc. We
  // restore this saved position before inserting so the image/video lands
  // exactly where the user's cursor was, not always at the bottom.
  const savedSelectionRef = useRef<number | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-orange-500 hover:text-orange-600 underline',
        },
      }),
      DeletableImage.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-2',
        },
      }),
      Video,
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: placeholder || 'Write your content here...',
      }),
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none px-4 py-3 text-sm',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    // If this value change came from the editor's own onUpdate (e.g. after
    // inserting an image), don't re-apply it — that round-trip can race
    // with the next edit and wipe it out. Only sync content that came from
    // outside (e.g. loading a different post, resetting the form).
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const current = editor.getHTML();
    if (value !== current && value !== undefined) {
      editor.commands.setContent(value || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImageByUrl = () => {
    if (!editor) return;
    const url = window.prompt('Enter image URL', 'https://');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  // Runs an insert command at the cursor position that was saved right
  // before the file picker opened (falls back to current selection if we
  // don't have a valid saved position).
  const insertAtSavedSelection = (run: () => void) => {
    if (!editor) return;
    const pos = savedSelectionRef.current;
    if (pos !== null && pos >= 0 && pos <= editor.state.doc.content.size) {
      editor.chain().focus().setTextSelection(pos).run();
    } else {
      editor.chain().focus().run();
    }
    run();
    savedSelectionRef.current = null;
  };

  const triggerLocalImage = () => {
    // Capture cursor position BEFORE the native file picker steals focus.
    savedSelectionRef.current = editor ? editor.state.selection.to : null;
    fileInputRef.current?.click();
  };

  const insertOneFile = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!editor) return resolve();

      if (onImageUpload) {
        onImageUpload(file)
          .then((result) => {
            insertAtSavedSelection(() => {
              editor.chain().focus().setImage({ src: result.url }).run();
            });
            resolve();
          })
          .catch(reject);
        return;
      }

      // Fallback: embed as base64 directly in content.
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        insertAtSavedSelection(() => {
          editor.chain().focus().setImage({ src: base64 }).run();
        });
        resolve();
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleLocalImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    const files = fileList ? Array.from(fileList) : [];
    e.target.value = ''; // allow re-selecting the same file(s) later
    if (!files.length || !editor) return;

    const validFiles = files.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      window.alert('Some selected files were skipped because they are not images');
    }
    if (!validFiles.length) return;

    setUploadingImage(true);
    try {
      // Insert sequentially so each image lands after the previous one,
      // in the order the user picked them.
      for (const file of validFiles) {
        // eslint-disable-next-line no-await-in-loop
        await insertOneFile(file);
      }
    } catch (err: any) {
      window.alert(err?.message || 'One or more images failed to upload');
    } finally {
      setUploadingImage(false);
    }
  };

  const addVideoByUrl = () => {
    if (!editor) return;
    const url = window.prompt('Enter video URL (YouTube, Vimeo, or a direct .mp4 link)', 'https://');
    if (!url) return;

    const embedUrl = getEmbedUrl(url);
    if (embedUrl) {
      editor.chain().focus().insertContent({ type: 'video', attrs: { embedUrl } }).run();
    } else {
      editor.chain().focus().insertContent({ type: 'video', attrs: { src: url } }).run();
    }
  };

  const triggerLocalVideo = () => {
    // Capture cursor position BEFORE the native file picker steals focus.
    savedSelectionRef.current = editor ? editor.state.selection.to : null;
    videoInputRef.current?.click();
  };

  const insertOneVideoFile = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!editor) return resolve();

      if (onVideoUpload) {
        onVideoUpload(file)
          .then((result) => {
            insertAtSavedSelection(() => {
              editor
                .chain()
                .focus()
                .insertContent({ type: 'video', attrs: { src: result.url } })
                .run();
            });
            resolve();
          })
          .catch(reject);
        return;
      }

      // Fallback: embed as base64 directly in content.
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        insertAtSavedSelection(() => {
          editor
            .chain()
            .focus()
            .insertContent({ type: 'video', attrs: { src: base64 } })
            .run();
        });
        resolve();
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleLocalVideoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    const files = fileList ? Array.from(fileList) : [];
    e.target.value = ''; // allow re-selecting the same file(s) later
    if (!files.length || !editor) return;

    const validFiles = files.filter((f) => f.type.startsWith('video/'));
    if (validFiles.length !== files.length) {
      window.alert('Some selected files were skipped because they are not videos');
    }
    if (!validFiles.length) return;

    setUploadingVideo(true);
    try {
      for (const file of validFiles) {
        // eslint-disable-next-line no-await-in-loop
        await insertOneVideoFile(file);
      }
    } catch (err: any) {
      window.alert(err?.message || 'One or more videos failed to upload');
    } finally {
      setUploadingVideo(false);
    }
  };

  const setTextColor = (color: string) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
  };

  const clearTextColor = () => {
    if (!editor) return;
    editor.chain().focus().unsetColor().run();
  };

  const clearContent = () => {
    if (!editor || editor.isEmpty) return;
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    if (editor) {
      editor.chain().focus().clearContent(true).run();
    }
    setShowClearConfirm(false);
  };

  if (!editor) {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="p-4 text-sm text-gray-400" style={{ minHeight }}>
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center flex-wrap gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading"
        >
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Subheading"
        >
          <Heading3 size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link">
          <LinkIcon size={15} />
        </ToolbarButton>
        <div className="flex items-center gap-1">
          <input
            type="color"
            onMouseDown={(e) => e.preventDefault()}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border border-gray-200 p-0.5"
            title="Text Color"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearTextColor}
            title="Reset text color"
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors px-1"
          >
            Reset
          </button>
        </div>
        <ToolbarButton onClick={addImageByUrl} title="Insert Image (URL)">
          <ImageIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={triggerLocalImage}
          disabled={uploadingImage}
          title="Upload Image(s) (from device)"
        >
          {uploadingImage ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleLocalImageSelected}
          className="hidden"
        />

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton onClick={addVideoByUrl} title="Insert Video (YouTube, Vimeo, or direct link)">
          <VideoIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={triggerLocalVideo}
          disabled={uploadingVideo}
          title="Upload Video (from device)"
        >
          {uploadingVideo ? <Loader2 size={15} className="animate-spin" /> : <Film size={15} />}
        </ToolbarButton>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleLocalVideoSelected}
          className="hidden"
        />

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={clearContent}
          disabled={editor.isEmpty}
          title="Clear all content"
        >
          <span className="text-xs font-medium text-red-500 px-1">Clear</span>
        </ToolbarButton>
      </div>

      <div style={{ minHeight }} className="overflow-y-auto max-h-[500px]">
        <EditorContent editor={editor} />
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-5">
            <h4 className="text-sm font-semibold text-gray-900">Clear all content?</h4>
            <p className="text-sm text-gray-500 mt-1.5">
              This will remove everything you've written, including images. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClear}
                className="px-3.5 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Yes, clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}