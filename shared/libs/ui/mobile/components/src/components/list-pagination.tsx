// A list's pagination — the web's ListPagination (list-query) on the phone: "x–y of n", previous and next. Hidden when there is nothing to page.
// Composite of the library's own: control-group--button-group · control--button · surface--button-group-text (as the Stepper).
import { Text as RNText, View, type StyleProp, type ViewStyle } from "react-native";
import { useElement } from "../theme";
import { Button } from "./button";

export interface ListPaginationProps {
  /** the page the list is at, and the page size */
  query: { page: number; pageSize: number };
  /** the total row count */
  total: number;
  /** the page the user asked for */
  onPageChange?: (page: number) => void;
  style?: StyleProp<ViewStyle>;
  /** the control's test id; its buttons take it as a prefix: <id>-previous-btn, <id>-next-btn */
  testID?: string;
}

export function ListPagination({ query, total, onPageChange, style, testID = "list-pagination" }: ListPaginationProps) {
  const { page, pageSize } = query;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const group = useElement("buttonGroup", { scale: "md" });
  const cell = useElement("buttonGroupText", { scale: "md" });
  if (total === 0 || pages <= 1) return null;
  const start = (page - 1) * pageSize + 1, end = Math.min(page * pageSize, total);
  return (
    <View testID={testID} style={[group.view, { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" }, style]}>
      <Button emphasis="quiet" startIcon="chevronLeft" accessibilityLabel="Previous page" disabled={page <= 1} onPress={() => onPageChange?.(page - 1)} testID={`${testID}-previous-btn`} />
      <RNText style={cell.text}>{`${start}–${end} of ${total}`}</RNText>
      <Button emphasis="quiet" startIcon="chevronRight" accessibilityLabel="Next page" disabled={page >= pages} onPress={() => onPageChange?.(page + 1)} testID={`${testID}-next-btn`} />
    </View>
  );
}
