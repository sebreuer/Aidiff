import { renderAssessmentWithAnswerMarks } from "../lib/textMarkdown.jsx";
import { useI18n } from "../i18n/I18nContext.jsx";
import { DiffMiniVergleichCard } from "./DiffMiniVergleichCard.jsx";

/** Bewertungstext (ohne äußere Card — die liefert RunEntry). */
export function DiffUnterschiedeAssessment({ assessment }) {
  const { t } = useI18n();
  const proseTrim = String(assessment || "").trim();
  if (proseTrim) {
    return (
      <div style={{ fontSize: 13, lineHeight: 1.85, color: "var(--text)" }} className="aidiff-assessment-prose">
        {renderAssessmentWithAnswerMarks(proseTrim)}
      </div>
    );
  }
  return <span style={{ fontSize: 12, color: "var(--t3)" }}>{t("diff.noProseUnderAssessment")}</span>;
}

/** Mini-Vergleichstabelle (eigene Glass-Card im Child). */
export function DiffUnterschiedeMiniTable({ miniRows, slots, modelOptions, columnCount, rowOrder }) {
  return <DiffMiniVergleichCard rows={miniRows} slots={slots} modelOptions={modelOptions} columnCount={columnCount} rowOrder={rowOrder} />;
}
