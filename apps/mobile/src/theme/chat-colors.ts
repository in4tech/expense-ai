export type ChatThemeColors = {
  screen: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  topIcon: string;
  topActionBg: string;
  heroTitle: string;
  heroBody: string;
  orbOuter: string;
  orbInner: string;
  robotIcon: string;
  quickChipBg: string;
  quickChipBorder: string;
  quickChipText: string;
  chatHeaderTitle: string;
  userBubbleBg: string;
  userBubbleBorder: string;
  assistantBubbleBg: string;
  assistantBubbleBorder: string;
  bubbleUserText: string;
  bubbleAssistantText: string;
  messageTime: string;
  typing: string;
  errorBorder: string;
  errorBg: string;
  errorText: string;
  inputRowBg: string;
  inputRowBorder: string;
  composerText: string;
  secondaryBorder: string;
  drawerPanel: string;
  drawerPanelBorder: string;
  drawerBackdrop: string;
  historyItemBorder: string;
  historyItemBg: string;
  historyItemActiveBorder: string;
  historyItemActiveBg: string;
  historyMeta: string;
};

/** Chat screen palette (light/dark aligned with Settings). */
export function getChatThemeColors(isDark: boolean): ChatThemeColors {
  return {
    screen: isDark ? "#000000" : "#F5F5F5",
    text: isDark ? "#FFFFFF" : "#1A1A1A",
    textSecondary: isDark ? "#AEAEB2" : "#7D7D7D",
    textMuted: isDark ? "#8E8E93" : "#7D7691",
    topIcon: isDark ? "#EBEBF5" : "#5A556C",
    topActionBg: isDark ? "#2C2C2E" : "#ECE6F7",
    heroTitle: isDark ? "#F2F2F7" : "#2A2339",
    heroBody: isDark ? "#AEAEB2" : "#7B758D",
    orbOuter: isDark ? "#3A2F5C" : "#E8DFFB",
    orbInner: isDark ? "#5C4BA3" : "#C8BCF8",
    robotIcon: isDark ? "#C4B5F8" : "#4A3F86",
    quickChipBg: isDark ? "#2C2C2E" : "#EFE9FB",
    quickChipBorder: isDark ? "#48484A" : "#E3DBF7",
    quickChipText: isDark ? "#E5E5EA" : "#4E4761",
    chatHeaderTitle: isDark ? "#AEAEB2" : "#7D7691",
    userBubbleBg: isDark ? "#3D3558" : "#EDE6FD",
    userBubbleBorder: isDark ? "#6B5B9E" : "#CEC2F2",
    assistantBubbleBg: isDark ? "#1C1C1E" : "#FFFFFF",
    assistantBubbleBorder: isDark ? "#48484A" : "#E4DDF7",
    bubbleUserText: isDark ? "#F2F2F7" : "#11181C",
    bubbleAssistantText: isDark ? "#F2F2F7" : "#11181C",
    messageTime: isDark ? "#8E8E93" : "#8F88A4",
    typing: "#7B6CF6",
    errorBorder: isDark ? "#FF6B8A" : "#FFB7C4",
    errorBg: isDark ? "#3A2228" : "#FFF4F7",
    errorText: isDark ? "#FF8BA4" : "#CF3C63",
    inputRowBg: isDark ? "#1C1C1E" : "#FFFFFF",
    inputRowBorder: isDark ? "#48484A" : "#E8E0F6",
    composerText: isDark ? "#F2F2F7" : "#443C59",
    secondaryBorder: isDark ? "#FF8BA4" : "#FF9DB2",
    drawerPanel: isDark ? "#1C1C1E" : "#FAF7FF",
    drawerPanelBorder: isDark ? "#48484A" : "#E6DEF8",
    drawerBackdrop: isDark ? "rgba(0, 0, 0, 0.55)" : "rgba(23, 18, 38, 0.28)",
    historyItemBorder: isDark ? "#48484A" : "#E6DEF8",
    historyItemBg: isDark ? "#2C2C2E" : "#FFFFFF",
    historyItemActiveBorder: "#8C7AF8",
    historyItemActiveBg: isDark ? "#3D3558" : "#F1ECFF",
    historyMeta: isDark ? "#8E8E93" : "#8D86A1",
  };
}
