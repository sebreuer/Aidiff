import { useCallback } from "react";
import { useI18n } from "../i18n/I18nContext.jsx";
import { SearchableSlotPicker } from "./SearchableSlotPicker.jsx";

/** One model, two or three prompt columns (+ third via “+”). */
export function ComposerPromptCompare({
  promptSlot,
  setPromptSlot,
  promptDrafts,
  setPromptDrafts,
  modelOptions,
  listsLoading,
  apiKeysCommitted,
  textareaRefs,
  running,
  onPromptKeyDown,
}) {
  const { t } = useI18n();
  const n = promptDrafts.length;

  const adjustOne = useCallback(
    (index) => {
      const ta = textareaRefs?.current?.[index];
      if (!ta) return;
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
    },
    [textareaRefs]
  );

  const handleDraftChange = useCallback(
    (index, value) => {
      setPromptDrafts((prev) => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
      requestAnimationFrame(() => adjustOne(index));
    },
    [setPromptDrafts, adjustOne]
  );

  function removeThird() {
    if (n <= 2) return;
    setPromptDrafts((prev) => prev.slice(0, 2));
  }

  function addThird() {
    if (n >= 3) return;
    setPromptDrafts((prev) => [...prev, ""]);
  }

  return (
    <>
      <div className="composer-model-row">
        <div className="composer-model-col" style={{ flex: 1, borderRight: "none" }}>
          <SearchableSlotPicker
            slotIndex={0}
            providerKey={promptSlot.providerKey}
            modelValue={promptSlot.modelValue}
            onSlotChange={setPromptSlot}
            modelOptions={modelOptions}
            listsLoading={listsLoading}
            apiKeysCommitted={apiKeysCommitted}
            position="first"
          />
        </div>
      </div>
      <div className="composer-prompt-row">
        {promptDrafts.map((text, i) => {
          const noRightBorder = (n === 2 && i === 1) || (n === 3 && i === 2);
          return (
            <div key={i} className="composer-prompt-col" style={noRightBorder ? { borderRight: "none" } : undefined}>
              <div className="composer-prompt-col__head">
                <label className="composer-prompt-col__label" htmlFor={`aidiff-prompt-slot-${i}`}>
                  {t("composer.promptColumnLabel", { n: i + 1 })}
                </label>
                {n === 3 ? (
                  <button
                    type="button"
                    className="composer-prompt-col__remove"
                    aria-label={t("composer.removeThirdPromptAria")}
                    title={t("composer.removeThirdPromptTitle")}
                    disabled={running}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeThird();
                    }}
                  >
                    ×
                  </button>
                ) : null}
              </div>
              <textarea
                id={`aidiff-prompt-slot-${i}`}
                ref={(el) => {
                  if (textareaRefs?.current) textareaRefs.current[i] = el;
                }}
                value={text}
                placeholder={t("composer.promptPlaceholder")}
                disabled={running}
                onChange={(e) => handleDraftChange(i, e.target.value)}
                onInput={() => adjustOne(i)}
                onKeyDown={(e) => onPromptKeyDown?.(e)}
                onMouseDown={(e) => e.stopPropagation()}
                rows={2}
                className="composer-prompt-col__textarea"
              />
            </div>
          );
        })}
        {n < 3 && (
          <div className="composer-model-plusWrap composer-prompt-row__plusWrap">
            <button
              type="button"
              aria-label={t("composer.addThirdPromptAria")}
              title={t("composer.addThirdPromptTitle")}
              onClick={(e) => {
                e.stopPropagation();
                addThird();
              }}
              className="composer-model-plusBtn composer-prompt-row__plusBtn"
              disabled={running}
            >
              +
            </button>
          </div>
        )}
      </div>
    </>
  );
}
