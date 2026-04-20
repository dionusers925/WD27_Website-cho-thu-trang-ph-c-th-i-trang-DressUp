import { useEffect, useRef, useState } from "react";
import { uploadImage } from "../../../../services/upload.service";

type Props = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

declare global {
  interface Window {
    ClassicEditor?: any;
    DecoupledEditor?: any;
    BalloonEditor?: any;
  }
}

const CKEDITOR_URL =
  import.meta.env.VITE_CKEDITOR_URL ??
  "https://cdn.ckeditor.com/ckeditor5/41.4.2/classic/ckeditor.js";

const FULL_TOOLBAR = [
  "heading",
  "|",
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "link",
  "|",
  "bulletedList",
  "numberedList",
  "todoList",
  "|",
  "alignment",
  "|",
  "imageUpload",
  "insertTable",
  "mediaEmbed",
  "|",
  "blockQuote",
  "codeBlock",
  "removeFormat",
  "|",
  "undo",
  "redo",
];

const SAFE_TOOLBAR = [
  "heading",
  "|",
  "bold",
  "italic",
  "link",
  "|",
  "bulletedList",
  "numberedList",
  "|",
  "imageUpload",
  "insertTable",
  "mediaEmbed",
  "|",
  "blockQuote",
  "undo",
  "redo",
];

let loaderPromise: Promise<any> | null = null;

const loadEditorScript = (src: string) => {
  if (window.ClassicEditor || window.DecoupledEditor || window.BalloonEditor) {
    return Promise.resolve(
      window.ClassicEditor || window.DecoupledEditor || window.BalloonEditor
    );
  }
  if (!loaderPromise) {
    loaderPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-ckeditor="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => {
          resolve(
            window.ClassicEditor ||
              window.DecoupledEditor ||
              window.BalloonEditor
          );
        });
        existing.addEventListener("error", reject);
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.setAttribute("data-ckeditor", src);
      script.onload = () =>
        resolve(
          window.ClassicEditor || window.DecoupledEditor || window.BalloonEditor
        );
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return loaderPromise;
};

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const lastValueRef = useRef<string>("");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const createEditor = async () => {
      if (!hostRef.current) return;
      try {
        const Editor = await loadEditorScript(CKEDITOR_URL);
        if (cancelled || !hostRef.current) return;
        if (!Editor) {
          setLoadError(true);
          return;
        }
        const createUploadAdapter = (editor: any) => {
          if (!editor?.plugins?.get) return;
          const repository = editor.plugins.get("FileRepository");
          if (!repository) return;
          repository.createUploadAdapter = (loader: any) => ({
            upload: async () => {
              const file = await loader.file;
              if (!file) {
                throw new Error("File is not available");
              }
              const url = await uploadImage(file);
              if (!url) {
                throw new Error("Upload failed");
              }
              return { default: url };
            },
            abort: () => undefined,
          });
        };
        try {
          editorRef.current = await Editor.create(hostRef.current, {
            placeholder,
            toolbar: FULL_TOOLBAR,
          });
        } catch (error) {
          try {
            editorRef.current = await Editor.create(hostRef.current, {
              placeholder,
              toolbar: SAFE_TOOLBAR,
            });
          } catch (fallbackError) {
            editorRef.current = await Editor.create(hostRef.current, {
              placeholder,
            });
          }
        }

        createUploadAdapter(editorRef.current);

        if (value) {
          editorRef.current.setData(value);
          lastValueRef.current = value;
        }
        editorRef.current.model.document.on("change:data", () => {
          const data = editorRef.current.getData();
          lastValueRef.current = data;
          onChange?.(data);
        });
      } catch (error) {
        setLoadError(true);
      }
    };

    createEditor();

    return () => {
      cancelled = true;
      if (editorRef.current) {
        editorRef.current.destroy().catch(() => undefined);
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === undefined) return;
    if (value !== lastValueRef.current) {
      editor.setData(value);
      lastValueRef.current = value;
    }
  }, [value]);

  if (loadError) {
    return (
      <div className="product-ckeditor">
        <textarea
          className="product-ckeditor-fallback"
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="product-ckeditor">
      <div ref={hostRef} />
    </div>
  );
}
