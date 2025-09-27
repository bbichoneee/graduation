//1-3. 프로필 사진 등록 페이지
import './MakeProfile.scss'
import MyRoutes from '/src/routes.jsx';
import {Link} from 'react-router-dom'
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
export default function MakeProfile({
  onChange,
  size = 160,
  round = true,
  maxSizeMB = 5,
  id = "profilePhoto",
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null); // data URL
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

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
    if (inputRef.current) inputRef.current.value = "";
    onChange?.(null, null);
  };

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
                <Link to="/makeidpassword" className="btn btn-primary custom_btn" >다음
                    <img src = "/img/arrow-forward-64.png" className='arrow'></img>
                </Link>
            </div>
        </div>
    </div>
  );
}

