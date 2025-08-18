// src/components/editor/QuillEditor.jsx
import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

export default function QuillEditor({
    value = "",
    onChange,
    placeholder = "내용을 입력하세요",
    minHeight = 260,
}) {
    const containerRef = useRef(null);
    const quillRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const toolbar = [
            [{ header: [false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            ["clean"],
        ];

        const quill = new Quill(containerRef.current, {
            theme: "snow",
            placeholder,
            modules: { toolbar },
        });
        quillRef.current = quill;

        // 초기 값 주입
        quill.root.innerHTML = value || "";

        // 변경 이벤트 → 부모로 HTML 전송
        quill.on("text-change", () => {
            const html = quill.root.innerHTML;
            onChange?.(html);
        });

        return () => {
            // 간단 정리
            quill.off("text-change");
            quillRef.current = null;
        };
    }, []); // 최초 1회만

    // 외부 value가 바뀌면 에디터와 동기화
    useEffect(() => {
        const quill = quillRef.current;
        if (!quill) return;
        const current = quill.root.innerHTML;
        if ((value || "") !== current) {
            quill.root.innerHTML = value || "";
            // 커서 마지막으로
            quill.setSelection(quill.getLength(), 0);
        }
    }, [value]);

    return (
        <div
            className="quill-wrapper"
            style={{ minHeight, border: "1px solid #ccc", borderRadius: 4 }}
        >
            <div ref={containerRef} style={{ minHeight }} />
        </div>
    );
}
