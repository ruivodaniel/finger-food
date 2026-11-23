import type * as React from "react";

import type { ElementProps } from "../../../../../types/elements";
import { defineProps } from "../../../../lib/define-props";
import type { AxisName } from "../../../../lib/axes";
import { axesSchema } from "../../../../lib/axes-schema";

// Card and its regions are surfaces: surface--card, surface--header, surface--content, surface--footer.
export interface CardOwnProps extends ElementProps<"card"> {}

type Div = React.ComponentProps<"div">;
export type CardProps = CardOwnProps & Omit<Div, keyof CardOwnProps | AxisName>;
export type CardTitleProps = Div;
export type CardDescriptionProps = Div;
export type CardActionProps = Div;


export const cardSchema = defineProps<CardOwnProps>("Card", axesSchema("card"));
