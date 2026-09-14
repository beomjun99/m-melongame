import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { THEME_CONFIG, getFruitSkin, mergeThemeWithDefault } from '../theme/config';
import type { GameTheme } from '../theme/types';
import { OBJECT_LEVELS } from '../game/config';

type ThemeSettingsProps = {
  theme: GameTheme;
  isSaving: boolean;
  message: string | null;
  onBack: () => void;
  onSave: (name: string, filesByLevel: Map<number, File>) => Promise<boolean>;
};

export function ThemeSettings({ theme, isSaving, message, onBack, onSave }: ThemeSettingsProps) {
  const [themeName, setThemeName] = useState('');
  const [pendingFiles, setPendingFiles] = useState(() => new Map<number, File>());
  const [previewUrls, setPreviewUrls] = useState(() => new Map<number, string>());
  const previewUrlsRef = useRef(previewUrls);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const mergedTheme = useMemo(() => mergeThemeWithDefault(theme), [theme]);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      for (const previewUrl of previewUrlsRef.current.values()) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const handleFileChange = (level: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!THEME_CONFIG.acceptedImageMimeTypes.includes(file.type as (typeof THEME_CONFIG.acceptedImageMimeTypes)[number])) {
      setValidationMessage('PNG, JPG, JPEG, WebP 이미지만 사용할 수 있습니다.');
      return;
    }

    if (file.size > THEME_CONFIG.maxImageSizeBytes) {
      setValidationMessage('이미지는 최대 2MB까지 등록할 수 있습니다.');
      return;
    }

    setValidationMessage(null);
    setPendingFiles((currentFiles) => new Map(currentFiles).set(level, file));
    setPreviewUrls((currentUrls) => {
      const nextUrls = new Map(currentUrls);
      const previousUrl = nextUrls.get(level);

      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      nextUrls.set(level, URL.createObjectURL(file));
      return nextUrls;
    });
  };

  const missingLevels = OBJECT_LEVELS
    .map((objectConfig) => objectConfig.level)
    .filter((level) => !pendingFiles.has(level) && !getFruitSkin(mergedTheme, level).imageUrl);

  return (
    <section className="theme-settings" aria-label="Character settings">
      <div className="theme-settings-header">
        <div>
          <span className="label">Theme</span>
          <h1>캐릭터 설정</h1>
        </div>
        <button type="button" onClick={onBack}>
          타이틀로
        </button>
      </div>

      <label className="theme-name-field">
        <span>라인업 이름</span>
        <input
          type="text"
          value={themeName}
          maxLength={80}
          placeholder="예: 내 캐릭터 라인업"
          onChange={(event) => setThemeName(event.target.value)}
        />
      </label>

      <div className="theme-grid">
        {OBJECT_LEVELS.map((objectConfig) => {
          const skin = getFruitSkin(mergedTheme, objectConfig.level);
          const previewUrl = previewUrls.get(objectConfig.level) ?? skin.imageUrl;

          return (
            <label className="theme-level-row" key={objectConfig.level}>
              <span>Level {objectConfig.level}</span>
              <span
                className="theme-preview"
                style={{
                  backgroundColor: skin.color,
                  backgroundImage: previewUrl ? `url(${previewUrl})` : undefined
                }}
                aria-hidden="true"
              >
                {!previewUrl && objectConfig.level}
              </span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                onChange={(event) => handleFileChange(objectConfig.level, event)}
              />
            </label>
          );
        })}
      </div>

      {(validationMessage || message) && (
        <p className="status-message">{validationMessage ?? message}</p>
      )}

      {missingLevels.length > 0 && (
        <p className="status-message">저장하려면 Level {missingLevels.join(', ')} 이미지가 필요합니다.</p>
      )}

      <button
        className="theme-save-button"
        type="button"
        disabled={isSaving || pendingFiles.size === 0 || missingLevels.length > 0 || !themeName.trim()}
        onClick={async () => {
          const saved = await onSave(themeName, pendingFiles);

          if (saved) {
            for (const previewUrl of previewUrlsRef.current.values()) {
              URL.revokeObjectURL(previewUrl);
            }

            setPendingFiles(new Map());
            setPreviewUrls(new Map());
          }
        }}
      >
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </section>
  );
}
