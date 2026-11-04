import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { LANGUAGES, type LanguageCode } from "@/i18n";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  return (
    <div className="language-select">
      <Globe size={17} aria-hidden="true" />
      <select
        aria-label={t("language.title")}
        value={i18n.language.startsWith("en") ? "en-US" : "zh-CN"}
        onChange={(event) => {
          const code = event.target.value as LanguageCode;
          i18n.changeLanguage(code);
          localStorage.setItem("it-toolbox-language", code);
          document.documentElement.lang = code;
        }}
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.code === "zh-CN" ? "中" : "EN"}
          </option>
        ))}
      </select>
    </div>
  );
}
