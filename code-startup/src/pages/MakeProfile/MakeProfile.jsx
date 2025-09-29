//1-3. 프로필 사진 등록 페이지
import './MakeProfile.scss'
import MyRoutes from '/src/routes.jsx';
import {Link, useNavigate} from 'react-router-dom'
import { useRef, useState } from "react";

/**
 * 프로필 사진 업로더
 * props:
 * - onChange(file|null, dataUrl|null): 선택/삭제 시 콜백
 * - size: 미리보기 지름(px). 기본 160
 * - round: 원형 미리보기 여부. 기본 true
 * - maxSizeMB: 최대 용량(MB). 기본 5
 * - id: input id. 기본 "profilePhoto"
 */


// 기본 이미지 경로 (public/img/default-avatar.png 권장)
const DEFAULT_AVATAR_URL = "/img/default_profile.png"

// URL에서 File 객체 생성
async function fileFromUrl(url, filename = "default_profile.png") {
  const res = await fetch(url)
  const blob = await res.blob()
  return new File([blob], filename, { type: blob.type || "image/png" })
}

export default function MakeProfile({
  onChange,
  size = 160,
  round = true,
  maxSizeMB = 5,
  id = "profilePhoto",
}) {
  const inputRef = useRef(null);
  const navigate = useNavigate()

  const [preview, setPreview] = useState(null); // data URL
  const [photoFile, setPhotoFile] = useState(null) // ★ 선택/기본 파일 보관
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);      
  const [submitting, setSubmitting] = useState(false) // ★ 중복 클릭 방지

  const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

  const openPicker = () => inputRef.current?.click();

  const validateFile = (file) => {
    if (!ACCEPT.includes(file.type)) {
      return "PNG, JPG, WEBP 형식만 업로드할 수 있어요.";
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `파일이 너무 큽니다. 최대 ${maxSizeMB}MB까지 가능합니다.`;
    }
    return "";
  };

  const readAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });

  const handleFile = async (file) => {
    const v = validateFile(file);
    if (v) {
      setError(v);
      return;
    }
    setError("");
    const dataUrl = await readAsDataURL(file);
    setPreview(dataUrl);
    setPhotoFile(file)                 // ★ 파일 저장
    onChange?.(file, dataUrl);
  };

  const onInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  };

  const clear = () => {
    setPreview(null);
    setError("");
    setPhotoFile(null)                 // ★ 파일도 초기화
    if (inputRef.current) inputRef.current.value = "";
    onChange?.(null, null);
  };

  // ★ 다음 버튼: 사진 없으면 기본 이미지 자동 적용 후 이동
  const handleNext = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      let file = photoFile
      let dataUrl = preview

      if (!file) {
        file = await fileFromUrl(DEFAULT_AVATAR_URL)
        // 미리보기를 즉시 보여주고 싶다면 ObjectURL 사용
        dataUrl = URL.createObjectURL(file)
        setPreview(dataUrl)
        setPhotoFile(file)
        onChange?.(file, dataUrl)
      }

      // TODO: 업로드/전역스토어 저장이 필요하면 여기서 처리
      // const fd = new FormData(); fd.append("avatar", file);

      navigate("/makeidpassword")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="profile-uploader">
        <div className='maintext_container'>
            <div className='main_text' >
                사용자 프로필 사진을 <br/> 등록하세요.
            </div>
        </div>
        <div className="input_card">
          <div
            className={`pu-dropzone ${dragging ? "is-dragging" : ""} ${
            round ? "is-round" : ""
            } ${preview ? "has-image" : ""}`}
            style={{ "--size": `${size}px` }}
            role="button"
            tabIndex={0}
            onClick={openPicker}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
            onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            aria-describedby={`${id}-help ${id}-error`}
          >
          {preview ? (
            <img src={preview} alt="선택된 프로필 미리보기" />
            ) : (
            <div className="pu-placeholder"> 
              <div className="pu-plus" aria-hidden>
                +
              </div>
                <div className="pu-text">이미지 선택 또는 드래그</div>
            </div>
          )}
          </div>

          <input
                id={id}
                ref={inputRef}
                type="file"
                accept={ACCEPT.join(",")}
                onChange={onInputChange}
                hidden
          />

          <div id={`${id}-help`} className="form-text mt-2 help_text ">
                권장: 정사각형(1:1), 400*400px 이상 · PNG/JPG/WEBP · 최대 {maxSizeMB}MB
          </div>

          {error && (
                <div id={`${id}-error`} className="invalid-feedback d-block mt-1" aria-live="polite">
                {error}
                </div>
          )}

          <div className="d-flex gap-2 mt-3">
            <button
                type="button"
                className="btn btn-danger custom_btn"
                onClick={clear}
                disabled={!preview}
            >
                삭제
            </button>
            <button
                  type="button"
                  className="btn btn-primary custom_btn next_btn"
                  onClick={handleNext}
                  disabled={submitting}
                  data-hint="사진을 선택하지 않으면 기본 이미지로 적용됩니다"
            >
              {submitting ? "적용 중…" : "다음"}
              <img src="/img/arrow-forward-64.png" className="arrow" alt="" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
  );
}

